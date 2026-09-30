const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Order = require('../models/Order');
const { validateObjectIdArray } = require('../middleware/security');

const router = express.Router();

// Simple in-memory cache
const cache = new Map();
const TTL = { bestSellers: 300_000, product: 300_000, catalog: 180_000 };

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) { cache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data, ttl) {
  cache.set(key, { data, ts: Date.now(), ttl });
}

/**
 * GET /api/products/best-sellers?limit=12
 * Aggregation: joins orders → counts item occurrences → sorts desc
 */
router.get('/best-sellers', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 24);
    const cacheKey = `best-sellers:${limit}`;
    const cached = getCache(cacheKey);
    if (cached) { res.setHeader('X-Cache', 'HIT'); return res.json(cached); }

    const topItems = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', soldCount: { $sum: '$items.quantity' } } },
      { $sort: { soldCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $match: { 'product.is_active': true } },
      {
        $lookup: {
          from: 'schools',
          localField: 'product.school_id',
          foreignField: '_id',
          as: 'school'
        }
      },
      { $unwind: { path: '$school', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'schoolstandards',
          localField: 'product.standard_id',
          foreignField: '_id',
          as: 'standard'
        }
      },
      { $unwind: { path: '$standard', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: '$product._id',
          name: '$product.name',
          item_type: '$product.item_type',
          price_paisa: '$product.price_paisa',
          mrp_paisa: '$product.mrp_paisa',
          primary_image: '$product.primary_image',
          images: '$product.images',
          itemSlug: '$product.itemSlug',
          tags: '$product.tags',
          is_active: '$product.is_active',
          soldCount: 1,
          school: { _id: '$school._id', name: '$school.name', city: '$school.city' },
          standard: { _id: '$standard._id', class_name: '$standard.class_name', gender: '$standard.gender' }
        }
      }
    ]);

    setCache(cacheKey, topItems, TTL.bestSellers);
    res.setHeader('X-Cache', 'MISS');
    res.json(topItems);
  } catch (error) {
    console.error('[Best Sellers]', error.message);
    res.status(500).json({ message: 'Failed to fetch best sellers.' });
  }
});

/**
 * GET /api/products/batch?ids=id1,id2,id3
 * Returns multiple products by ID — used by Recently Viewed
 */
router.get('/batch', validateObjectIdArray, async (req, res) => {
  try {
    const { ids = '' } = req.query;
    const rawIds = ids.split(',').map(s => s.trim()).filter(Boolean);

    if (rawIds.length === 0) return res.json([]);

    // Validate all IDs before querying
    const validIds = rawIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) return res.json([]);

    const products = await Product.find({
      _id: { $in: validIds },
      is_active: true
    })
      .populate('school_id', 'name city')
      .populate('standard_id', 'class_name gender')
      .lean();

    // Preserve input order
    const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));
    const ordered = validIds.map(id => productMap[id]).filter(Boolean);

    res.json(ordered);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
});

/**
 * GET /api/products/frequently-bought?standardId=:id&excludeId=:id
 * Returns other items from the same standard (companion items)
 */
router.get('/frequently-bought', async (req, res) => {
  try {
    const { standardId, limit = 4 } = req.query;
    const exclude = req.query.exclude || req.query.excludeId;

    if (!standardId || !mongoose.Types.ObjectId.isValid(standardId)) {
      return res.status(400).json({ message: 'Valid standardId is required.' });
    }

    const filter = {
      standard_id: new mongoose.Types.ObjectId(standardId),
      is_active: true
    };
    if (exclude && mongoose.Types.ObjectId.isValid(exclude)) {
      filter._id = { $ne: new mongoose.Types.ObjectId(exclude) };
    }

    const items = await Product.find(filter)
      .limit(parseInt(limit))
      .populate('school_id', 'name')
      .lean();

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch frequently bought items.' });
  }
});

/**
 * GET /api/products/recommendations?schoolId=:id&exclude=:itemId&limit=6
 * Returns items from same school, different itemType — for Cart "You might also need"
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { schoolId, exclude, limit = 6 } = req.query;

    if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({ message: 'Valid schoolId is required.' });
    }

    const filter = {
      school_id: new mongoose.Types.ObjectId(schoolId),
      is_active: true
    };
    if (exclude && mongoose.Types.ObjectId.isValid(exclude)) {
      filter._id = { $ne: new mongoose.Types.ObjectId(exclude) };
    }

    const items = await Product.find(filter)
      .limit(parseInt(limit))
      .populate('school_id', 'name')
      .populate('standard_id', 'class_name gender')
      .lean();

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recommendations.' });
  }
});

/**
 * GET /api/products
 * Full filtered catalog with aggregation pipeline
 * Params: school, standard, gender, type, size, minPrice, maxPrice, sort, page, limit
 */
router.get('/', async (req, res) => {
  try {
    const {
      school, standard, gender, type, size,
      minPrice = 0, maxPrice = 1000000,
      sort = 'newest', page = 1, limit = 24
    } = req.query;

    const pageNum  = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(parseInt(limit) || 24, 48);
    const skip     = (pageNum - 1) * limitNum;

    // Build match stage
    const match = { is_active: true };
    if (school   && mongoose.Types.ObjectId.isValid(school))   match.school_id   = new mongoose.Types.ObjectId(school);
    if (standard && mongoose.Types.ObjectId.isValid(standard)) match.standard_id = new mongoose.Types.ObjectId(standard);
    if (type)    match.item_type = type;
    match.price_paisa = {
      $gte: parseInt(minPrice) * 100,
      $lte: parseInt(maxPrice) * 100
    };

    // Sort stage
    const sortMap = {
      price_asc:    { price_paisa: 1 },
      price_desc:   { price_paisa: -1 },
      newest:       { created_at: -1 },
      best_sellers: { price_paisa: -1 } // approximation; real best-sellers need order join
    };
    const sortStage = sortMap[sort] || { created_at: -1 };

    // Use $facet to get total count + paginated results in one round-trip
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'schoolstandards',
          localField: 'standard_id',
          foreignField: '_id',
          as: 'standard'
        }
      },
      { $unwind: { path: '$standard', preserveNullAndEmptyArrays: true } },
      // Filter by gender if provided
      ...(gender ? [{ $match: { 'standard.gender': gender } }] : []),
      {
        $lookup: {
          from: 'schools',
          localField: 'school_id',
          foreignField: '_id',
          as: 'school'
        }
      },
      { $unwind: { path: '$school', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'productvariants',
          localField: '_id',
          foreignField: 'product_id',
          as: 'variants'
        }
      },
      // Filter by size availability if provided
      ...(size ? [{
        $match: {
          'variants': {
            $elemMatch: { size, stock_qty: { $gt: 0 }, is_available: true }
          }
        }
      }] : []),
      {
        $facet: {
          meta: [{ $count: 'total' }],
          data: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limitNum },
            {
              $project: {
                name: 1, item_type: 1, uniform_type: 1,
                price_paisa: 1, mrp_paisa: 1,
                primary_image: 1, images: 1,
                itemSlug: 1, tags: 1, is_active: 1,
                created_at: 1,
                school: { _id: '$school._id', name: '$school.name', city: '$school.city', logo: '$school.logo' },
                standard: { _id: '$standard._id', class_name: '$standard.class_name', gender: '$standard.gender' },
                variants: {
                  $map: {
                    input: '$variants',
                    as: 'v',
                    in: { size: '$$v.size', stock_qty: '$$v.stock_qty', is_available: '$$v.is_available', _id: '$$v._id' }
                  }
                }
              }
            }
          ]
        }
      }
    ];

    const [result] = await Product.aggregate(pipeline);
    const total = result.meta[0]?.total || 0;
    const products = result.data || [];

    res.json({
      products,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('[Products]', error.message);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
});

/**
 * GET /api/products/:slugOrId
 * Full product detail — by slug or ObjectId
 */
router.get('/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;

    const filter = mongoose.Types.ObjectId.isValid(slugOrId)
      ? { _id: slugOrId }
      : { itemSlug: slugOrId };

    const product = await Product.findOne({ ...filter, is_active: true })
      .populate('school_id', 'name city logo')
      .populate('standard_id', 'class_name gender school_id')
      .lean();

    if (!product) return res.status(404).json({ message: 'Product not found.' });

    // Fetch variants (sizes + stock)
    const variants = await ProductVariant.find({ product_id: product._id })
      .sort({ size: 1 })
      .lean();

    res.json({ ...product, variants });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product.' });
  }
});

module.exports = router;
