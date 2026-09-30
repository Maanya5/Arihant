const express = require('express');
const multer = require('multer');

const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const School = require('../models/School');
const { auth, admin } = require('../middleware/auth');
// Email service import removed
const User = require('../models/User');
const { invalidateSchoolCache } = require('../services/cacheService');
const router = express.Router();

// Use memory storage to store image buffer directly
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Dashboard Stats route
router.get('/stats', auth, admin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      todayOrders,
      weekOrders, 
      monthOrders,
      totalOrders,
      totalRevenue,
      pendingOrders,
      totalSchools,
      lowStockItems,
      productsCount
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today }, paymentStatus: 'paid' }),
      Order.countDocuments({ createdAt: { $gte: weekAgo }, paymentStatus: 'paid' }),
      Order.countDocuments({ createdAt: { $gte: monthAgo }, paymentStatus: 'paid' }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: { $in: ['paid', 'pending'] }, orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.countDocuments({ paymentStatus: 'paid', orderStatus: 'pending' }),
      School.countDocuments({ is_active: true }),
      ProductVariant.countDocuments({ stock_qty: { $lte: 5 }, is_available: true }),
      Product.countDocuments({ is_active: true })
    ]);

    res.json({
      todayOrders,
      weekOrders,
      monthOrders,
      totalOrders,
      totalRevenuePaisa: totalRevenue[0]?.total || 0,
      pendingOrders,
      totalSchools,
      lowStock: lowStockItems,
      productsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload image (Neutral name to bypass adblockers)
router.post('/up-img', auth, admin, (req, res) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('[Multer Error]:', err);
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      console.error('[Upload Error]:', err);
      return res.status(500).json({ message: `Server error: ${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
    }

    // Convert the image buffer directly to a Base64 string for database storage
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    console.log('[Database Storage] Successfully encoded image to base64');
    res.json({ 
      imageUrl: base64Image,
      public_id: `db-img-${Date.now()}`
    });
  });
});

const Standard = require('../models/Standard');

// Toggle school active/inactive
router.patch('/schools/:id/toggle', auth, admin, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });
    
    school.is_active = !school.is_active;
    await school.save();
    
    res.json({ message: 'Status updated', is_active: school.is_active });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin add standards (supports 'both')
router.post('/standards', auth, admin, async (req, res) => {
  try {
    const { school_id, class_name, gender, division } = req.body;
    
    if (gender === 'both') {
      const boy = await Standard.create({ school_id, class_name, gender: 'boy', division });
      const girl = await Standard.create({ school_id, class_name, gender: 'girl', division });
      return res.status(201).json({ created: [boy, girl] });
    }
    
    const std = await Standard.create({ school_id, class_name, gender, division });
    res.status(201).json({ created: [std] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// CATALOGUE (Products & Variants)
// ==============================

// Get all products (Admin view)
router.get('/products', auth, admin, async (req, res) => {
  try {
    const { school_id, standard_id, item_type } = req.query;
    const filter = {};
    if (school_id) filter.school_id = school_id;
    if (standard_id) filter.standard_id = standard_id;
    if (item_type) filter.item_type = item_type;

    const products = await Product.find(filter)
      .populate('school_id', 'name')
      .populate('standard_id', 'class_name gender')
      .sort({ created_at: -1 });

    // For admin, we also want to attach variants to each product
    const productsWithVariants = await Promise.all(products.map(async (p) => {
      const variants = await ProductVariant.find({ product_id: p._id }).sort({ size: 1 });
      return { ...p.toObject(), variants };
    }));

    res.json(productsWithVariants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create product (Neutral name)
router.post('/p-new', auth, admin, async (req, res) => {
  try {
    const { standard_id, school_id, name, item_type, uniform_type, price_paisa, image_url, is_active } = req.body;
    
    const product = await Product.create({
      standard_id, school_id, name, item_type, uniform_type, price_paisa, image_url, is_active: is_active ?? true
    });
    
    // Auto-create variants based on item_type
    const sizeMap = {
      shoes: ['UK3','UK4','UK5','UK6','UK7','UK8','UK9','UK10'],
      socks: ['S','M','L'],
      default: ['XS','S','M','L','XL','XXL']
    };
    
    const isShoes = product.name.toLowerCase().includes('shoes');
    const isSocks = product.name.toLowerCase().includes('socks');
    const sizes = isShoes ? sizeMap.shoes : isSocks ? sizeMap.socks : sizeMap.default;
    
    const variants = sizes.map(size => ({
      product_id: product._id,
      size,
      stock_qty: 0,
      is_available: true
    }));
    await ProductVariant.insertMany(variants);
    
    // Invalidate cache on creation
    await invalidateSchoolCache(school_id);
    
    res.status(201).json({ product, variantsCreated: variants.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update product (Neutral name)
router.put('/p-save/:id', auth, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (product) await invalidateSchoolCache(product.school_id);
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle active product (Neutral name)
router.patch('/p-tog/:id', auth, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    product.is_active = !product.is_active;
    await product.save();
    await invalidateSchoolCache(product.school_id);
    res.json({ message: 'Product toggled', is_active: product.is_active });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update variant using a completely generic endpoint name
router.put('/v-upd/:id', auth, admin, async (req, res) => {
  try {
    const { stock_qty } = req.body;
    const variant = await ProductVariant.findById(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variant not found' });
    
    variant.stock_qty = parseInt(stock_qty);
    variant.is_available = parseInt(stock_qty) > 0;
    await variant.save();
    
    // Fetch product to get school_id for cache invalidation
    const product = await Product.findById(variant.product_id);
    if (product) await invalidateSchoolCache(product.school_id);
    
    res.json(variant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// ORDERS MANAGEMENT
// ==============================

// Get all orders with filtering and pagination
router.get('/orders', auth, admin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }
    
    const rawOrders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate({
        path: 'items.product',
        select: 'name image_url'
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    // Map to frontend expected schema (Supporting both custom mapping and raw database properties)
    const orders = rawOrders.map(o => {
      const obj = o.toObject();
      return {
        ...obj,
        _id: obj._id,
        created_at: obj.createdAt,
        user_id: obj.user, // populate fills this
        order_status: obj.orderStatus,
        payment_status: obj.paymentStatus,
        total_paisa: obj.totalAmount, 
        tracking_number: obj.trackingNumber,
        address: obj.shippingAddress ? `${obj.shippingAddress.street}, ${obj.shippingAddress.city}, ${obj.shippingAddress.state} - ${obj.shippingAddress.pincode}` : 'No Address',
        items: obj.items.map(i => ({
           ...i,
           product_id: i.product,
           product_name_snapshot: i.itemName,
           size_snapshot: i.size,
           quantity: i.quantity,
           price_paisa_snapshot: i.price_paisa
        }))
      };
    });
    
    const total = await Order.countDocuments(filter);
    
    res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status and tracking (Generic name to bypass adblockers)
router.put('/o-upd/:id', auth, admin, async (req, res) => {
  try {
    // Debug: log exact payload to see what frontend is sending
    console.log('[DEBUG] Status Update req.body:', JSON.stringify(req.body));

    // Fix 1: accept all possible field name formats from frontend
    const order_status = req.body.order_status || req.body.orderStatus || req.body.status;
    const tracking_number = req.body.tracking_number || req.body.trackingNumber;

    console.log(`[Admin] Updating order ${req.params.id} to status: ${order_status}`);

    if (!order_status) {
      return res.status(400).json({ message: 'No status provided in request body' });
    }

    const validStatuses = ['pending', 'processing', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({ 
        message: `Invalid status "${order_status}". Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const updateData = { orderStatus: order_status };

    // Fix 2: handle tracking number for shipped
    if (order_status === 'shipped' && tracking_number) {
      updateData.trackingNumber = tracking_number;
    }

    // Fix 3: mark payment as refund_pending when cancelled
    if (order_status === 'cancelled') {
      updateData.paymentStatus = 'refund_pending';
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Email sending removed as per request

    console.log(`[Admin] Order ${req.params.id} updated to "${order_status}" successfully`);
    res.json({ 
      success: true,
      message: `Order status updated to ${order_status}`,
      order 
    });

  } catch (error) {
    console.error(`[Admin] Status update failed:`, error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// ==============================
// IMAGE PIPELINE (Unsplash → Cloudinary)
// ==============================
const { fetchAndStoreImages } = require('../services/imagePipelineService');

// Fetch images for a single product (Neutral name)
router.post('/p-img-get/:productId', auth, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { imageCount = 4 } = req.body;

    // Run the full pipeline
    const gallery = await fetchAndStoreImages(
      product.name,
      product._id.toString(),
      Math.min(imageCount, 5) // cap at 5
    );

    if (gallery.length === 0) {
      return res.status(422).json({
        message: 'No images found or upload failed. Try again later.',
        itemName: product.name
      });
    }

    // Save gallery to product
    product.images = gallery;
    product.primary_image = gallery[0].url;
    product.image_url = gallery[0].url; // keep legacy field in sync
    await product.save();

    res.json({
      message: `${gallery.length} images fetched and stored successfully`,
      product_id: product._id,
      images: gallery
    });

  } catch (error) {
    console.error('[Admin] Image fetch error:', error);
    res.status(500).json({
      message: 'Image fetch failed',
      error: error.message
    });
  }
});

// Bulk fetch images (Neutral name)
router.post('/s-img-all/:schoolId', auth, admin, async (req, res) => {
  try {
    const products = await Product.find({
      school_id: req.params.schoolId,
      is_active: true,
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } },
        { primary_image: null }
      ]
    });

    if (products.length === 0) {
      return res.json({
        message: 'All products already have images',
        total: 0,
        success_count: 0,
        failed_count: 0
      });
    }

    const results = { success: [], failed: [] };

    // Process one by one to respect Unsplash rate limits
    for (const product of products) {
      try {
        // Wait 1.2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 1200));

        const gallery = await fetchAndStoreImages(
          product.name,
          product._id.toString(),
          4
        );

        if (gallery.length > 0) {
          product.images = gallery;
          product.primary_image = gallery[0].url;
          product.image_url = gallery[0].url;
          await product.save();
          results.success.push(product.name);
        } else {
          results.failed.push(product.name);
        }
      } catch (err) {
        console.error(`[Bulk] Failed for "${product.name}":`, err.message);
        results.failed.push(product.name);
      }
    }

    res.json({
      message: 'Bulk image fetch complete',
      total: products.length,
      success_count: results.success.length,
      failed_count: results.failed.length,
      success: results.success,
      failed: results.failed
    });

  } catch (error) {
    console.error('[Admin] Bulk fetch error:', error);
    res.status(500).json({
      message: 'Bulk fetch failed',
      error: error.message
    });
  }
});

module.exports = router;
