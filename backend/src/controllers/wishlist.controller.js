const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/AsyncHandler');

// GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await prisma.wishlist.findMany({
    where: { userId: req.user.id },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: wishlist });
});

// POST /api/wishlist/:productId
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Product not found.', 404);

  const item = await prisma.wishlist.upsert({
    where: { userId_productId: { userId: req.user.id, productId } },
    update: {},
    create: { userId: req.user.id, productId },
  });

  res.status(201).json({ success: true, message: 'Added to wishlist.', data: item });
});

// DELETE /api/wishlist/:productId
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  await prisma.wishlist.deleteMany({ where: { userId: req.user.id, productId } });
  res.json({ success: true, message: 'Removed from wishlist.' });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
