const express = require('express');
const adminController = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const invoiceRoutes = require('./invoice.routes');

const router = express.Router();

router.use(protect, restrictTo('ADMIN', 'SUPERADMIN'));

router.get('/dashboard', adminController.getDashboardSummary);
router.get('/analytics/sales', adminController.getSalesAnalytics);
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerDetail);

// Nest domain-specific admin sub-routers under /api/admin/*
router.use('/products', productRoutes.adminRouter);
router.use('/categories', categoryRoutes.adminRouter);
router.use('/orders', orderRoutes.adminRouter);
router.use('/payments', paymentRoutes.adminRouter);
router.use('/invoices', invoiceRoutes.adminRouter);

module.exports = router;
