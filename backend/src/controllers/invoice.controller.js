const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { generateInvoicePdf } = require('../services/invoice.service');

// GET /api/invoices/:orderNumber/download  (customer or guest with order number)
const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: true, shippingAddress: true, payment: true, invoice: true, user: true },
  });

  if (!order || !order.invoice) throw new AppError('Invoice not found for this order.', 404);

  if (req.user && order.userId && order.userId !== req.user.id && req.user.role === 'CUSTOMER') {
    throw new AppError('You are not authorized to view this invoice.', 403);
  }

  const pdfPath = path.join(__dirname, '..', 'uploads', 'invoices', `${order.invoice.invoiceNumber}.pdf`);

  if (fs.existsSync(pdfPath)) {
    return res.download(pdfPath, `Invoice-${order.orderNumber}.pdf`);
  }

  // Fallback: regenerate on the fly if the stored file is missing.
  const pdfBuffer = await generateInvoicePdf(order);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.orderNumber}.pdf"`);
  res.send(pdfBuffer);
});

// POST /api/admin/invoices/:orderNumber/regenerate  (admin)
const regenerateInvoice = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: true, shippingAddress: true, payment: true, invoice: true, user: true },
  });
  if (!order || !order.invoice) throw new AppError('Invoice not found for this order.', 404);

  const pdfBuffer = await generateInvoicePdf(order);
  const invoiceDir = path.join(__dirname, '..', 'uploads', 'invoices');
  if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });
  fs.writeFileSync(path.join(invoiceDir, `${order.invoice.invoiceNumber}.pdf`), pdfBuffer);

  res.json({ success: true, message: 'Invoice regenerated successfully.' });
});

module.exports = { downloadInvoice, regenerateInvoice };
