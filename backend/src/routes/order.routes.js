const express = require('express');
const orderController = require('../controllers/order.controller');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Checkout works for both guests and logged-in users.
router.post('/checkout', optionalAuth, orderController.createOrder);
router.get('/orders/:orderNumber', optionalAuth, orderController.getOrderByNumber);
router.get('/orders', protect, orderController.getMyOrders);

module.exports = router;

module.exports.adminRouter = (() => {
  const adminRouter = express.Router();
  adminRouter.use(protect, restrictTo('ADMIN', 'SUPERADMIN'));

  adminRouter.get('/', orderController.getAdminOrders);
  adminRouter.patch('/:id/status', orderController.updateOrderStatus);

  return adminRouter;
})();
