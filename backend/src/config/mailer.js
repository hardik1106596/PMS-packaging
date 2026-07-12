const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'demo@local.test',
    pass: process.env.SMTP_PASS || 'demo-password',
  },
});

// Verify connection on boot (non-blocking, just logs).
transporter.verify((err) => {
  if (err) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Mail transporter verification failed:', err.message);
  } else {
    // eslint-disable-next-line no-console
    console.log('✅ Mail transporter ready');
  }
});

module.exports = transporter;
