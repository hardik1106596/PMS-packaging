const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/dashboard
const getDashboardSummary = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    todaysOrders,
    monthlyOrders,
    totalRevenueAgg,
    monthlyRevenueAgg,
    recentOrders,
    recentCustomers,
    lowStockProducts,
    topSellingRaw,
    totalCustomers,
    totalProducts,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.aggregate({ _sum: { grandTotal: true }, where: { status: { notIn: ['CANCELLED', 'REFUNDED'] } } }),
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { createdAt: { gte: startOfMonth }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.$queryRaw`SELECT * FROM products WHERE stock <= "lowStockAlert" AND "isActive" = true ORDER BY stock ASC LIMIT 10`,
    prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count({ where: { isActive: true } }),
  ]);

  res.json({
    success: true,
    data: {
      todaysOrders,
      monthlyOrders,
      totalRevenue: totalRevenueAgg._sum.grandTotal || 0,
      monthlyRevenue: monthlyRevenueAgg._sum.grandTotal || 0,
      totalCustomers,
      totalProducts,
      recentOrders,
      recentCustomers,
      lowStockProducts,
      topSellingProducts: topSellingRaw,
    },
  });
});

// GET /api/admin/analytics/sales?range=7d|30d|12m
const getSalesAnalytics = asyncHandler(async (req, res) => {
  const { range = '30d' } = req.query;
  const days = range === '7d' ? 7 : range === '12m' ? 365 : 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    select: { createdAt: true, grandTotal: true },
  });

  const grouped = {};
  orders.forEach((o) => {
    const key = o.createdAt.toISOString().slice(0, 10);
    grouped[key] = (grouped[key] || 0) + Number(o.grandTotal);
  });

  const series = Object.entries(grouped)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  res.json({ success: true, data: series });
});

// GET /api/admin/customers
const getCustomers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const take = Math.min(Number(limit), 100);
  const skip = (Number(page) - 1) * take;

  const where = {
    role: 'CUSTOMER',
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, phone: true, isActive: true, createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ success: true, data: customers, meta: { total, page: Number(page), limit: take } });
});

// GET /api/admin/customers/:id
const getCustomerDetail = asyncHandler(async (req, res) => {
  const customer = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      orders: { include: { items: true }, orderBy: { createdAt: 'desc' } },
      addresses: true,
    },
  });
  res.json({ success: true, data: customer });
});

module.exports = {
  getDashboardSummary,
  getSalesAnalytics,
  getCustomers,
  getCustomerDetail,
};
