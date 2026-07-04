const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

router.get('/', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
