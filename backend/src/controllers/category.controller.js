const slugify = require('slugify');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/AsyncHandler');

// GET /api/categories (public)
const getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  res.json({ success: true, data: categories });
});

// GET /api/categories/:slug (public)
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({ where: { slug: req.params.slug } });
  if (!category || !category.isActive) throw new AppError('Category not found.', 404);
  res.json({ success: true, data: category });
});

// POST /api/admin/categories (admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, imageUrl, metaTitle, metaDescription } = req.body;

  const baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const category = await prisma.category.create({
    data: { name, slug, description, imageUrl, metaTitle, metaDescription },
  });

  res.status(201).json({ success: true, message: 'Category created.', data: category });
});

// PATCH /api/admin/categories/:id (admin)
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new AppError('Category not found.', 404);

  const data = { ...req.body };
  delete data.id;
  delete data.slug;

  const category = await prisma.category.update({ where: { id }, data });
  res.json({ success: true, message: 'Category updated.', data: category });
});

// DELETE /api/admin/categories/:id (admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new AppError('Cannot delete a category that still has products. Reassign or remove them first.', 400);
  }
  await prisma.category.delete({ where: { id } });
  res.json({ success: true, message: 'Category deleted.' });
});

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
