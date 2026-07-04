const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pms-packaging.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@pms-packaging.com',
      password: 'password123',
      role: 'admin',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@pms-packaging.com' },
    update: {},
    create: {
      name: 'Customer User',
      email: 'customer@pms-packaging.com',
      password: 'password123',
      role: 'customer',
    },
  });

  const category = await prisma.category.upsert({
    where: { name: 'Packaging' },
    update: {},
    create: {
      name: 'Packaging',
      description: 'Eco-friendly packaging products',
    },
  });

  await prisma.product.upsert({
    where: { slug: 'kraft-box' },
    update: {},
    create: {
      name: 'Kraft Box',
      slug: 'kraft-box',
      price: 24.99,
      stock: 50,
      description: 'Durable kraft packaging box',
      categoryId: category.id,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discount: 10,
      isActive: true,
    },
  });

  console.log({ admin, customer });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
