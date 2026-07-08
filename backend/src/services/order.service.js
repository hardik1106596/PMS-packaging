const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const { generateInvoiceNumber } = require('../utils/generateNumber');
const { generateInvoicePdf } = require('./invoice.service');
const {
  sendOrderConfirmationToCustomer,
  sendOrderNotificationToOwner,
} = require('./email.service');
const { sendOrderAlertToOwner } = require('./whatsapp.service');

const invoiceDir = path.join(__dirname, '..', 'uploads', 'invoices');
if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

/**
 * Runs the fully-automated post-payment pipeline for an order:
 *   1. Reduce stock for each item + log stock history
 *   2. Generate invoice record + PDF
 *   3. Email customer (with invoice attached)
 *   4. Email company/owner (with invoice attached)
 *   5. WhatsApp notify the owner
 *
 * Called either immediately after a COD order is placed, or after a
 * Razorpay payment signature has been verified.
 */
async function fulfillOrder(orderId) {
  // 1. Reduce stock atomically, guarding against overselling.
  const order = await prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!existingOrder) throw new Error('Order not found during fulfillment.');

    for (const item of existingOrder.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${item.productName}`);
      }
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      await tx.stockHistory.create({
        data: {
          productId: item.productId,
          change: -item.quantity,
          reason: 'order',
          refId: existingOrder.id,
        },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
      include: {
        items: true,
        shippingAddress: true,
        payment: true,
        user: true,
      },
    });
  });

  // 2. Generate invoice.
  const invoiceNumber = await generateInvoiceNumber();
  const invoiceRecord = await prisma.invoice.create({
    data: { orderId: order.id, invoiceNumber },
  });

  const orderForPdf = { ...order, invoice: invoiceRecord };
  const pdfBuffer = await generateInvoicePdf(orderForPdf);

  const pdfFileName = `${invoiceNumber}.pdf`;
  const pdfPath = path.join(invoiceDir, pdfFileName);
  fs.writeFileSync(pdfPath, pdfBuffer);

  await prisma.invoice.update({
    where: { id: invoiceRecord.id },
    data: { pdfUrl: `/uploads/invoices/${pdfFileName}` },
  });

  const fullOrder = { ...order, invoice: invoiceRecord };

  // 3 & 4. Emails (run in parallel, failures logged but non-fatal to the order).
  await Promise.allSettled([
    sendOrderConfirmationToCustomer(fullOrder, pdfBuffer),
    sendOrderNotificationToOwner(fullOrder, pdfBuffer),
  ]).then((results) => {
    results.forEach((r) => {
      if (r.status === 'rejected') console.error('Order email failed:', r.reason?.message);
    });
  });

  // 5. WhatsApp (non-fatal if it fails).
  try {
    await sendOrderAlertToOwner(fullOrder);
  } catch (err) {
    console.error('WhatsApp notification failed:', err.message);
  }

  // Low-stock alert notifications for admin dashboard.
  for (const item of order.items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (product && product.stock <= product.lowStockAlert) {
      await prisma.notification.create({
        data: {
          type: 'STOCK',
          title: 'Low stock alert',
          message: `${product.name} (SKU: ${product.sku}) has only ${product.stock} units left.`,
        },
      });
    }
  }

  return fullOrder;
}

module.exports = { fulfillOrder };
