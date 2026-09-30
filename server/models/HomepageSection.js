const mongoose = require('mongoose');

/**
 * HomepageSection
 * ───────────────
 * Controls the full-bleed hero image and metadata for each of the three
 * homepage sections: men, women, kids.
 *
 * Only ONE document per section type is allowed (enforced via unique index
 * on `section`). Admins update this document in-place via the admin panel.
 *
 * Images are stored in Cloudinary; `hero_image_public_id` is required for
 * deletion/replacement on the next admin upload.
 */
const homepageSectionSchema = new mongoose.Schema({
  // Identifies which of the three homepage sections this document controls.
  section: {
    type: String,
    required: true,
    unique: true,
    enum: ['men', 'women', 'kids'],
  },

  // Cloudinary URL of the full-bleed background hero image.
  hero_image_url: {
    type: String,
    required: true,
  },

  // Cloudinary public_id — required so the old image can be deleted on replacement.
  hero_image_public_id: {
    type: String,
    required: true,
  },

  // Primary headline rendered over the hero image.
  // e.g. "Crafted for the Modern Man"
  headline: {
    type: String,
    required: true,
    trim: true,
  },

  // Optional supporting text displayed below the headline.
  subheadline: {
    type: String,
    trim: true,
    default: null,
  },

  // Text label for the CTA button overlaid on the hero image.
  cta_label: {
    type: String,
    default: 'Shop Now',
    trim: true,
  },

  // Navigation destination of the CTA button.
  // e.g. "/products?gender=men"
  cta_link: {
    type: String,
    trim: true,
    default: null,
  },

  // Controls whether this section is rendered on the public homepage.
  is_active: {
    type: Boolean,
    default: true,
  },

  // Timestamp of the last admin update (not using Mongoose timestamps to
  // keep control explicit and match the backend pattern used elsewhere).
  updated_at: {
    type: Date,
    default: Date.now,
  },

  // Reference to the admin User who last updated this section.
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
});

// Unique index on `section` — enforces the one-document-per-section rule.
homepageSectionSchema.index({ section: 1 }, { unique: true });

// Auto-refresh `updated_at` on every save without requiring the caller
// to set it manually.
homepageSectionSchema.pre('save', function () {
  this.updated_at = new Date();
});

module.exports = mongoose.model('HomepageSection', homepageSectionSchema);
