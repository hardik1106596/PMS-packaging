const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { PassThrough } = require('stream');

/**
 * Generates a professional GST invoice PDF as an in-memory Buffer.
 * order must include: items, shippingAddress, payment, invoice (invoiceNumber), user (optional)
 */
async function generateInvoicePdf(order) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const stream = new PassThrough();
      const chunks = [];

      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      doc.pipe(stream);

      const company = {
        name: process.env.COMPANY_NAME || 'PMS Packaging Pvt. Ltd.',
        gstin: process.env.COMPANY_GSTIN || '',
        address: process.env.COMPANY_ADDRESS || '',
        phone: process.env.COMPANY_PHONE || '',
        email: process.env.COMPANY_EMAIL || '',
      };

      // ---------- HEADER ----------
      doc.fontSize(20).fillColor('#0f172a').font('Helvetica-Bold').text(company.name, 40, 40);
      doc.fontSize(9).fillColor('#475569').font('Helvetica')
        .text(company.address, 40, 64, { width: 300 })
        .text(`GSTIN: ${company.gstin}`, 40, doc.y)
        .text(`${company.phone} | ${company.email}`, 40, doc.y);

      doc.fontSize(16).fillColor('#0f172a').font('Helvetica-Bold').text('TAX INVOICE', 380, 40, { width: 175, align: 'right' });
      doc.fontSize(9).fillColor('#475569').font('Helvetica')
        .text(`Invoice #: ${order.invoice.invoiceNumber}`, 380, 64, { width: 175, align: 'right' })
        .text(`Order #: ${order.orderNumber}`, 380, doc.y, { width: 175, align: 'right' })
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 380, doc.y, { width: 175, align: 'right' });

      doc.moveTo(40, 130).lineTo(555, 130).strokeColor('#e2e8f0').stroke();

      // ---------- BILL TO ----------
      const addr = order.shippingAddress;
      doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text('Bill To:', 40, 145);
      doc.fontSize(9).fillColor('#334155').font('Helvetica')
        .text(addr.fullName, 40, 160)
        .text(addr.companyName || '', 40, doc.y)
        .text(addr.gstNumber ? `GSTIN: ${addr.gstNumber}` : '', 40, doc.y)
        .text(`${addr.addressLine}, ${addr.city}, ${addr.state} - ${addr.pincode}`, 40, doc.y, { width: 260 })
        .text(`Phone: ${addr.phone}`, 40, doc.y);

      doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text('Payment Details:', 320, 145);
      doc.fontSize(9).fillColor('#334155').font('Helvetica')
        .text(`Method: ${order.paymentMethod}`, 320, 160)
        .text(`Status: ${order.payment?.status || 'PENDING'}`, 320, doc.y)
        .text(order.payment?.razorpayPaymentId ? `Txn ID: ${order.payment.razorpayPaymentId}` : '', 320, doc.y);

      // ---------- ITEMS TABLE ----------
      let y = 250;
      const colX = { sn: 40, name: 65, qty: 300, price: 350, gst: 415, total: 470 };

      doc.rect(40, y, 515, 20).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('#', colX.sn + 5, y + 6);
      doc.text('Product', colX.name, y + 6);
      doc.text('Qty', colX.qty, y + 6);
      doc.text('Price', colX.price, y + 6);
      doc.text('GST%', colX.gst, y + 6);
      doc.text('Total', colX.total, y + 6);
      y += 20;

      doc.font('Helvetica').fontSize(9).fillColor('#1e293b');
      order.items.forEach((item, idx) => {
        const rowHeight = 22;
        if (idx % 2 === 0) doc.rect(40, y, 515, rowHeight).fill('#f8fafc');
        doc.fillColor('#1e293b');
        doc.text(String(idx + 1), colX.sn + 5, y + 6);
        doc.text(`${item.productName} (${item.sku})`, colX.name, y + 6, { width: 230 });
        doc.text(String(item.quantity), colX.qty, y + 6);
        doc.text(`₹${Number(item.price).toFixed(2)}`, colX.price, y + 6);
        doc.text(`${Number(item.gstPercent).toFixed(1)}%`, colX.gst, y + 6);
        doc.text(`₹${Number(item.lineTotal).toFixed(2)}`, colX.total, y + 6);
        y += rowHeight;
      });

      doc.moveTo(40, y).lineTo(555, y).strokeColor('#e2e8f0').stroke();
      y += 10;

      // ---------- TOTALS ----------
      const totalsX = 380;
      const printTotalRow = (label, value, bold = false) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9.5).fillColor('#0f172a');
        doc.text(label, totalsX, y, { width: 100 });
        doc.text(value, totalsX + 100, y, { width: 75, align: 'right' });
        y += bold ? 20 : 16;
      };

      printTotalRow('Subtotal:', `₹${Number(order.subtotal).toFixed(2)}`);
      printTotalRow('GST:', `₹${Number(order.gstAmount).toFixed(2)}`);
      printTotalRow('Shipping:', `₹${Number(order.shippingCharge).toFixed(2)}`);
      if (Number(order.discountAmount) > 0) {
        printTotalRow('Discount:', `-₹${Number(order.discountAmount).toFixed(2)}`);
      }
      doc.moveTo(totalsX, y).lineTo(555, y).strokeColor('#0f172a').stroke();
      y += 6;
      printTotalRow('Grand Total:', `₹${Number(order.grandTotal).toFixed(2)}`, true);

      // ---------- QR CODE ----------
      const qrData = `${process.env.COMPANY_WEBSITE || ''}/orders/${order.orderNumber}`;
      const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 0, width: 90 });
      const qrImage = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      doc.image(qrImage, 40, y + 10, { width: 70 });
      doc.fontSize(8).fillColor('#94a3b8').text('Scan to track your order', 40, y + 85);

      // ---------- TERMS & FOOTER ----------
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
        .text(
          'Terms: Goods once sold will only be replaced as per company policy. This is a computer-generated invoice and does not require a signature.',
          40, 740, { width: 515, align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePdf };
