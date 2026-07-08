const express = require('express');
const express_raw = express.raw;
const paymentController = require('../controllers/payment.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/razorpay/verify', paymentController.verifyPayment);
router.post('/razorpay/failure', paymentController.markPaymentFailed);

// Webhook needs the raw body for signature verification — mounted with
// express.raw() in app.js BEFORE the global json() body parser for this path.
router.post('/razorpay/webhook', paymentController.razorpayWebhook);

module.exports = router;

module.exports.adminRouter = (() => {
  const adminRouter = express.Router();
  adminRouter.use(protect, restrictTo('ADMIN', 'SUPERADMIN'));
  adminRouter.post('/:id/refund', paymentController.initiateRefund);
  return adminRouter;
})();
