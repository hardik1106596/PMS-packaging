const AppError = require('../utils/AppError');

function handlePrismaError(err) {
  // Unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'field';
    return new AppError(`A record with this ${field} already exists.`, 409);
  }
  // Record not found
  if (err.code === 'P2025') {
    return new AppError('The requested record was not found.', 404);
  }
  // Foreign key constraint failed
  if (err.code === 'P2003') {
    return new AppError('This action references a record that does not exist.', 400);
  }
  return null;
}

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.code && err.code.startsWith('P')) {
    error = handlePrismaError(err) || err;
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Session expired. Please log in again.', 401);
  }
  if (err.name === 'ValidationError') {
    error = new AppError(err.message, 400);
  }

  const statusCode = error.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (!error.isOperational && !isProd) {
    // eslint-disable-next-line no-console
    console.error('💥 UNEXPECTED ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    status: error.status || 'error',
    message: error.isOperational ? error.message : 'Something went wrong. Please try again later.',
    details: error.details || undefined,
    ...(isProd ? {} : { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

module.exports = { errorHandler, notFound };
