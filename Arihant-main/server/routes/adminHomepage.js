const express   = require('express');
const multer    = require('multer');
const mongoose  = require('mongoose');
const { Readable } = require('stream');

const cloudinary       = require('../config/cloudinary');
const HomepageSection  = require('../models/HomepageSection');
const HomepageCategory = require('../models/HomepageCategory');
const { auth, admin }  = require('../middleware/auth');
const { redis, invalidateSchoolCache } = require('../services/cacheService');

const router = express.Router();

// ─── Redis cache key shared with the public route ────────────────────────────
const HOMEPAGE_CACHE_KEY = 'homepage:all';

/** Deletes the cached homepage payload so the next public request re-builds it. */
const invalidateHomepageCache = async () => {
  try {
    await redis.del(HOMEPAGE_CACHE_KEY);
  } catch (err) {
    // Non-fatal — log and continue; public route falls back to DB if cache is cold
    console.warn('[Homepage Admin] Cache invalidation failed:', err.message);
  }
};

// ─── Multer: memory storage, 5 MB cap, images only ───────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

/**
 * Upload a Buffer to Cloudinary via upload_stream.
 * Uses Node's built-in stream.Readable — no extra dependencies needed.
 * Returns the full Cloudinary result object (secure_url, public_id, …).
 */
const uploadBufferToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    Readable.from(buffer).pipe(uploadStream);
  });

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/homepage/sections
 * Returns all 3 HomepageSection documents (including inactive).
 */
router.get('/sections', auth, admin, async (req, res) => {
  try {
    const sections = await HomepageSection.find()
      .populate('updated_by', 'name email')
      .sort({ section: 1 })
      .lean();
    res.json(sections);
  } catch (err) {
    console.error('[Homepage Admin] GET sections error:', err.message);
    res.status(500).json({ message: 'Failed to fetch sections.' });
  }
});

/**
 * GET /api/admin/homepage/sections/:section
 * Returns single section document by section name ('men' | 'women' | 'kids').
 */
router.get('/sections/:section', auth, admin, async (req, res) => {
  const { section } = req.params;
  if (!['men', 'women', 'kids'].includes(section)) {
    return res.status(400).json({ message: "section must be 'men', 'women', or 'kids'." });
  }
  try {
    const doc = await HomepageSection.findOne({ section })
      .populate('updated_by', 'name email')
      .lean();
    if (!doc) return res.status(404).json({ message: `Section '${section}' not found.` });
    res.json(doc);
  } catch (err) {
    console.error('[Homepage Admin] GET section error:', err.message);
    res.status(500).json({ message: 'Failed to fetch section.' });
  }
});

/**
 * PUT /api/admin/homepage/sections/:section
 * Update section metadata only (headline, subheadline, cta_label, cta_link, is_active).
 * Image upload is handled by the separate /image endpoint.
 *
 * Body: { headline, subheadline, cta_label, cta_link, is_active }
 */
router.put('/sections/:section', auth, admin, async (req, res) => {
  const { section } = req.params;
  if (!['men', 'women', 'kids'].includes(section)) {
    return res.status(400).json({ message: "section must be 'men', 'women', or 'kids'." });
  }

  const { headline, subheadline, cta_label, cta_link, is_active } = req.body;

  // Build update object — only include defined fields
  const update = { updated_by: req.user._id, updated_at: new Date() };
  if (headline   !== undefined) update.headline    = headline;
  if (subheadline !== undefined) update.subheadline = subheadline;
  if (cta_label  !== undefined) update.cta_label   = cta_label;
  if (cta_link   !== undefined) update.cta_link    = cta_link;
  if (is_active  !== undefined) update.is_active   = is_active;

  try {
    const doc = await HomepageSection.findOneAndUpdate(
      { section },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: `Section '${section}' not found.` });

    await invalidateHomepageCache();
    res.json({ success: true, section: doc });
  } catch (err) {
    console.error('[Homepage Admin] PUT section error:', err.message);
    res.status(500).json({ message: 'Failed to update section.' });
  }
});

/**
 * POST /api/admin/homepage/sections/:section/image
 * Upload or replace the full-bleed hero image for a section.
 *
 * Flow:
 *  1. Parse multipart file via multer (memoryStorage)
 *  2. If section already has a hero_image_public_id → destroy old Cloudinary asset
 *  3. Upload new buffer to Cloudinary under 'arihant/homepage/heroes'
 *  4. Persist new URL + public_id, invalidate Redis cache
 *
 * Form field: image (file)
 */
router.post('/sections/:section/image', auth, admin, upload.single('image'), async (req, res) => {
  const { section } = req.params;
  if (!['men', 'women', 'kids'].includes(section)) {
    return res.status(400).json({ message: "section must be 'men', 'women', or 'kids'." });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided.' });
  }

  try {
    // Fetch current document to check for an existing Cloudinary asset
    const existing = await HomepageSection.findOne({ section });

    // Delete old Cloudinary image if one exists
    if (existing && existing.hero_image_public_id) {
      try {
        await cloudinary.uploader.destroy(existing.hero_image_public_id);
      } catch (destroyErr) {
        // Non-fatal — old image may have already been deleted manually
        console.warn('[Homepage Admin] Failed to destroy old hero image:', destroyErr.message);
      }
    }

    // Upload new image from memory buffer
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'arihant/homepage/heroes',
      public_id: `hero_${section}_${Date.now()}`,
      transformation: [
        { width: 1920, height: 1080, crop: 'fill', gravity: 'auto' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
      overwrite: true,
    });

    const updateData = {
      hero_image_url: result.secure_url,
      hero_image_public_id: result.public_id,
      updated_by: req.user._id,
      updated_at: new Date(),
    };

    // Upsert — creates the document if it doesn't exist yet (e.g. first-time setup)
    const doc = await HomepageSection.findOneAndUpdate(
      { section },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await invalidateHomepageCache();

    res.json({
      success: true,
      hero_image_url: doc.hero_image_url,
      hero_image_public_id: doc.hero_image_public_id,
    });
  } catch (err) {
    console.error('[Homepage Admin] Image upload error:', err.message);
    res.status(500).json({ message: 'Hero image upload failed.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  CATEGORY ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/homepage/categories
 * Returns HomepageCategory documents sorted by section then sort_order.
 * Optional filter: ?section=men
 */
router.get('/categories', auth, admin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.section) {
      if (!['men', 'women', 'kids'].includes(req.query.section)) {
        return res.status(400).json({ message: "section must be 'men', 'women', or 'kids'." });
      }
      filter.section = req.query.section;
    }

    const categories = await HomepageCategory.find(filter)
      .sort({ section: 1, sort_order: 1 })
      .lean();
    res.json(categories);
  } catch (err) {
    console.error('[Homepage Admin] GET categories error:', err.message);
    res.status(500).json({ message: 'Failed to fetch categories.' });
  }
});

/**
 * POST /api/admin/homepage/categories
 * Create a new category tile (metadata only — upload image via /:id/image).
 *
 * Body: { section, label, link, sort_order }
 * Note: image_url and image_public_id are required by the schema but will
 * be populated when the admin uploads an image via the /image endpoint.
 * We set placeholder values so the document can be created before the image is uploaded.
 */
router.post('/categories', auth, admin, async (req, res) => {
  const { section, label, link, sort_order } = req.body;

  if (!section || !label || !link) {
    return res.status(400).json({ message: 'section, label, and link are required.' });
  }
  if (!['men', 'women', 'kids'].includes(section)) {
    return res.status(400).json({ message: "section must be 'men', 'women', or 'kids'." });
  }

  try {
    const category = await HomepageCategory.create({
      section,
      label,
      link,
      sort_order: sort_order ?? 0,
      // Placeholder values — replaced when admin uploads the image
      image_url: '',
      image_public_id: '',
    });

    await invalidateHomepageCache();
    res.status(201).json({ success: true, category });
  } catch (err) {
    console.error('[Homepage Admin] POST category error:', err.message);
    res.status(500).json({ message: 'Failed to create category.' });
  }
});

/**
 * PUT /api/admin/homepage/categories/:id
 * Update category metadata (label, link, sort_order, is_active).
 */
router.put('/categories/:id', auth, admin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid category ID.' });
  }

  const { label, link, sort_order, is_active } = req.body;
  const update = {};
  if (label      !== undefined) update.label      = label;
  if (link       !== undefined) update.link       = link;
  if (sort_order !== undefined) update.sort_order = sort_order;
  if (is_active  !== undefined) update.is_active  = is_active;

  try {
    const category = await HomepageCategory.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found.' });

    await invalidateHomepageCache();
    res.json({ success: true, category });
  } catch (err) {
    console.error('[Homepage Admin] PUT category error:', err.message);
    res.status(500).json({ message: 'Failed to update category.' });
  }
});

/**
 * POST /api/admin/homepage/categories/:id/image
 * Upload or replace the tile image for a category.
 *
 * Flow: same as section image upload.
 * Folder: 'arihant/homepage/categories'
 * Form field: image (file)
 */
router.post('/categories/:id/image', auth, admin, upload.single('image'), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid category ID.' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided.' });
  }

  try {
    const existing = await HomepageCategory.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Category not found.' });

    // Destroy old Cloudinary asset if it exists
    if (existing.image_public_id) {
      try {
        await cloudinary.uploader.destroy(existing.image_public_id);
      } catch (destroyErr) {
        console.warn('[Homepage Admin] Failed to destroy old category image:', destroyErr.message);
      }
    }

    // Upload new image
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'arihant/homepage/categories',
      public_id: `cat_${existing._id}_${Date.now()}`,
      transformation: [
        { width: 600, height: 800, crop: 'fill', gravity: 'auto' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
      overwrite: true,
    });

    const category = await HomepageCategory.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          image_url: result.secure_url,
          image_public_id: result.public_id,
        },
      },
      { new: true }
    );

    await invalidateHomepageCache();

    res.json({
      success: true,
      image_url: category.image_url,
      image_public_id: category.image_public_id,
    });
  } catch (err) {
    console.error('[Homepage Admin] Category image upload error:', err.message);
    res.status(500).json({ message: 'Category image upload failed.' });
  }
});

/**
 * DELETE /api/admin/homepage/categories/:id
 * Delete a category tile. Destroys the Cloudinary asset first if one exists.
 */
router.delete('/categories/:id', auth, admin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid category ID.' });
  }

  try {
    const category = await HomepageCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });

    // Clean up Cloudinary asset before removing the DB document
    if (category.image_public_id) {
      try {
        await cloudinary.uploader.destroy(category.image_public_id);
      } catch (destroyErr) {
        console.warn('[Homepage Admin] Failed to destroy category image on delete:', destroyErr.message);
      }
    }

    await HomepageCategory.findByIdAndDelete(req.params.id);
    await invalidateHomepageCache();

    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    console.error('[Homepage Admin] DELETE category error:', err.message);
    res.status(500).json({ message: 'Failed to delete category.' });
  }
});

/**
 * PUT /api/admin/homepage/categories/reorder
 * Batch update sort_order for drag-and-drop reordering.
 *
 * Body: { updates: [{ id: ObjectId, sort_order: Number }, ...] }
 * Uses bulkWrite for a single atomic round-trip.
 *
 * ⚠ This route must be defined BEFORE /:id routes so Express doesn't
 *   try to match "reorder" as a Mongo ObjectId.
 */
router.put('/categories/reorder', auth, admin, async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: 'updates must be a non-empty array.' });
  }

  // Validate every entry before touching the database
  for (const u of updates) {
    if (!mongoose.Types.ObjectId.isValid(u.id)) {
      return res.status(400).json({ message: `Invalid ID: ${u.id}` });
    }
    if (typeof u.sort_order !== 'number') {
      return res.status(400).json({ message: `sort_order must be a number for id ${u.id}` });
    }
  }

  try {
    const ops = updates.map(({ id, sort_order }) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: { $set: { sort_order } },
      },
    }));

    const result = await HomepageCategory.bulkWrite(ops, { ordered: false });
    await invalidateHomepageCache();

    res.json({
      success: true,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error('[Homepage Admin] Reorder error:', err.message);
    res.status(500).json({ message: 'Reorder failed.' });
  }
});

module.exports = router;
