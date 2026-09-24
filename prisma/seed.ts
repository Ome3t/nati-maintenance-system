import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Users (Safe to run multiple times)
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);
  const technicianPassword = await bcrypt.hash('technician123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@natimaintenance.com' },
    update: {},
    create: {
      email: 'admin@natimaintenance.com',
      name: 'Owner Admin',
      password: adminPassword,
      role: 'OWNER',
      isActive: true, // Ensure the account is active
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@natimaintenance.com' },
    update: {},
    create: {
      email: 'cashier@natimaintenance.com',
      name: 'Cashier User',
      password: cashierPassword,
      role: 'CASHIER',
      isActive: true,
    },
  });

  const technician = await prisma.user.upsert({
    where: { email: 'technician@natimaintenance.com' },
    update: {},
    create: {
      email: 'technician@natimaintenance.com',
      name: 'Technician User',
      password: technicianPassword,
      role: 'TECHNICIAN',
      isActive: true,
    },
  });
  console.log('✅ Users created');

  // 2. Create Categories (Safe to run multiple times)
  const categories = [
    'Phone Parts',
    'Computer Parts',
    'Accessories',
    'Cables',
    'Tools',
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat },
    });
  }
  console.log('✅ Categories created');

  // 3. Create Products (Safe to run multiple times)
  const products = [
    { name: 'iPhone Screen', sku: 'SCR-IP-001', purchasePrice: 1500, sellingPrice: 2500, currentStock: 10, minimumStock: 2 },
    { name: 'Samsung Screen', sku: 'SCR-SM-001', purchasePrice: 1200, sellingPrice: 2000, currentStock: 15, minimumStock: 2 },
    { name: 'Charging Port', sku: 'PRT-CHG-001', purchasePrice: 200, sellingPrice: 500, currentStock: 50, minimumStock: 5 },
    { name: 'Phone Battery', sku: 'BAT-PH-001', purchasePrice: 400, sellingPrice: 800, currentStock: 30, minimumStock: 5 },
    { name: 'USB Cable', sku: 'CBL-USB-001', purchasePrice: 50, sellingPrice: 150, currentStock: 100, minimumStock: 10 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }
  console.log('✅ Products created');

  // 4. Create Customers (Using upsert by phone to avoid duplicates)
  const customers = [
    { name: 'Abebe Kebede', phone: '0910111111' },
    { name: 'Sara Tesfaye', phone: '0910222222' },
    { name: 'Dawit Haile', phone: '0910333333' },
  ];

  for (const customer of customers) {
    // Check if customer exists by phone, if not create
    const existing = await prisma.customer.findFirst({ where: { phone: customer.phone } });
    if (!existing) {
      await prisma.customer.create({ data: customer });
    }
  }
  console.log('✅ Customers created');

  console.log('\n---');
  console.log('🎉 Seed complete!');
  console.log('Demo Accounts:');
  console.log('Admin: admin@natimaintenance.com / admin123');
  console.log('Cashier: cashier@natimaintenance.com / cashier123');
  console.log('Technician: technician@natimaintenance.com / technician123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });