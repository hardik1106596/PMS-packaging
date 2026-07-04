const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const authMiddleware = require('../middleware/auth');

router.get('/dashboard', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const [orders, users, products] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.product.count(),
    ]);
    res.json({ orders, users, products });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
