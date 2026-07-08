const express = require('express');
const categoryController = require('../controllers/category.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', categoryController.getCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

module.exports = router;

module.exports.adminRouter = (() => {
  const adminRouter = express.Router();
  adminRouter.use(protect, restrictTo('ADMIN', 'SUPERADMIN'));

  adminRouter.post('/', categoryController.createCategory);
  adminRouter.patch('/:id', categoryController.updateCategory);
  adminRouter.delete('/:id', categoryController.deleteCategory);

  return adminRouter;
})();
