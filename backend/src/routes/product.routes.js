const express = require('express');
const productController = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Public
router.get('/', productController.getProducts);
router.get('/:slug', productController.getProductBySlug);

module.exports = router;

// ---- Admin sub-router mounted separately in admin.routes.js ----
module.exports.adminRouter = (() => {
  const adminRouter = express.Router();
  adminRouter.use(protect, restrictTo('ADMIN', 'SUPERADMIN'));

  adminRouter.get('/', productController.getAdminProducts);
  adminRouter.post('/', productController.createProduct);
  adminRouter.patch('/:id', productController.updateProduct);
  adminRouter.delete('/:id', productController.deleteProduct);
  adminRouter.post('/upload-images', upload.array('images', 6), (req, res) => {
    const urls = (req.files || []).map((f) => `/uploads/${f.filename}`);
    res.json({ success: true, data: urls });
  });

  return adminRouter;
})();
