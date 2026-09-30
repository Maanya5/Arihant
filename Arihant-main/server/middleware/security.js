const mongoose = require('mongoose');
const { sendError } = require('../utils/responseHandler');

/**
 * Middleware to validate MongoDB ObjectIDs in request parameters.
 * Checks for common ID parameter names: id, schoolId, standardId, productId, orderId.
 */
const validateObjectId = (req, res, next) => {
  const idParams = ['id', 'schoolId', 'standardId', 'productId', 'orderId'];
  
  for (const param of idParams) {
    if (req.params[param] && !mongoose.Types.ObjectId.isValid(req.params[param])) {
      return sendError(res, 400, `Invalid ${param} format`);
    }
  }
  next();
};

/**
 * RBAC Middleware to restrict access based on user role.
 * @param {string} role - Required role (e.g., 'admin')
 */
const requireRole = (role) => {
  return (req, res, next) => {
    // JWT payload should contain role (auth middleware sets req.user)
    if (!req.user || req.user.role !== role) {
      return sendError(res, 403, "Access denied: Insufficient permissions");
    }
    next();
  };
};

/**
 * Middleware to validate comma-separated list of MongoDB ObjectIDs in query parameters (e.g. ?ids=id1,id2)
 */
const validateObjectIdArray = (req, res, next) => {
  const { ids } = req.query;
  if (!ids) return next();

  const rawIds = ids.split(',').map(s => s.trim()).filter(Boolean);
  for (const id of rawIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, `Invalid ID format in batch list: ${id}`);
    }
  }
  next();
};

module.exports = {
  validateObjectId,
  requireRole,
  validateObjectIdArray
};
