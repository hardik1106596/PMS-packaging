const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Runs after an array of express-validator checks; collects errors and
// forwards a clean 400 AppError if any field failed validation.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new AppError('Validation failed', 422, details));
  }
  next();
};

module.exports = validate;
