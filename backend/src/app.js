const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const path = require('path');

const { errorHandler, notFound } = require('./middleware/errorHandler.middleware');

// Route modules
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const contactRoutes = require('./routes/contact.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Trust the first proxy hop (Render/Vercel/NGINX) so req.ip and secure
// cookies behave correctly behind a load balancer.
app.set('trust proxy', 1);

// ---------------------------------------------------------
// Security middleware
// ---------------------------------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images to be fetched by the frontend origin
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// The Razorpay webhook needs the raw request body to verify the HMAC
// signature, so it must be captured BEFORE the global JSON parser runs.
app.use(
  '/api/payments/razorpay/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body;
    try {
      req.body = JSON.parse(req.body.toString('utf8'));
    } catch {
      req.body = {};
    }
    next();
  }
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(xss());
app.use(compression());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Global rate limiter (auth routes have their own stricter limiter on top of this).
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 200),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Static file serving for uploaded product images and generated invoices.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------------------------------------------------
// Health check
// ---------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'PMS Packaging API is running.', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------
// Routes
// ---------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api', orderRoutes); // exposes /api/checkout, /api/orders, /api/orders/:orderNumber
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

// ---------------------------------------------------------
// Error handling (must be last)
// ---------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
