const { validationResult } = require('express-validator');

/**
 * Middleware: reads express-validator result and returns 422 with
 * a human-readable error message if any field failed validation.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array({ onlyFirstError: true })[0];
    return res.status(422).json({
      message: firstError.msg,
      field: firstError.path,
    });
  }
  next();
};

module.exports = validate;
