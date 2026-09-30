const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const csv = require('csvtojson');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const School = require('../models/School');
const User = require('../models/User');
const { auth, admin } = require('../middleware/auth');

const router = express.Router();

// Memory storage for CSV uploads
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed.'));
    }
  }
});

/**
 * GET /api/admin/analytics/dashboard/kpis
 * Returns today's orders, revenue, low stock count, new users today
 */
router.get('/dashboard/kpis', auth, admin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      todayRevenue,
      lowStockCount,
      newUsersToday
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today }, paymentStatus: 'paid' }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      ProductVariant.countDocuments({ stock_qty: { $lt: 5 }, is_available: true }),
      User.countDocuments({ createdAt: { $gte: today } })
    ]);

    res.json({
      todayOrders,
      todayRevenue: todayRevenue[0]?.total || 0,
      lowStockCount,
      newUsersToday
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/admin/analytics
 * Returns unified analytics including last 30d revenue, top-selling products, and school metrics
 */
router.get('/analytics', auth, admin, async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [rawRevenue, rawTopItems, rawSchoolMetrics] = await Promise.all([
      // 1. Last 30 days daily revenue
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            orderStatus: { $nin: ['cancelled', 'returned'] },
            createdAt: { $gte: since }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 2. Top-selling products
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            soldCount: { $sum: '$items.quantity' },
            revenue:   { $sum: { $multiply: ['$items.price_paisa', '$items.quantity'] } },
            itemName:  { $first: '$items.itemName' }
          }
        },
        { $sort: { soldCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            itemName: { $ifNull: ['$product.name', '$itemName'] },
            soldCount: 1,
            revenue: 1
          }
        }
      ]),

      // 3. School Metrics
      Order.aggregate([
        { $match: { paymentStatus: 'paid', orderStatus: { $nin: ['cancelled', 'returned'] } } },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        {
          $group: {
            _id: { $first: '$productInfo.school_id' },
            revenue: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'schools',
            localField: '_id',
            foreignField: '_id',
            as: 'school'
          }
        },
        { $unwind: { path: '$school', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            schoolId: '$_id',
            schoolName: { $ifNull: ['$school.name', 'Unknown'] },
            revenue: 1,
            orderCount: 1
          }
        },
        { $sort: { revenue: -1 } }
      ])
    ]);

    // Map output to exact frontend data fields
    const revenueData = rawRevenue.map(d => ({
      totalRevenue: d.revenue,
      orderCount: d.orderCount
    }));

    const topItems = rawTopItems.map(item => ({
      _id: item._id,
      name: item.itemName,
      totalSold: item.soldCount,
      revenue: item.revenue
    }));

    const schoolMetrics = rawSchoolMetrics.map(s => ({
      _id: s.schoolId,
      name: s.schoolName,
      revenue: s.revenue,
      orders: s.orderCount
    }));

    res.json({
      revenueData,
      topItems,
      schoolMetrics
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/admin/analytics/revenue?period=daily|weekly|monthly
 * Revenue aggregation by time period
 */
router.get('/analytics/revenue', auth, admin, async (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    const dateFormat = {
      daily:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      weekly:  { $dateToString: { format: '%Y-W%V',  date: '$createdAt' } },
      monthly: { $dateToString: { format: '%Y-%m',   date: '$createdAt' } }
    };
    const groupFormat = dateFormat[period] || dateFormat.daily;

    // Limit time range
    const daysBack = period === 'monthly' ? 365 : period === 'weekly' ? 84 : 30;
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const data = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          orderStatus: { $nin: ['cancelled', 'returned'] },
          createdAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1, orderCount: 1 } }
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/admin/analytics/top-items?limit=10
 * Best-selling items with revenue figures (admin only)
 */
router.get('/analytics/top-items', auth, admin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const topItems = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          soldCount: { $sum: '$items.quantity' },
          revenue:   { $sum: { $multiply: ['$items.price_paisa', '$items.quantity'] } },
          itemName:  { $first: '$items.itemName' }
        }
      },
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
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          itemName: { $ifNull: ['$product.name', '$itemName'] },
          soldCount: 1,
          revenue: 1,
          primary_image: '$product.primary_image'
        }
      }
    ]);

    res.json(topItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/admin/analytics/by-school
 * Revenue and order count grouped by school
 */
router.get('/analytics/by-school', auth, admin, async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { paymentStatus: 'paid', orderStatus: { $nin: ['cancelled', 'returned'] } } },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $group: {
          _id: { $first: '$productInfo.school_id' },
          revenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'schools',
          localField: '_id',
          foreignField: '_id',
          as: 'school'
        }
      },
      { $unwind: { path: '$school', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          schoolId: '$_id',
          schoolName: { $ifNull: ['$school.name', 'Unknown'] },
          revenue: 1,
          orderCount: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/admin/inventory?lowStock=true&threshold=5
 * Returns all variants with optional low-stock filter
 */
router.get('/inventory', auth, admin, async (req, res) => {
  try {
    const { lowStock, threshold = 5 } = req.query;
    const thresholdNum = parseInt(threshold);

    const variantFilter = {};
    if (lowStock === 'true') {
      variantFilter.stock_qty = { $lt: thresholdNum };
      variantFilter.is_available = true;
    }

    const variants = await ProductVariant.find(variantFilter)
      .populate({
        path: 'product_id',
        select: 'name item_type school_id standard_id primary_image',
        populate: [
          { path: 'school_id', select: 'name' },
          { path: 'standard_id', select: 'class_name gender' }
        ]
      })
      .sort({ stock_qty: 1 }) // lowest stock first
      .lean();

    res.json(variants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * PATCH /api/admin/inventory/:variantId
 * Inline stock update for a specific variant
 * Body: { stock_qty: Number }
 */
router.patch('/inventory/:variantId', auth, admin, async (req, res) => {
  try {
    const { variantId } = req.params;
    const { stock_qty } = req.body;

    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ message: 'Invalid variant ID.' });
    }
    if (typeof stock_qty !== 'number' || stock_qty < 0) {
      return res.status(400).json({ message: 'stock_qty must be a non-negative number.' });
    }

    const variant = await ProductVariant.findByIdAndUpdate(
      variantId,
      {
        $set: {
          stock_qty,
          is_available: stock_qty > 0
        }
      },
      { new: true }
    );

    if (!variant) return res.status(404).json({ message: 'Variant not found.' });
    res.json(variant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/admin/inventory/bulk-import
 * Accepts CSV: itemId (productId), size, newStock
 * Processes with bulkWrite for efficiency
 */
router.post('/inventory/bulk-import', auth, admin, csvUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'CSV file is required.' });

    const csvString = req.file.buffer.toString('utf-8');

    // Parse CSV
    let rows;
    try {
      rows = await csv().fromString(csvString);
    } catch {
      return res.status(400).json({ message: 'Invalid CSV format.' });
    }

    // Validate headers
    const required = ['itemId', 'size', 'newStock'];
    const headers = Object.keys(rows[0] || {});
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      return res.status(400).json({ message: `CSV missing required columns: ${missing.join(', ')}` });
    }

    const errors = [];
    const ops = [];

    for (const [i, row] of rows.entries()) {
      const { itemId, size, newStock } = row;
      const rowNum = i + 2; // 1-indexed + header

      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        errors.push({ row: rowNum, error: `Invalid itemId: ${itemId}` });
        continue;
      }
      const stock = parseInt(newStock);
      if (isNaN(stock) || stock < 0) {
        errors.push({ row: rowNum, error: `Invalid newStock: ${newStock}` });
        continue;
      }

      ops.push({
        updateOne: {
          filter: { product_id: new mongoose.Types.ObjectId(itemId), size: size.trim() },
          update: { $set: { stock_qty: stock, is_available: stock > 0 } }
        }
      });
    }

    let result = { matchedCount: 0, modifiedCount: 0 };
    if (ops.length > 0) {
      result = await ProductVariant.bulkWrite(ops);
    }

    res.json({
      updated: result.modifiedCount,
      matched: result.matchedCount,
      skipped: errors.length,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Updates order status and appends tracking[] entry. Sends email.
 */
router.patch('/orders/:id/status', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID.' });
    }

    const validStatuses = [
      'pending', 'processing', 'confirmed', 'packed',
      'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const trackingEntry = { status, timestamp: new Date(), note: note || '' };

    const order = await Order.findByIdAndUpdate(
      id,
      {
        $set: { orderStatus: status },
        $push: { tracking: trackingEntry }
      },
      { new: true }
    ).populate('user', 'name email');

    if (!order) return res.status(404).json({ message: 'Order not found.' });

    // Fire transactional email for key status changes
    if (['confirmed', 'shipped', 'delivered'].includes(status) && order.user?.email) {
      const { sendStatusUpdateEmail } = require('../services/emailService');
      sendStatusUpdateEmail(order, status).catch(e =>
        console.error('[Admin] Status email failed:', e.message)
      );
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * PATCH /api/admin/orders/:id
 * Updates order status and logs tracking history.
 */
router.patch('/orders/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const status = req.body.orderStatus || req.body.status;
    const note = req.body.note || `Order status updated to ${status}`;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID.' });
    }

    const validStatuses = [
      'pending', 'processing', 'confirmed', 'packed',
      'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'
    ];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` });
    }

    const trackingEntry = { status, timestamp: new Date(), note };

    const updateData = { orderStatus: status };
    if (status === 'cancelled') {
      updateData.paymentStatus = 'refund_pending';
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        $set: updateData,
        $push: { tracking: trackingEntry }
      },
      { new: true }
    ).populate('user', 'name email');

    if (!order) return res.status(404).json({ message: 'Order not found.' });

    // Fire transactional email for key status changes
    if (['confirmed', 'shipped', 'delivered'].includes(status) && order.user?.email) {
      const { sendStatusUpdateEmail } = require('../services/emailService');
      sendStatusUpdateEmail(order, status).catch(e =>
        console.error('[Admin] Status email failed:', e.message)
      );
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
