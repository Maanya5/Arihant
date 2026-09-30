const mongoose = require('mongoose');

/**
 * HomepageCategory
 * ────────────────
 * Controls the individual category tiles displayed within each homepage
 * section. Examples:
 *   - Men  → T-Shirts, Shirts, Jeans, Kurtas, Ethnic Wear, Readymade
 *   - Women → Kurtis, Tops, Ladies Wear, Ethnic Wear, Dress Materials
 *   - Kids  → sourced dynamically from the Schools collection (not seeded here)
 *
 * Multiple documents per section are allowed and ordered by `sort_order`.
 * Images are stored in Cloudinary; `image_public_id` is required for
 * deletion/replacement on the next admin upload.
 */
const homepageCategorySchema = new mongoose.Schema({
  // Which homepage section this category tile belongs to.
  section: {
    type: String,
    required: true,
    enum: ['men', 'women', 'kids'],
  },

  // Display name shown on the tile.
  // e.g. "Kurtas", "Kurtis", "Ethnic Wear"
  label: {
    type: String,
    required: true,
    trim: true,
  },

  // Cloudinary URL for the category tile image.
  image_url: {
    type: String,
    required: true,
  },

  // Cloudinary public_id — required for deletion/replacement on admin update.
  image_public_id: {
    type: String,
    required: true,
  },

  // Navigation URL this tile links to.
  // e.g. "/products?gender=men&type=kurta"
  link: {
    type: String,
    required: true,
    trim: true,
  },

  // Determines the display order of tiles within a section.
  // Lower numbers appear first.
  sort_order: {
    type: Number,
    default: 0,
  },

  // Controls whether this tile is rendered on the public homepage.
  is_active: {
    type: Boolean,
    default: true,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Compound index — optimises fetching all active tiles for a section in order.
homepageCategorySchema.index({ section: 1, sort_order: 1 });

module.exports = mongoose.model('HomepageCategory', homepageCategorySchema);

/* ═══════════════════════════════════════════════════════════════
   SEED DATA
   Run this block once via a seed script or the Mongo shell to
   populate the initial category tiles.

   HomepageSection seeds (3 documents) ─────────────────────────
   Use HomepageSection.findOneAndUpdate({ section: <s> }, { $set: {...} }, { upsert: true })
   so re-running is safe.

   {
     section: 'men',
     hero_image_url: '<upload via admin>',
     hero_image_public_id: '<cloudinary_id>',
     headline: 'Crafted for the Modern Man',
     cta_label: "Explore Men's",
     cta_link: '/products?gender=men',
     is_active: true,
   },
   {
     section: 'women',
     hero_image_url: '<upload via admin>',
     hero_image_public_id: '<cloudinary_id>',
     headline: 'Wear What You Love',
     cta_label: "Explore Women's",
     cta_link: '/products?gender=women',
     is_active: true,
   },
   {
     section: 'kids',
     hero_image_url: '<upload via admin>',
     hero_image_public_id: '<cloudinary_id>',
     headline: 'School Ready. Every Day.',
     cta_label: 'Shop by School',
     cta_link: '/uniform/select-school',
     is_active: true,
   },

   HomepageCategory seeds for 'men' (6 tiles) ──────────────────
   [
     { section: 'men', label: 'T-Shirts',    sort_order: 1, link: '/products?gender=men&type=t-shirt',  image_url: '<url>', image_public_id: '<id>' },
     { section: 'men', label: 'Shirts',      sort_order: 2, link: '/products?gender=men&type=shirt',    image_url: '<url>', image_public_id: '<id>' },
     { section: 'men', label: 'Jeans',       sort_order: 3, link: '/products?gender=men&type=denim',    image_url: '<url>', image_public_id: '<id>' },
     { section: 'men', label: 'Kurtas',      sort_order: 4, link: '/products?gender=men&type=kurta',    image_url: '<url>', image_public_id: '<id>' },
     { section: 'men', label: 'Ethnic Wear', sort_order: 5, link: '/products?gender=men&type=ethnic',   image_url: '<url>', image_public_id: '<id>' },
     { section: 'men', label: 'Readymade',   sort_order: 6, link: '/products?gender=men&type=readymade',image_url: '<url>', image_public_id: '<id>' },
   ]

   HomepageCategory seeds for 'women' (5 tiles) ────────────────
   [
     { section: 'women', label: 'Kurtis',          sort_order: 1, link: '/products?gender=women&type=kurti',         image_url: '<url>', image_public_id: '<id>' },
     { section: 'women', label: 'Tops',            sort_order: 2, link: '/products?gender=women&type=top',           image_url: '<url>', image_public_id: '<id>' },
     { section: 'women', label: 'Ladies Wear',     sort_order: 3, link: '/products?gender=women&type=ladies-wear',   image_url: '<url>', image_public_id: '<id>' },
     { section: 'women', label: 'Ethnic Wear',     sort_order: 4, link: '/products?gender=women&type=ethnic',        image_url: '<url>', image_public_id: '<id>' },
     { section: 'women', label: 'Dress Materials', sort_order: 5, link: '/products?gender=women&type=dress-material',image_url: '<url>', image_public_id: '<id>' },
   ]

   Kids categories are served dynamically from the School collection
   via GET /api/schools — no static seeds needed.
   ═══════════════════════════════════════════════════════════════ */
