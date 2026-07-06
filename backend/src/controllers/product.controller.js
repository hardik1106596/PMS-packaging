const slugify = require('slugify');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/products  (public — supports search, filter, sort, pagination)
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    search,
    minPrice,
    maxPrice,
    sort = 'newest',
    featured,
  } = req.query;

  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;

  const where = {
    isActive: true,
    ...(category && { category: { slug: category } }),
    ...(featured === 'true' && { isFeatured: true }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: Number(minPrice) }),
        ...(maxPrice && { lte: Number(maxPrice) }),
      },
    }),
  };

  const orderBy = {
    newest: { createdAt: 'desc' },
    'price-asc': { price: 'asc' },
    'price-desc': { price: 'desc' },
    'rating': { ratingAvg: 'desc' },
    'name-asc': { name: 'asc' },
  }[sort] || { createdAt: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { category: { select: { name: true, slug: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    success: true,
    data: products,
    meta: {
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  });
});

// GET /api/products/:slug (public)
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: { select: { name: true, slug: true } },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, avatarUrl: true } } },
      },
    },
  });

  if (!product || !product.isActive) throw new AppError('Product not found.', 404);

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    take: 4,
  });

  res.json({ success: true, data: { product, related } });
});

// POST /api/admin/products (admin)
const createProduct = asyncHandler(async (req, res) => {
  const {
    name, sku, description, specifications, dimensions, price, gstPercent,
    discountType, discountValue, stock, lowStockAlert, isFeatured, categoryId, images,
  } = req.body;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new AppError('Selected category does not exist.', 400);

  const baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const product = await prisma.product.create({
    data: {
      name, slug, sku, description, specifications, dimensions,
      price, gstPercent, discountType, discountValue,
      stock: stock ?? 0, lowStockAlert: lowStockAlert ?? 10,
      isFeatured: !!isFeatured, categoryId,
      images: images || [],
    },
  });

  if (product.stock > 0) {
    await prisma.stockHistory.create({
      data: { productId: product.id, change: product.stock, reason: 'initial_stock' },
    });
  }

  res.status(201).json({ success: true, message: 'Product created.', data: product });
});

// PATCH /api/admin/products/:id (admin)
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError('Product not found.', 404);

  const data = { ...req.body };
  delete data.id;
  delete data.slug; // slug changes are handled separately to avoid breaking links

  if (data.stock !== undefined && data.stock !== existing.stock) {
    const change = data.stock - existing.stock;
    await prisma.stockHistory.create({
      data: { productId: id, change, reason: 'manual_adjustment' },
    });
  }

  const product = await prisma.product.update({ where: { id }, data });
  res.json({ success: true, message: 'Product updated.', data: product });
});

// DELETE /api/admin/products/:id (admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError('Product not found.', 404);

  // Soft-delete pattern preferred for e-commerce (preserves order history integrity).
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  res.json({ success: true, message: 'Product removed from catalog.' });
});

// GET /api/admin/products (admin — includes inactive)
const getAdminProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const take = Math.min(Number(limit), 100);
  const skip = (Number(page) - 1) * take;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ success: true, data: products, meta: { total, page: Number(page), limit: take } });
});

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
};
