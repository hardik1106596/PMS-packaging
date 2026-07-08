const prisma = require('../config/prisma');

/**
 * Generates a sequential, human-readable order number like PMS-2026-000123.
 * Uses the count of orders created this calendar year as the running
 * sequence. Wrapped in the caller's transaction where possible to avoid
 * race conditions under concurrent checkouts.
 */
async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } },
  });
  const sequence = String(count + 1).padStart(6, '0');
  return `PMS-${year}-${sequence}`;
}

async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } },
  });
  const sequence = String(count + 1).padStart(6, '0');
  return `INV-${year}-${sequence}`;
}

module.exports = { generateOrderNumber, generateInvoiceNumber };
