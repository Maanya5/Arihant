const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { auth, admin } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/security');

const router = express.Router();

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?auto=format&fit=crop&q=80&w=800';

// Simple in-memory cache for uniform-items
const cache = new Map();
const CACHE_TTL = 180 * 1000; // 180 seconds

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// Invalidate cache helper
router.invalidateCache = () => {
  cache.clear();
};

/**
 * GET /api/uniform-items (Product Listing Page)
 * ADD query params: school, standard, gender, type, size, minPrice, maxPrice, sort, page, limit.
 * Refactor to use a single MongoDB aggregation pipeline.
 * Add $facet to return total count alongside items in one round-trip.
 * Cache in memory/Redis with TTL 180s.
 */
router.get('/', async (req, res) => {
  try {
    const {
      school, standard, gender, type, size,
      minPrice = 0, maxPrice = 1000000,
      sort = 'newest', page = 1, limit = 24
    } = req.query;

    // Create unique cache key based on sorted query params
    const sortedParams = Object.keys(req.query).sort().map(k => `${k}=${req.query[k]}`).join('&');
    const cacheKey = `uniform-items:${sortedParams}`;
    const cached = getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

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
      best_sellers: { price_paisa: -1 }
    };
    const sortStage = sortMap[sort] || { created_at: -1 };

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

    const responseData = {
      products,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    };

    setCache(cacheKey, responseData);
    res.setHeader('X-Cache', 'MISS');
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
});

/**
 * GET /api/uniform-items/:id (Product Detail Page)
 * ADD: populate standard (with school populated inside), return full sizes[] array.
 * ADD: return images[] array (currently only imageUrl — expand to array).
 * Ensure imageUrl field maps to images[0] for backwards compat.
 */
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, is_active: true })
      .populate({
        path: 'standard_id',
        populate: { path: 'school_id', select: 'name city logo' }
      })
      .populate('school_id', 'name city logo')
      .lean();

    if (!product) return res.status(404).json({ message: 'Product not found.' });

    // Fetch variants
    const variants = await ProductVariant.find({ product_id: product._id })
      .sort({ size: 1 })
      .lean();

    // Map properties for backwards compatibility
    const imagesArray = (product.images && product.images.length > 0)
      ? product.images.map(img => img.url)
      : [product.primary_image || product.image_url || PLACEHOLDER_IMG];

    const formattedProduct = {
      ...product,
      variants,
      sizes: variants.map(v => ({ size: v.size, stock: v.stock_qty })), // return full sizes array as size-stock mapping
      images: imagesArray,
      imageUrl: imagesArray[0] || ''
    };

    res.json(formattedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product.' });
  }
});

// GET /api/uniform-items/school/:schoolId/standard/:standardId
router.get('/school/:schoolId/standard/:standardId', async (req, res) => {
  try {
    const { schoolId, standardId } = req.params;
    
    // Find all active products matching school_id and standard_id
    const products = await Product.find({
      school_id: schoolId,
      standard_id: standardId,
      is_active: true
    }).populate('school_id', 'name city logo')
      .populate('standard_id', 'class_name gender')
      .lean();

    // Fetch and append variants for each product
    const formattedProducts = await Promise.all(products.map(async (product) => {
      const variants = await ProductVariant.find({ product_id: product._id })
        .sort({ size: 1 })
        .lean();
      
      const imagesArray = (product.images && product.images.length > 0)
        ? product.images.map(img => img.url)
        : [product.primary_image || product.image_url || PLACEHOLDER_IMG];

      return {
        ...product,
        variants,
        sizes: variants.map(v => ({ size: v.size, stock: v.stock_qty })),
        images: imagesArray,
        imageUrl: imagesArray[0] || ''
      };
    }));

    res.json(formattedProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/uniform-items (Admin only)
router.post('/', auth, admin, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    cache.clear(); // invalidate cache on update
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/uniform-items/:id (Admin only)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    cache.clear(); // invalidate cache on update
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/uniform-items/:id (Admin only)
router.delete('/:id', auth, admin, validateObjectId, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    
    // Also delete associated variants
    await ProductVariant.deleteMany({ product_id: req.params.id });
    
    cache.clear(); // invalidate PLP cache
    res.json({ success: true, message: 'Product and variants deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
