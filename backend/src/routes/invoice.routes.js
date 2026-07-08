const express = require('express');
const invoiceController = require('../controllers/invoice.controller');
const { optionalAuth, protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/:orderNumber/download', optionalAuth, invoiceController.downloadInvoice);

module.exports = router;

module.exports.adminRouter = (() => {
  const adminRouter = express.Router();
  adminRouter.use(protect, restrictTo('ADMIN', 'SUPERADMIN'));
  adminRouter.post('/:orderNumber/regenerate', invoiceController.regenerateInvoice);
  return adminRouter;
})();
