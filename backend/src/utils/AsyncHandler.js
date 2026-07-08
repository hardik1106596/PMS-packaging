// Wraps an async Express route/middleware function so any rejected
// promise is forwarded to next(err) instead of crashing the process.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
