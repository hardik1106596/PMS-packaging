const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
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
