/**
 * Standardizes API success responses.
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {any} data - Response payload
 * @param {Object} meta - Optional pagination/metadata
 */
const sendResponse = (res, statusCode, data, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
    meta: {
      ...meta
    }
  });
};

/**
 * Standardizes API error responses.
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: message,
    meta: {}
  });
};

module.exports = {
  sendResponse,
  sendError
};
