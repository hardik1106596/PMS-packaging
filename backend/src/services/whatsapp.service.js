// WhatsApp notification service using Meta's WhatsApp Business Cloud API.
// Requires a verified WhatsApp Business Account + phone number ID + access token.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v20.0';
const OWNER_NUMBER = process.env.WHATSAPP_OWNER_NUMBER;

const BASE_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

/**
 * Sends a free-form text WhatsApp message to the given number.
 * Note: outside the 24-hour customer service window, Meta requires
 * pre-approved message TEMPLATES rather than free-form text. For the
 * owner-notification use case here, set up a simple approved template
 * (e.g. "new_order_alert") and swap sendText() for sendTemplate() below
 * if you hit the 24-hour-window restriction in production.
 */
async function sendText(to, body) {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.warn('⚠️  WhatsApp not configured — skipping notification.');
    return null;
  }

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('WhatsApp send failed:', JSON.stringify(data));
  }
  return data;
}

async function sendOrderAlertToOwner(order) {
  const customerName = order.user?.name || order.guestName;
  const customerPhone = order.user?.phone || order.guestPhone;
  const productLines = order.items
    .map((i) => `• ${i.productName} x${i.quantity} — ₹${Number(i.lineTotal).toFixed(2)}`)
    .join('\n');

  const message =
    `🛎️ *New Order Received*\n\n` +
    `*Order #:* ${order.orderNumber}\n` +
    `*Customer:* ${customerName}\n` +
    `*Mobile:* ${customerPhone}\n\n` +
    `*Products:*\n${productLines}\n\n` +
    `*Total Amount:* ₹${Number(order.grandTotal).toFixed(2)}\n` +
    `*Payment Status:* ${order.payment?.status || 'PENDING'}\n` +
    `*Order Time:* ${new Date(order.createdAt).toLocaleString('en-IN')}`;

  return sendText(OWNER_NUMBER, message);
}

module.exports = { sendText, sendOrderAlertToOwner };
