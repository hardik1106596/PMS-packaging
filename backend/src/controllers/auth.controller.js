const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/AsyncHandler');
const {
  signAccessToken,
  signRefreshToken,
  generateRandomToken,
  hashToken,
  cookieOptions,
} = require('../utils/tokens');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../services/email.service');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

const sanitizeUser = (user) => {
  const { password, resetToken, resetTokenExpiry, verifyToken, ...safe } = user;
  return safe;
};

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, phone, password: hashed, role: 'CUSTOMER' },
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie('accessToken', accessToken, cookieOptions());

  sendWelcomeEmail(user).catch((err) => console.error('Welcome email failed:', err.message));

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { user: sanitizeUser(user), accessToken, refreshToken },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid email or password.', 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid email or password.', 401);

  if (!user.isActive) throw new AppError('This account has been deactivated.', 403);

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie('accessToken', accessToken, cookieOptions());

  res.json({
    success: true,
    message: 'Logged in successfully.',
    data: { user: sanitizeUser(user), accessToken, refreshToken },
  });
});

// POST /api/auth/admin-login  (same logic, restricted to ADMIN/SUPERADMIN)
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !['ADMIN', 'SUPERADMIN'].includes(user.role)) {
    throw new AppError('Invalid admin credentials.', 401);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid admin credentials.', 401);

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie('accessToken', accessToken, cookieOptions());

  await prisma.adminProfile.upsert({
    where: { userId: user.id },
    update: { lastLoginAt: new Date() },
    create: { userId: user.id, lastLoginAt: new Date() },
  });

  res.json({
    success: true,
    message: 'Admin logged in successfully.',
    data: { user: sanitizeUser(user), accessToken, refreshToken },
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('accessToken', cookieOptions());
  res.json({ success: true, message: 'Logged out successfully.' });
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  if (!token) throw new AppError('Refresh token missing.', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || !user.isActive) throw new AppError('Account not found or deactivated.', 401);

  const accessToken = signAccessToken(user);
  res.cookie('accessToken', accessToken, cookieOptions());

  res.json({ success: true, data: { accessToken } });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: sanitizeUser(req.user) } });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way to avoid leaking which emails are registered.
  const genericMessage = 'If an account exists for this email, a reset link has been sent.';
  if (!user) return res.json({ success: true, message: genericMessage });

  const rawToken = generateRandomToken();
  const hashed = hashToken(rawToken);
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: hashed, resetTokenExpiry: expiry },
  });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
  await sendPasswordResetEmail(user, resetUrl);

  res.json({ success: true, message: genericMessage });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.resetToken || !user.resetTokenExpiry) {
    throw new AppError('Invalid or expired reset link.', 400);
  }

  if (user.resetTokenExpiry < new Date()) {
    throw new AppError('This reset link has expired. Please request a new one.', 400);
  }

  const hashed = hashToken(token);
  if (hashed !== user.resetToken) {
    throw new AppError('Invalid or expired reset link.', 400);
  }

  const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: newHashedPassword, resetToken: null, resetTokenExpiry: null },
  });

  res.json({ success: true, message: 'Password has been reset successfully. Please log in.' });
});

module.exports = {
  register,
  login,
  adminLogin,
  logout,
  refresh,
  getMe,
  forgotPassword,
  resetPassword,
};
