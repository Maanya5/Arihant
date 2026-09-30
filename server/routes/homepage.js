const express = require('express');
const HomepageSection  = require('../models/HomepageSection');
const HomepageCategory = require('../models/HomepageCategory');
const School           = require('../models/School');
const { getCachedOrFetch } = require('../services/cacheService');

const router = express.Router();

const CACHE_KEY = 'homepage:all';
const CACHE_TTL = 300; // 5 minutes

/**
 * GET /api/homepage
 *
 * Returns all active homepage data in a single round-trip:
 * {
 *   sections: {
 *     men:   { hero: HomepageSection, categories: HomepageCategory[] },
 *     women: { hero: HomepageSection, categories: HomepageCategory[] },
 *     kids:  { hero: HomepageSection, schools: School[] }
 *   }
 * }
 *
 * Cached in Redis under 'homepage:all' for 5 minutes.
 * Cache is invalidated by the admin route on any mutation.
 */
router.get('/', async (req, res) => {
  try {
    const data = await getCachedOrFetch(CACHE_KEY, CACHE_TTL, async () => {
      // Run all DB queries in parallel
      const [sections, categories, schools] = await Promise.all([
        HomepageSection.find({ is_active: true }).lean(),
        HomepageCategory.find({ is_active: true })
          .sort({ section: 1, sort_order: 1 })
          .lean(),
        School.find({ is_active: true })
          .select('_id name logo area city')
          .lean(),
      ]);

      // Index sections by their `section` field for O(1) lookup
      const sectionMap = {};
      for (const s of sections) {
        sectionMap[s.section] = s;
      }

      // Group categories by section
      const categoryMap = { men: [], women: [], kids: [] };
      for (const c of categories) {
        if (categoryMap[c.section]) categoryMap[c.section].push(c);
      }

      return {
        sections: {
          men: {
            hero: sectionMap.men   || null,
            categories: categoryMap.men,
          },
          women: {
            hero: sectionMap.women || null,
            categories: categoryMap.women,
          },
          // Kids tiles come from the Schools collection, not HomepageCategory
          kids: {
            hero: sectionMap.kids  || null,
            schools,
          },
        },
      };
    });

    res.json(data);
  } catch (error) {
    console.error('[Homepage] GET /api/homepage error:', error.message);
    res.status(500).json({ message: 'Failed to load homepage data.' });
  }
});

module.exports = router;
