const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { sendResponse, sendError } = require('../utils/responseHandler');
const { getCachedOrFetch } = require('../services/cacheService');

/**
 * Optimization: Get products by standard using a single-trip aggregation with $facet.
 */
const getProductsByStandard = async (req, res) => {
  try {
    const { schoolId, standardId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const result = await Product.aggregate([
      { 
        $match: { 
          school_id: new mongoose.Types.ObjectId(schoolId),
          standard_id: new mongoose.Types.ObjectId(standardId),
          is_active: true
        } 
      },
      {
        $facet: {
          products: [
            { $sort: { created_at: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
              $lookup: {
                from: 'productvariants',
                localField: '_id',
                foreignField: 'product_id',
                as: 'variants'
              }
            }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    const data = {
      products: result[0].products,
      totalCount: result[0].totalCount[0]?.count || 0
    };

    return sendResponse(res, 200, data, { page: parseInt(page), limit: parseInt(limit), total: data.totalCount });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * Optimization: Lean query with explicit field projection to minimize memory and payload.
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id)
      .select('name description item_type uniform_type gallery school_id standard_id') // Explicit projection
      .lean(); // Optimization: returns plain JS object, bypassing Mongoose overhead

    if (!product) return sendError(res, 404, "Product not found");

    // Attach variants
    const variants = await ProductVariant.find({ product_id: id }).lean();
    product.variants = variants;

    return sendResponse(res, 200, product);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getProductsByStandard,
  getProductById
};
