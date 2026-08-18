require('dotenv').config();
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const AIConversation = require('../models/AIConversation');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcrypt');

const seed = async () => {
  await connectDB();
  // clean
  await Promise.all([
    User.deleteMany(),
    Product.deleteMany(),
    Category.deleteMany(),
    Review.deleteMany(),
    Coupon.deleteMany(),
    Order.deleteMany(),
    Payment.deleteMany(),
    AIConversation.deleteMany(),
    AuditLog.deleteMany()
  ]);

  const password = await bcrypt.hash('Password123', 10);

  const users = [
    { name: 'Admin User', email: 'admin@demo.com', password, role: 'ADMIN' },
    { name: 'Manager User', email: 'manager@demo.com', password, role: 'MANAGER' },
    { name: 'Staff User', email: 'staff@demo.com', password, role: 'STAFF' }
  ];
  const created = [];
  for (const u of users) {
    const doc = await User.create(u);
    created.push(doc);
  }

  const customers = [];
  for (let i = 1; i <= 5; i++) {
    customers.push({ name: `Customer ${i}`, email: `customer${i}@demo.com`, password, role: 'CUSTOMER' });
  }
  const createdCustomers = await User.insertMany(customers);

  // categories
  const categories = [
    { name: 'Flagship', slug: 'flagship', description: 'Top-tier phones' },
    { name: 'Midrange', slug: 'midrange', description: 'Great value phones' },
    { name: 'Budget', slug: 'budget', description: 'Affordable phones' }
  ];
  const createdCategories = await Category.insertMany(categories);

  // products
  const products = [];
  for (let i = 1; i <= 20; i++) {
    products.push({
      name: `Phone Model ${i}`,
      slug: `phone-model-${i}`,
      brand: `Brand ${((i-1)%5)+1}`,
      category: createdCategories[i % createdCategories.length]._id,
      description: `Description for phone ${i}`,
      price: 499 + i * 10,
      salePrice: i % 3 === 0 ? 449 + i * 8 : null,
      images: [],
      ram: ['4GB','6GB','8GB'][i%3],
      storage: ['64GB','128GB','256GB'][i%3],
      color: ['Black','White','Blue'][i%3],
      screen: '6.5 inch',
      cpu: 'Octa-core',
      camera: '48MP',
      battery: '4500mAh',
      operatingSystem: 'Android',
      stock: 50 - i,
      sold: i * 2,
      featured: i % 5 === 0
    });
  }
  const createdProducts = await Product.insertMany(products);

  // reviews
  const reviews = [];
  for (let i = 0; i < 30; i++) {
    const user = createdCustomers[i % createdCustomers.length];
    const product = createdProducts[i % createdProducts.length];
    reviews.push({ user: user._id, product: product._id, rating: (i % 5) + 1, title: `Review ${i+1}`, body: 'Good phone.' });
  }
  await Review.insertMany(reviews);

  // coupons
  const coupons = [
    { code: 'NEW10', description: '10% off', discountType: 'PERCENT', value: 10, usageLimit: 100 },
    { code: 'SAVE50', description: '$50 off', discountType: 'AMOUNT', value: 50, usageLimit: 50 }
  ];
  const createdCoupons = await Coupon.insertMany(coupons);

  // orders & payments
  const orders = [];
  const payments = [];
  const randUser = createdCustomers[0];
  for (let i = 0; i < 5; i++) {
    const p = createdProducts[i];
    const qty = (i % 3) + 1;
    const subtotal = p.price * qty;
    const shipping = 5;
    const discount = i % 2 === 0 ? 0 : 10;
    const total = subtotal + shipping - discount;
    const order = await Order.create({
      orderCode: `ORD-${Date.now()}-${i}`,
      user: randUser._id,
      items: [{ product: p._id, name: p.name, quantity: qty, price: p.price }],
      shippingAddress: { line1: '123 Demo St', city: 'Hanoi', country: 'VN' },
      subtotal,
      discount,
      shippingFee: shipping,
      total,
      paymentMethod: i % 2 === 0 ? 'COD' : 'CARD',
      paymentStatus: i % 2 === 0 ? 'PENDING' : 'PAID',
      orderStatus: i % 2 === 0 ? 'PENDING' : 'CONFIRMED'
    });
    orders.push(order);

    const payment = await Payment.create({ order: order._id, user: randUser._id, paymentMethod: order.paymentMethod, amount: total, currency: 'USD', status: order.paymentStatus === 'PAID' ? 'PAID' : 'PENDING', transactionId: order.paymentMethod === 'CARD' ? `txn_${i}_${Date.now()}` : null });
    payments.push(payment);
  }

  // ai_conversations (empty sample)
  await AIConversation.create({ user: randUser._id, role: 'CUSTOMER', messages: [{ sender: 'user', text: 'Tôi cần điện thoại chơi game khoảng 15 triệu' }, { sender: 'assistant', text: 'Đang tìm sản phẩm...' }] });

  // audit logs
  await AuditLog.create({ action: 'SEED', user: created[0]._id, entity: 'System', entityId: null, before: null, after: { note: 'Initial seed' } });

  console.log('Seed completed');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
