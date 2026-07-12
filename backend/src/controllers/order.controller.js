const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/AsyncHandler');
const razorpay = require('../config/razorpay');
const { generateOrderNumber } = require('../utils/generateNumber');
const { fulfillOrder } = require('../services/order.service');
const { sendOrderStatusUpdateEmail } = require('../services/email.service');

const GST_DEFAULT = 18;
const FREE_SHIPPING_THRESHOLD = 5000;
const FLAT_SHIPPING = 150;

async function computeTotals(items, couponCode) {
  let subtotal = 0;
  let gstAmount = 0;
  const productData = [];

  for (const { productId, quantity } of items) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw new AppError(`Product not found: ${productId}`, 404);
    if (product.stock < quantity) {
      throw new AppError(`Insufficient stock for "${product.name}". Only ${product.stock} left.`, 400);
    }

    let unitPrice = Number(product.price);
    if (product.discountType === 'PERCENTAGE') {
      unitPrice -= (unitPrice * Number(product.discountValue)) / 100;
    } else if (product.discountType === 'FLAT') {
      unitPrice -= Number(product.discountValue);
    }
    unitPrice = Math.max(unitPrice, 0);

    const lineSubtotal = unitPrice * quantity;
    const lineGst = (lineSubtotal * Number(product.gstPercent || GST_DEFAULT)) / 100;

    subtotal += lineSubtotal;
    gstAmount += lineGst;

    productData.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      price: unitPrice,
      gstPercent: Number(product.gstPercent || GST_DEFAULT),
      quantity,
      lineTotal: lineSubtotal + lineGst,
    });
  }

  let discountAmount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon || !coupon.isActive) throw new AppError('Invalid or expired coupon code.', 400);
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new AppError('This coupon has expired.', 400);
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new AppError('This coupon has reached its usage limit.', 400);
    if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
      throw new AppError(`Minimum order value for this coupon is ₹${coupon.minOrderValue}.`, 400);
    }
    discountAmount = coupon.discountType === 'PERCENTAGE'
      ? (subtotal * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue);
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
  }

  const shippingCharge = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const grandTotal = subtotal + gstAmount + shippingCharge - discountAmount;

  return { subtotal, gstAmount, shippingCharge, discountAmount, grandTotal, productData, coupon };
}

// POST /api/checkout
// Body: { items: [{productId, quantity}], address: {...}, paymentMethod, couponCode?, orderNotes? }
const createOrder = asyncHandler(async (req, res) => {
  const { items, address, paymentMethod, couponCode, orderNotes, guest } = req.body;

  if (!items || items.length === 0) throw new AppError('Cart is empty.', 400);
  if (!['RAZORPAY', 'COD'].includes(paymentMethod)) throw new AppError('Invalid payment method.', 400);

  const totals = await computeTotals(items, couponCode);
  const orderNumber = await generateOrderNumber();

  const shippingAddress = await prisma.shippingAddress.create({
    data: {
      userId: req.user?.id || null,
      fullName: address.fullName,
      phone: address.phone,
      companyName: address.companyName,
      gstNumber: address.gstNumber,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country || 'India',
    },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: req.user?.id || null,
      guestEmail: req.user ? null : guest?.email,
      guestName: req.user ? null : guest?.name,
      guestPhone: req.user ? null : guest?.phone,
      subtotal: totals.subtotal,
      gstAmount: totals.gstAmount,
      shippingCharge: totals.shippingCharge,
      discountAmount: totals.discountAmount,
      grandTotal: totals.grandTotal,
      couponId: totals.coupon?.id,
      shippingAddressId: shippingAddress.id,
      orderNotes,
      paymentMethod,
      status: 'PENDING',
      items: { create: totals.productData },
    },
    include: { items: true },
  });

  if (totals.coupon) {
    await prisma.coupon.update({ where: { id: totals.coupon.id }, data: { usedCount: { increment: 1 } } });
  }

  if (paymentMethod === 'COD') {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'COD',
        status: 'PENDING',
        amount: totals.grandTotal,
      },
    });

    const fulfilled = await fulfillOrder(order.id);
    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: { order: fulfilled },
    });
  }

  // RAZORPAY: create a Razorpay order and return details for the frontend checkout widget.
  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(totals.grandTotal * 100), // paise
    currency: 'INR',
    receipt: order.orderNumber,
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      method: 'RAZORPAY',
      status: 'PENDING',
      amount: totals.grandTotal,
      razorpayOrderId: rzpOrder.id,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Order created. Proceed to payment.',
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// GET /api/orders/:orderNumber
const getOrderByNumber = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: true, shippingAddress: true, payment: true, invoice: true },
  });
  if (!order) throw new AppError('Order not found.', 404);

  if (req.user && order.userId && order.userId !== req.user.id && req.user.role === 'CUSTOMER') {
    throw new AppError('You are not authorized to view this order.', 403);
  }

  res.json({ success: true, data: order });
});

// GET /api/orders (logged-in customer's order history)
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true, invoice: true },
  });
  res.json({ success: true, data: orders });
});

// ---------------- ADMIN ----------------

// GET /api/admin/orders
const getAdminOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const take = Math.min(Number(limit), 100);
  const skip = (Number(page) - 1) * take;

  const where = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      include: { items: true, user: { select: { name: true, email: true } }, payment: true },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ success: true, data: orders, meta: { total, page: Number(page), limit: take } });
});

// PATCH /api/admin/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = [
    'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED',
    'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED',
  ];
  if (!validStatuses.includes(status)) throw new AppError('Invalid order status.', 400);

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include: { user: true },
  });

  sendOrderStatusUpdateEmail(order).catch((err) => console.error('Status email failed:', err.message));

  res.json({ success: true, message: 'Order status updated.', data: order });
});

module.exports = {
  createOrder,
  getOrderByNumber,
  getMyOrders,
  getAdminOrders,
  updateOrderStatus,
};
