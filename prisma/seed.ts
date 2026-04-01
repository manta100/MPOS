import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create store
  const store = await prisma.store.create({
    data: {
      name: 'Demo Store',
      address: '123 Main Street, City',
      phone: '+1 234 567 8900',
      email: 'demo@mpos.com',
      currency: 'USD',
      timezone: 'America/New_York',
    },
  });
  console.log('✅ Store created:', store.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('password', 10);
  
  const admin = await prisma.user.create({
    data: {
      storeId: store.id,
      name: 'Admin User',
      email: 'admin@mpos.com',
      password: hashedPassword,
      role: 'ADMIN',
      pinCode: '1234',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create manager
  const manager = await prisma.user.create({
    data: {
      storeId: store.id,
      name: 'Manager User',
      email: 'manager@mpos.com',
      password: hashedPassword,
      role: 'MANAGER',
      pinCode: '5678',
    },
  });
  console.log('✅ Manager user created:', manager.email);

  // Create cashier
  const cashier = await prisma.user.create({
    data: {
      storeId: store.id,
      name: 'Cashier User',
      email: 'cashier@mpos.com',
      password: hashedPassword,
      role: 'CASHIER',
      pinCode: '9012',
    },
  });
  console.log('✅ Cashier user created:', cashier.email);

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { storeId: store.id, name: 'Food', color: '#EF4444', sortOrder: 1 },
    }),
    prisma.category.create({
      data: { storeId: store.id, name: 'Drinks', color: '#3B82F6', sortOrder: 2 },
    }),
    prisma.category.create({
      data: { storeId: store.id, name: 'Desserts', color: '#F59E0B', sortOrder: 3 },
    }),
    prisma.category.create({
      data: { storeId: store.id, name: 'Merchandise', color: '#10B981', sortOrder: 4 },
    }),
  ]);
  console.log('✅ Categories created:', categories.length);

  // Create items
  const items = [
    // Food
    { name: 'Burger', price: 9.99, categoryId: categories[0].id },
    { name: 'Pizza', price: 12.99, categoryId: categories[0].id },
    { name: 'Salad', price: 7.99, categoryId: categories[0].id },
    { name: 'Pasta', price: 11.99, categoryId: categories[0].id },
    { name: 'Sandwich', price: 8.49, categoryId: categories[0].id },
    { name: 'Fries', price: 3.99, categoryId: categories[0].id },
    // Drinks
    { name: 'Coffee', price: 4.49, categoryId: categories[1].id },
    { name: 'Tea', price: 3.49, categoryId: categories[1].id },
    { name: 'Soda', price: 2.49, categoryId: categories[1].id },
    { name: 'Juice', price: 4.99, categoryId: categories[1].id },
    { name: 'Water', price: 1.99, categoryId: categories[1].id },
    { name: 'Milkshake', price: 5.99, categoryId: categories[1].id },
    // Desserts
    { name: 'Ice Cream', price: 4.99, categoryId: categories[2].id },
    { name: 'Cake', price: 6.99, categoryId: categories[2].id },
    { name: 'Cookies', price: 3.49, categoryId: categories[2].id },
    { name: 'Brownie', price: 4.49, categoryId: categories[2].id },
    // Merchandise
    { name: 'T-Shirt', price: 19.99, categoryId: categories[3].id },
    { name: 'Mug', price: 12.99, categoryId: categories[3].id },
    { name: 'Cap', price: 14.99, categoryId: categories[3].id },
  ];

  for (const item of items) {
    await prisma.item.create({
      data: {
        ...item,
        storeId: store.id,
        barcode: `BAR${Math.random().toString(36).substring(7).toUpperCase()}`,
        sku: `SKU${Math.random().toString(36).substring(7).toUpperCase()}`,
        trackInventory: true,
        lowStockThreshold: 10,
      },
    });
  }
  console.log('✅ Items created:', items.length);

  // Create payment methods
  await prisma.payment.createMany({
    data: [
      { storeId: store.id, name: 'Cash', type: 'CASH', isDefault: true, sortOrder: 1 },
      { storeId: store.id, name: 'Credit Card', type: 'CARD', sortOrder: 2 },
      { storeId: store.id, name: 'Gift Card', type: 'GIFT_CARD', sortOrder: 3 },
    ],
  });
  console.log('✅ Payment methods created');

  // Create default tax
  await prisma.tax.create({
    data: {
      storeId: store.id,
      name: 'Sales Tax',
      rate: 8,
      inclusive: false,
      isDefault: true,
    },
  });
  console.log('✅ Tax created');

  // Create some customers
  const customers = [
    { name: 'John Smith', email: 'john@example.com', phone: '555-1234' },
    { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '555-5678' },
    { name: 'Mike Brown', email: 'mike@example.com', phone: '555-9012' },
    { name: 'Emily Davis', email: 'emily@example.com', phone: '555-3456' },
  ];

  for (const customer of customers) {
    await prisma.customer.create({
      data: {
        ...customer,
        storeId: store.id,
        loyaltyPoints: Math.floor(Math.random() * 500),
      },
    });
  }
  console.log('✅ Customers created:', customers.length);

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Demo credentials:');
  console.log('  Admin:   admin@mpos.com / password');
  console.log('  Manager: manager@mpos.com / password');
  console.log('  Cashier: cashier@mpos.com / password');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
