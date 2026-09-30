const mongoose = require('mongoose');
require('dotenv').config();

// Disable auto-indexing on connection so we can drop conflicting indexes manually first
mongoose.set('autoIndex', false);

// Import models
const Product = require('./models/Product');
const Order = require('./models/Order');
const School = require('./models/School');
const Standard = require('./models/Standard');
const Wishlist = require('./models/Wishlist');
const Coupon = require('./models/Coupon');
const Inquiry = require('./models/Inquiry');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?auto=format&fit=crop&q=80&w=800';

async function run() {
  try {
    console.log('🔄 Connecting to MongoDB at', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB Connected successfully!');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MIGRATION 001: uniform_items/products details
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('\n--- Running Migration 001: Product Details (Slugs, Images, MRP, Tags) ---');
    const products = await Product.find({});
    console.log(`Found ${products.length} products to check.`);

    let updatedProducts = 0;
    for (const p of products) {
      let isModified = false;

      // Clean up base64 image_url to prevent tripling size and hitting 16MB BSON limit
      if (p.image_url && p.image_url.startsWith('data:')) {
        console.log(`🧹 Cleaning up massive base64 image_url in product "${p.name}"`);
        p.image_url = PLACEHOLDER_IMG;
        isModified = true;
      }
      if (p.primary_image && p.primary_image.startsWith('data:')) {
        p.primary_image = PLACEHOLDER_IMG;
        isModified = true;
      }

      // 1. Ensure images is populated
      if (!p.images || p.images.length === 0) {
        const urlToUse = p.image_url || p.primary_image || PLACEHOLDER_IMG;
        p.images = [{ url: urlToUse, is_primary: true }];
        p.primary_image = urlToUse;
        isModified = true;
      } else {
        // Check nested images array for base64
        for (const img of p.images) {
          if (img.url && img.url.startsWith('data:')) {
            img.url = PLACEHOLDER_IMG;
            isModified = true;
          }
        }
      }

      // 2. Ensure mrp_paisa is set
      if (p.mrp_paisa === undefined || p.mrp_paisa === null) {
        p.mrp_paisa = p.price_paisa || 0;
        isModified = true;
      }

      // 3. Ensure tags is set
      if (!p.tags) {
        p.tags = [];
        isModified = true;
      }

      // 4. Ensure slug is generated
      if (!p.itemSlug) {
        let slug = slugify(p.name);
        if (p.school_id) slug += '-' + p.school_id.toString().slice(-4);
        if (p.standard_id) slug += '-' + p.standard_id.toString().slice(-4);
        p.itemSlug = slug;
        isModified = true;
      }

      if (isModified) {
        await p.save();
        updatedProducts++;
      }
    }
    console.log(`✅ Migration 001 Complete. Updated ${updatedProducts} products.`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MIGRATION 002 & 003: Orders Tracking, delivery dates, coupons, statuses
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('\n--- Running Migration 002 & 003: Order Fields & Statuses ---');
    const orders = await Order.find({});
    console.log(`Found ${orders.length} orders to check.`);

    let updatedOrders = 0;
    for (const o of orders) {
      let isModified = false;

      // Ensure tracking timeline is set
      if (!o.tracking || o.tracking.length === 0) {
        o.tracking = [{
          status: o.orderStatus || 'confirmed',
          timestamp: o.createdAt || new Date(),
          note: 'Migrated order status history'
        }];
        isModified = true;
      }

      // Ensure estimatedDelivery is set
      if (o.estimatedDelivery === undefined) {
        o.estimatedDelivery = null;
        isModified = true;
      }

      // Ensure coupon info is present
      if (o.couponCode === undefined) {
        o.couponCode = null;
        isModified = true;
      }
      if (o.discountAmount === undefined) {
        o.discountAmount = 0;
        isModified = true;
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // MIGRATION 004: Snapshot values in Order.items
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      for (const item of o.items) {
        if (!item.schoolName || !item.standardName || !item.imageUrl) {
          const productDoc = await Product.findById(item.product)
            .populate('school_id')
            .populate('standard_id');

          if (productDoc) {
            if (!item.schoolName && productDoc.school_id) {
              item.schoolName = productDoc.school_id.name;
              isModified = true;
            }
            if (!item.standardName && productDoc.standard_id) {
              item.standardName = productDoc.standard_id.class_name;
              isModified = true;
            }
            if (!item.imageUrl) {
              item.imageUrl = productDoc.primary_image || (productDoc.images && productDoc.images[0] && productDoc.images[0].url);
              isModified = true;
            }
          }
        }
      }

      if (isModified) {
        await o.save();
        updatedOrders++;
      }
    }
    console.log(`✅ Migration 002, 003, 004 Complete. Updated ${updatedOrders} orders.`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MIGRATION 005: Create Indexes manually
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('\n--- Running Migration 005: Index Synchronization ---');
    
    // Drop conflicting legacy indexes so Mongoose can create unique ones cleanly
    try {
      await Product.collection.dropIndex('itemSlug_1');
      console.log('🧹 Dropped existing itemSlug_1 index on Product collection.');
    } catch (e) { console.log('ℹ️ itemSlug_1 index drop skipped or already dropped.'); }

    try {
      await Wishlist.collection.dropIndex('user_1');
      console.log('🧹 Dropped existing user_1 index on Wishlist collection.');
    } catch (e) { console.log('ℹ️ user_1 index drop skipped or already dropped.'); }

    try {
      await Coupon.collection.dropIndex('code_1');
      console.log('🧹 Dropped existing code_1 index on Coupon collection.');
    } catch (e) { console.log('ℹ️ code_1 index drop skipped or already dropped.'); }

    // Mongoose handles model indexes automatically, but we force sync them here
    await Product.syncIndexes();
    await Order.syncIndexes();
    await Coupon.syncIndexes();
    await Wishlist.syncIndexes();
    await Inquiry.syncIndexes();
    await School.syncIndexes();
    await Standard.syncIndexes();
    
    console.log('✅ Indexes synchronized successfully!');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MIGRATION 006: Create Collections if empty
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('\n--- Running Migration 006: Creating new collections with seed placeholders ---');
    
    const wishlistCount = await Wishlist.countDocuments();
    console.log(`Current wishlists in DB: ${wishlistCount}`);
    
    const couponCount = await Coupon.countDocuments();
    console.log(`Current coupons in DB: ${couponCount}`);
    if (couponCount === 0) {
      console.log('Seeding demo coupons...');
      await Coupon.insertMany([
        {
          code: 'WELCOME10',
          discountType: 'percent',
          value: 10,
          minOrder: 100000, // ₹1,000.00
          maxUses: 100,
          usedCount: 0,
          expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          active: true
        },
        {
          code: 'ARIHANT200',
          discountType: 'flat',
          value: 20000, // ₹200.00
          minOrder: 200000, // ₹2,000.00
          maxUses: 50,
          usedCount: 0,
          expiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
          active: true
        }
      ]);
      console.log('✅ Seeded WELCOME10 and ARIHANT200 coupons.');
    }

    const inquiryCount = await Inquiry.countDocuments();
    console.log(`Current inquiries in DB: ${inquiryCount}`);

    console.log('\n✨ Database Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

run();
