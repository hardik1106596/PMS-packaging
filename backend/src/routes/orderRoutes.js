const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const authMiddleware = require('../middleware/auth');

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({ where: { userId: req.user.id }, include: { items: true } });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
