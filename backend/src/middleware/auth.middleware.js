const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verifies the JWT access token from either the Authorization header
 * (Bearer <token>) or the httpOnly "accessToken" cookie, then attaches
 * the authenticated user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new AppError('Not authenticated. Please log in.', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired session. Please log in again.', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });

  if (!user || !user.isActive) {
    throw new AppError('This account no longer exists or is deactivated.', 401);
  }

  req.user = user;
  next();
});

/**
 * Restricts a route to one or more roles, e.g. restrictTo('ADMIN', 'SUPERADMIN').
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new AppError('You do not have permission to perform this action.', 403);
  }
  next();
};

/**
 * Optional auth: attaches req.user if a valid token is present,
 * but does not fail the request if it's missing (used for guest checkout,
 * public product routes that personalize for logged-in users, etc).
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (user?.isActive) req.user = user;
  } catch {
    // silently ignore invalid token for optional auth
  }
  next();
});

module.exports = { protect, restrictTo, optionalAuth };
