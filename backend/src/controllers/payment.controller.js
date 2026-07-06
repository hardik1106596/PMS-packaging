const crypto = require('crypto');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { fulfillOrder } = require('../services/order.service');

// POST /api/payments/razorpay/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError('Missing payment verification fields.', 400);
  }

  const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: razorpay_order_id } });
  if (!payment) throw new AppError('Payment record not found.', 404);

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', failureReason: 'Signature mismatch' },
    });
    throw new AppError('Payment verification failed. Signature mismatch.', 400);
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'PAID',
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    },
  });

  const fulfilledOrder = await fulfillOrder(payment.orderId);

  res.json({
    success: true,
    message: 'Payment verified and order confirmed.',
    data: { order: fulfilledOrder },
  });
});

// POST /api/payments/razorpay/failure
// Body: { razorpay_order_id, reason }
const markPaymentFailed = asyncHandler(async (req, res) => {
  const { razorpay_order_id, reason } = req.body;
  const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: razorpay_order_id } });
  if (!payment) throw new AppError('Payment record not found.', 404);

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'FAILED', failureReason: reason || 'Payment cancelled by user' },
  });

  await prisma.order.update({ where: { id: payment.orderId }, data: { status: 'CANCELLED' } });

  res.json({ success: true, message: 'Payment marked as failed.' });
});

// POST /api/payments/razorpay/webhook
// Configure this URL in the Razorpay dashboard for server-to-server reliability
// (covers cases where the client never calls /verify, e.g. tab closed mid-payment).
const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
  }

  const event = req.body.event;
  const paymentEntity = req.body.payload?.payment?.entity;

  if (event === 'payment.captured' && paymentEntity) {
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId: paymentEntity.order_id },
    });
    if (payment && payment.status !== 'PAID') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID', razorpayPaymentId: paymentEntity.id },
      });
      await fulfillOrder(payment.orderId).catch((err) =>
        console.error('Webhook fulfillment failed:', err.message)
      );
    }
  }

  if (event === 'payment.failed' && paymentEntity) {
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId: paymentEntity.order_id },
    });
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: paymentEntity.error_description || 'Payment failed' },
      });
    }
  }

  res.json({ success: true });
});

// POST /api/admin/payments/:id/refund  (refund-ready structure)
const initiateRefund = asyncHandler(async (req, res) => {
  const { amount } = req.body; // optional partial refund amount in INR
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!payment || payment.method !== 'RAZORPAY' || payment.status !== 'PAID') {
    throw new AppError('This payment is not eligible for a refund.', 400);
  }

  const razorpay = require('../config/razorpay');
  const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
    amount: amount ? Math.round(amount * 100) : undefined, // omit for full refund
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'REFUNDED',
      refundId: refund.id,
      refundedAmount: amount || payment.amount,
    },
  });

  await prisma.order.update({ where: { id: payment.orderId }, data: { status: 'REFUNDED' } });

  res.json({ success: true, message: 'Refund initiated successfully.', data: refund });
});

module.exports = { verifyPayment, markPaymentFailed, razorpayWebhook, initiateRefund };
