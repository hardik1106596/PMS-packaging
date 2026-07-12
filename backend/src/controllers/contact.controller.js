const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/AsyncHandler');
const { sendMail } = require('../services/email.service');

// POST /api/contact
const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) throw new AppError('Name, email and message are required.', 400);

  await sendMail({
    to: process.env.COMPANY_NOTIFY_EMAIL,
    subject: `Contact Form: ${subject || 'New enquiry'} — ${name}`,
    html: `
      <h3>New Contact Form Submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  });

  res.json({ success: true, message: 'Thank you for reaching out. We will get back to you shortly.' });
});

module.exports = { submitContactForm };
