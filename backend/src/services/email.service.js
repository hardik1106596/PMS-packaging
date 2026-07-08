const transporter = require('../config/mailer');

const FROM = `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_EMAIL}>`;

async function sendMail({ to, subject, html, attachments = [] }) {
  return transporter.sendMail({ from: FROM, to, subject, html, attachments });
}

function baseLayout(bodyHtml) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
    <div style="background: #0f172a; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 20px; margin: 0; letter-spacing: 0.5px;">${process.env.COMPANY_NAME || 'PMS Packaging Pvt. Ltd.'}</h1>
    </div>
    <div style="padding: 32px 24px; background: #ffffff;">
      ${bodyHtml}
    </div>
    <div style="padding: 16px 24px; background: #f8fafc; text-align: center; font-size: 12px; color: #64748b;">
      <p style="margin: 4px 0;">${process.env.COMPANY_ADDRESS || ''}</p>
      <p style="margin: 4px 0;">${process.env.COMPANY_EMAIL || ''} · ${process.env.COMPANY_PHONE || ''}</p>
    </div>
  </div>`;
}

async function sendWelcomeEmail(user) {
  const html = baseLayout(`
    <h2 style="margin-top:0;">Welcome, ${user.name}!</h2>
    <p>Thank you for creating an account with ${process.env.COMPANY_NAME}. You can now browse our full catalog, track orders, and check out faster.</p>
    <a href="${process.env.CLIENT_URL}" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#0f172a; color:#fff; text-decoration:none; border-radius:8px;">Start Shopping</a>
  `);
  return sendMail({ to: user.email, subject: 'Welcome to PMS Packaging', html });
}

async function sendPasswordResetEmail(user, resetUrl) {
  const html = baseLayout(`
    <h2 style="margin-top:0;">Reset your password</h2>
    <p>Hi ${user.name}, we received a request to reset your password. This link expires in 1 hour.</p>
    <a href="${resetUrl}" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#0f172a; color:#fff; text-decoration:none; border-radius:8px;">Reset Password</a>
    <p style="margin-top:16px; font-size:13px; color:#64748b;">If you didn't request this, you can safely ignore this email.</p>
  `);
  return sendMail({ to: user.email, subject: 'Reset your password', html });
}

async function sendOrderConfirmationToCustomer(order, invoicePdfBuffer) {
  const to = order.user?.email || order.guestEmail;
  const name = order.user?.name || order.guestName;

  const itemsRows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${i.productName}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${Number(i.lineTotal).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = baseLayout(`
    <h2 style="margin-top:0;">Thank you for your order, ${name}!</h2>
    <p>Your order <strong>${order.orderNumber}</strong> has been confirmed. A detailed invoice is attached.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:8px;text-align:left;">Product</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <p style="margin-top:16px; text-align:right; font-size:16px;"><strong>Grand Total: ₹${Number(order.grandTotal).toFixed(2)}</strong></p>
    <p style="margin-top: 24px;">Payment Method: <strong>${order.paymentMethod}</strong></p>
    <p>We'll notify you as your order progresses. You can track it anytime from your account.</p>
  `);

  return sendMail({
    to,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html,
    attachments: invoicePdfBuffer
      ? [{ filename: `Invoice-${order.orderNumber}.pdf`, content: invoicePdfBuffer }]
      : [],
  });
}

async function sendOrderNotificationToOwner(order, invoicePdfBuffer) {
  const customerName = order.user?.name || order.guestName;
  const customerPhone = order.user?.phone || order.guestPhone;
  const customerEmail = order.user?.email || order.guestEmail;

  const itemsRows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${i.productName} (${i.sku})</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${Number(i.lineTotal).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = baseLayout(`
    <h2 style="margin-top:0;">🛎️ New Order Received — ${order.orderNumber}</h2>
    <p><strong>Customer:</strong> ${customerName} (${customerEmail}, ${customerPhone})</p>
    <p><strong>Payment:</strong> ${order.paymentMethod} — Status: ${order.payment?.status || 'PENDING'}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:8px;text-align:left;">Product</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <p style="margin-top:16px; text-align:right; font-size:16px;"><strong>Grand Total: ₹${Number(order.grandTotal).toFixed(2)}</strong></p>
    <a href="${process.env.CLIENT_URL}/admin/orders" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#0f172a; color:#fff; text-decoration:none; border-radius:8px;">View in Admin Panel</a>
  `);

  return sendMail({
    to: process.env.COMPANY_NOTIFY_EMAIL,
    subject: `New Order — ${order.orderNumber} — ₹${Number(order.grandTotal).toFixed(2)}`,
    html,
    attachments: invoicePdfBuffer
      ? [{ filename: `Invoice-${order.orderNumber}.pdf`, content: invoicePdfBuffer }]
      : [],
  });
}

async function sendOrderStatusUpdateEmail(order) {
  const to = order.user?.email || order.guestEmail;
  const name = order.user?.name || order.guestName;
  const html = baseLayout(`
    <h2 style="margin-top:0;">Order Update</h2>
    <p>Hi ${name}, your order <strong>${order.orderNumber}</strong> status has been updated to:</p>
    <p style="font-size:18px;"><strong>${order.status}</strong></p>
  `);
  return sendMail({ to, subject: `Order ${order.orderNumber} — Status: ${order.status}`, html });
}

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationToCustomer,
  sendOrderNotificationToOwner,
  sendOrderStatusUpdateEmail,
};
