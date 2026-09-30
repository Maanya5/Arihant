const School = require('../models/School');
const Standard = require('../models/Standard');
const Product = require('../models/Product');
const { getCachedOrFetch, invalidateSchoolCache } = require('../services/cacheService');
const { sendResponse, sendError } = require('../utils/responseHandler');

/**
 * Optimization: Cache-aside pattern for heavy catalogue lookups.
 * Caches Standards + Products for 600s.
 */
const getSchoolCatalogue = async (req, res) => {
  try {
    const { id: schoolId } = req.params;
    const cacheKey = `school:${schoolId}:catalogue`;

    const catalogue = await getCachedOrFetch(cacheKey, 600, async () => {
      const [school, standards, products] = await Promise.all([
        School.findById(schoolId).lean(),
        Standard.find({ school_id: schoolId, is_active: true }).lean(),
        Product.find({ school_id: schoolId, is_active: true }).lean()
      ]);

      if (!school) return null;

      // Group standards by gender
      const standardsByGender = { boy: [], girl: [], unisex: [] };
      standards.forEach(std => {
        const gen = (std.gender || 'unisex').toLowerCase();
        if (standardsByGender[gen]) {
          standardsByGender[gen].push(std);
        } else {
          standardsByGender['unisex'].push(std);
        }
      });

      return {
        school,
        standards,
        standardsByGender,
        products
      };
    });

    if (!catalogue) return sendError(res, 404, "School not found");

    return sendResponse(res, 200, catalogue);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * Mutation wrapper to invalidate cache when product data changes.
 */
const invalidateCacheAndRespond = async (schoolId, res, data) => {
  await invalidateSchoolCache(schoolId);
  return sendResponse(res, 200, data);
};

module.exports = {
  getSchoolCatalogue,
  invalidateCacheAndRespond
};
