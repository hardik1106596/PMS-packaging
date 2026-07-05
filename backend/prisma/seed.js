require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ---------------- Admin user ----------------
  const adminPassword = await bcrypt.hash('Admin@12345', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pmspackaging.com' },
    update: {},
    create: {
      name: 'PMS Admin',
      email: 'admin@pmspackaging.com',
      phone: '9999999999',
      password: adminPassword,
      role: 'SUPERADMIN',
      isActive: true,
      isVerified: true,
    },
  });
  console.log(`✅ Admin ready: ${admin.email} / Admin@12345 (change this after first login!)`);

  // ---------------- Categories ----------------
  const categoryData = [
    { name: 'Corrugated Boxes', description: 'Durable corrugated shipping and packing boxes.' },
    { name: 'Bubble Wrap Rolls', description: 'Protective bubble wrap for fragile goods.' },
    { name: 'Stretch Films', description: 'Industrial-grade pallet wrapping films.' },
    { name: 'Poly Mailers', description: 'Lightweight tamper-proof courier bags.' },
    { name: 'Packaging Tapes', description: 'BOPP and paper tapes for sealing cartons.' },
  ];

  const categories = [];
  for (const c of categoryData) {
    const slug = slugify(c.name, { lower: true, strict: true });
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { ...c, slug },
    });
    categories.push(category);
  }
  console.log(`✅ Seeded ${categories.length} categories`);

  // ---------------- Products ----------------
  const productData = [
    {
      name: '3-Ply Corrugated Box (12x9x6 inch)',
      sku: 'PMS-BOX-001',
      description: 'Heavy-duty 3-ply corrugated box suitable for e-commerce shipping and warehousing. Crush-resistant and moisture-tolerant.',
      dimensions: '12in x 9in x 6in',
      price: 22.5,
      gstPercent: 18,
      stock: 500,
      categoryName: 'Corrugated Boxes',
      images: [],
      isFeatured: true,
    },
    {
      name: '5-Ply Corrugated Box (18x14x10 inch)',
      sku: 'PMS-BOX-002',
      description: 'Extra-strength 5-ply box for heavier industrial and bulk packaging needs.',
      dimensions: '18in x 14in x 10in',
      price: 48.0,
      gstPercent: 18,
      stock: 300,
      categoryName: 'Corrugated Boxes',
      images: [],
    },
    {
      name: 'Bubble Wrap Roll (1m x 100m)',
      sku: 'PMS-BWR-001',
      description: 'Air-cushioned bubble wrap roll for fragile item protection during transit.',
      dimensions: '1m width x 100m length',
      price: 950.0,
      gstPercent: 18,
      stock: 120,
      categoryName: 'Bubble Wrap Rolls',
      images: [],
      isFeatured: true,
    },
    {
      name: 'LLDPE Stretch Film (500mm x 300m)',
      sku: 'PMS-SF-001',
      description: 'High-cling industrial stretch film for pallet wrapping and load stabilization.',
      dimensions: '500mm x 300m, 23 micron',
      price: 620.0,
      gstPercent: 18,
      stock: 200,
      categoryName: 'Stretch Films',
      images: [],
    },
    {
      name: 'Tamper-Proof Poly Mailer (10x12 inch, Pack of 100)',
      sku: 'PMS-PM-001',
      description: 'Waterproof, tamper-evident courier bags ideal for apparel and small parcel shipping.',
      dimensions: '10in x 12in',
      price: 380.0,
      gstPercent: 18,
      stock: 400,
      categoryName: 'Poly Mailers',
      images: [],
      isFeatured: true,
    },
    {
      name: 'BOPP Packaging Tape (48mm x 65m, Pack of 6)',
      sku: 'PMS-TAPE-001',
      description: 'High-adhesion BOPP tape for secure carton sealing.',
      dimensions: '48mm x 65m',
      price: 310.0,
      gstPercent: 18,
      stock: 600,
      categoryName: 'Packaging Tapes',
      images: [],
    },
  ];

  for (const p of productData) {
    const category = categories.find((c) => c.name === p.categoryName);
    const slug = slugify(p.name, { lower: true, strict: true });
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        slug,
        sku: p.sku,
        description: p.description,
        dimensions: p.dimensions,
        price: p.price,
        gstPercent: p.gstPercent,
        stock: p.stock,
        images: p.images,
        isFeatured: !!p.isFeatured,
        categoryId: category.id,
      },
    });
  }
  console.log(`✅ Seeded ${productData.length} products`);

  // ---------------- Sample coupon ----------------
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 500,
      maxDiscount: 500,
      usageLimit: 1000,
      isActive: true,
    },
  });
  console.log('✅ Seeded coupon: WELCOME10 (10% off, min order ₹500)');

  console.log('🎉 Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
