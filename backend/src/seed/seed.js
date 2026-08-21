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

  const password = await bcrypt.hash('123456', 10);

  const users = [
    { name: 'Admin User', email: 'vutheminh@admin.com', password, role: 'ADMIN' },
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

  // categories — điện thoại + phụ kiện
  const categories = [
    { name: 'Smartphone', slug: 'smartphone', description: 'Điện thoại chính hãng', group: 'phone', sortOrder: 1 },
    { name: 'Gaming', slug: 'gaming', description: 'Điện thoại chơi game mạnh', group: 'phone', sortOrder: 2 },
    { name: 'Camera Phone', slug: 'camera-phone', description: 'Điện thoại chuyên camera', group: 'phone', sortOrder: 3 },
    { name: 'Flagship', slug: 'flagship', description: 'Điện thoại cao cấp', group: 'phone', sortOrder: 4 },
    { name: 'Tầm trung', slug: 'midrange', description: 'Điện thoại tầm trung', group: 'phone', sortOrder: 5 },
    { name: 'Giá rẻ', slug: 'budget', description: 'Điện thoại phổ thông', group: 'phone', sortOrder: 6 },
    { name: 'Sạc & nguồn', slug: 'sac-nguon', description: 'Sạc, cáp, pin dự phòng', group: 'accessory', sortOrder: 10 },
    { name: 'Âm thanh BLT', slug: 'am-thanh-blt', description: 'Tai nghe / loa Bluetooth', group: 'accessory', sortOrder: 11 },
    { name: 'Thiết bị đi kèm BLT', slug: 'thiet-bi-di-kem-blt', description: 'Ốp, bao da, phụ kiện đi kèm', group: 'accessory', sortOrder: 12 }
  ];
  const createdCategories = await Category.insertMany(categories);
  const bySlug = Object.fromEntries(createdCategories.map((c) => [c.slug, c]));
  const smartphone = bySlug.smartphone;
  const gaming = bySlug.gaming;
  const cameraPhone = bySlug['camera-phone'];
  const flagship = bySlug.flagship;
  const midrange = bySlug.midrange;
  const budget = bySlug.budget;
  const sacNguon = bySlug['sac-nguon'];
  const amThanh = bySlug['am-thanh-blt'];
  const thietBiKem = bySlug['thiet-bi-di-kem-blt'];

  const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
  const products = [
    { name: 'iPhone 15 Pro Max 256GB', slug: 'iphone-15-pro-max-256gb', brand: 'Apple', category: cameraPhone._id, productType: 'phone', description: 'Chip A17 Pro, Titan, camera 48MP, USB-C.', price: 34990000, salePrice: 32990000, images: [img('photo-1695048133142-1a20484d2569')], ram: '8GB', storage: '256GB', color: 'Natural Titanium', screen: '6.7 inch Super Retina XDR', cpu: 'A17 Pro', camera: '48MP', battery: '4441mAh', operatingSystem: 'iOS', stock: 25, sold: 40, featured: true },
    { name: 'iPhone 15 128GB', slug: 'iphone-15-128gb', brand: 'Apple', category: smartphone._id, productType: 'phone', description: 'Dynamic Island, camera 48MP, cổng USB-C.', price: 22990000, salePrice: 20990000, images: [img('photo-1695048133142-1a20484d2569')], ram: '6GB', storage: '128GB', color: 'Blue', screen: '6.1 inch Super Retina XDR', cpu: 'A16 Bionic', camera: '48MP', battery: '3349mAh', operatingSystem: 'iOS', stock: 40, sold: 55, featured: true },
    { name: 'Samsung Galaxy S24 Ultra', slug: 'samsung-galaxy-s24-ultra', brand: 'Samsung', category: cameraPhone._id, productType: 'phone', description: 'Galaxy AI, bút S Pen, zoom 100x, màn 120Hz.', price: 31990000, salePrice: 28990000, images: [img('photo-1610945415295-d9bbf067e59c')], ram: '12GB', storage: '256GB', color: 'Titanium Black', screen: '6.8 inch QHD+', cpu: 'Snapdragon 8 Gen 3', camera: '200MP', battery: '5000mAh', operatingSystem: 'Android', stock: 30, sold: 38, featured: true },
    { name: 'Samsung Galaxy A55 5G', slug: 'samsung-galaxy-a55-5g', brand: 'Samsung', category: smartphone._id, productType: 'phone', description: 'Màn Super AMOLED 120Hz, chống nước IP67.', price: 9990000, salePrice: 8990000, images: [img('photo-1592899677977-9c10ca588bbd')], ram: '8GB', storage: '256GB', color: 'Navy', screen: '6.6 inch Super AMOLED', cpu: 'Exynos 1480', camera: '50MP', battery: '5000mAh', operatingSystem: 'Android', stock: 60, sold: 70, featured: false },
    { name: 'Xiaomi 14 Ultra', slug: 'xiaomi-14-ultra', brand: 'Xiaomi', category: cameraPhone._id, productType: 'phone', description: 'Hệ camera Leica, sạc 90W, màn 2K 120Hz.', price: 24990000, salePrice: null, images: [img('photo-1511707171634-5f897ff02aa9')], ram: '16GB', storage: '512GB', color: 'Black', screen: '6.73 inch AMOLED', cpu: 'Snapdragon 8 Gen 3', camera: '50MP Leica', battery: '5300mAh', operatingSystem: 'Android', stock: 18, sold: 22, featured: true },
    { name: 'Redmi Note 13 Pro', slug: 'redmi-note-13-pro', brand: 'Xiaomi', category: midrange._id, productType: 'phone', description: 'Camera 200MP, sạc 67W, pin 5100mAh.', price: 7290000, salePrice: 6690000, images: [img('photo-1511707171634-5f897ff02aa9')], ram: '8GB', storage: '256GB', color: 'Midnight Black', screen: '6.67 inch AMOLED', cpu: 'Snapdragon 7s Gen 2', camera: '200MP', battery: '5100mAh', operatingSystem: 'Android', stock: 80, sold: 90, featured: false },
    { name: 'OPPO Reno11 F 5G', slug: 'oppo-reno11-f-5g', brand: 'OPPO', category: smartphone._id, productType: 'phone', description: 'Thiết kế mỏng nhẹ, sạc 67W, camera chân dung.', price: 8990000, salePrice: 7990000, images: ['https://cdn.tgdd.vn/Products/Images/42/368250/oppo-reno16-f-trang-thumb-600x600.jpg'], ram: '8GB', storage: '256GB', color: 'Palm Green', screen: '6.7 inch AMOLED', cpu: 'Dimensity 7050', camera: '64MP', battery: '5000mAh', operatingSystem: 'Android', stock: 45, sold: 33, featured: false },
    { name: 'OPPO A18', slug: 'oppo-a18', brand: 'OPPO', category: budget._id, productType: 'phone', description: 'Pin trâu, màn lớn, phù hợp học tập và nghe gọi.', price: 3290000, salePrice: 2990000, images: [img('photo-1580910051074-3eb694886505')], ram: '4GB', storage: '64GB', color: 'Glowing Blue', screen: '6.56 inch HD+', cpu: 'Helio G85', camera: '8MP', battery: '5000mAh', operatingSystem: 'Android', stock: 100, sold: 120, featured: false },
    { name: 'vivo V30e', slug: 'vivo-v30e', brand: 'vivo', category: smartphone._id, productType: 'phone', description: 'Camera Aura Light, sạc 80W, thiết kế cong.', price: 9490000, salePrice: 8490000, images: [img('photo-1601784551446-20c9e07cdbdb')], ram: '8GB', storage: '256GB', color: 'Peach Pink', screen: '6.78 inch AMOLED', cpu: 'Snapdragon 6 Gen 1', camera: '50MP', battery: '5500mAh', operatingSystem: 'Android', stock: 35, sold: 28, featured: false },
    { name: 'ASUS ROG Phone 8', slug: 'asus-rog-phone-8', brand: 'ASUS', category: gaming._id, productType: 'phone', description: 'Chip Snapdragon 8 Gen 3, tản nhiệt mạnh, màn 165Hz.', price: 24990000, salePrice: 22990000, images: [img('photo-1598327105666-5b89351aff97')], ram: '16GB', storage: '256GB', color: 'Phantom Black', screen: '6.78 inch AMOLED 165Hz', cpu: 'Snapdragon 8 Gen 3', camera: '50MP', battery: '5500mAh', operatingSystem: 'Android', stock: 20, sold: 12, featured: true },
    { name: 'Redmi K70 Gaming', slug: 'redmi-k70-gaming', brand: 'Xiaomi', category: gaming._id, productType: 'phone', description: 'Hiệu năng cao, tản nhiệt, pin lớn cho chơi game.', price: 9990000, salePrice: 8990000, images: [img('photo-1511707171634-5f897ff02aa9')], ram: '12GB', storage: '256GB', color: 'Black', screen: '6.67 inch OLED 120Hz', cpu: 'Snapdragon 8 Gen 2', camera: '50MP', battery: '5500mAh', operatingSystem: 'Android', stock: 40, sold: 25, featured: true },
    { name: 'realme C67', slug: 'realme-c67', brand: 'realme', category: budget._id, productType: 'phone', description: 'Camera 108MP, sạc 33W, pin 5000mAh.', price: 4990000, salePrice: 4490000, images: [img('photo-1598327105666-5b89351aff97')], ram: '8GB', storage: '128GB', color: 'Sunny Oasis', screen: '6.72 inch FHD+', cpu: 'Helio G99', camera: '108MP', battery: '5000mAh', operatingSystem: 'Android', stock: 70, sold: 64, featured: false },
    { name: 'Google Pixel 8', slug: 'google-pixel-8', brand: 'Google', category: cameraPhone._id, productType: 'phone', description: 'Tensor G3, camera tính toán, 7 năm cập nhật.', price: 18990000, salePrice: 16990000, images: [img('photo-1598327105666-5b89351aff97')], ram: '8GB', storage: '128GB', color: 'Obsidian', screen: '6.2 inch OLED', cpu: 'Google Tensor G3', camera: '50MP', battery: '4575mAh', operatingSystem: 'Android', stock: 20, sold: 15, featured: true },
    { name: 'Tecno Spark 20', slug: 'tecno-spark-20', brand: 'Tecno', category: budget._id, productType: 'phone', description: 'Màn 90Hz, pin 5000mAh, giá phổ thông.', price: 3490000, salePrice: null, images: [img('photo-1601784551446-20c9e07cdbdb')], ram: '8GB', storage: '128GB', color: 'Gravity Black', screen: '6.6 inch 90Hz', cpu: 'Helio G85', camera: '50MP', battery: '5000mAh', operatingSystem: 'Android', stock: 90, sold: 50, featured: false },
    // Phụ kiện — Sạc & nguồn
    { name: 'Cốc sạc nhanh 20W USB-C', slug: 'coc-sac-nhanh-20w-usbc', brand: 'Apple', category: sacNguon._id, productType: 'accessory', description: 'Sạc nhanh 20W chuẩn USB-C, tương thích iPhone/iPad.', price: 490000, salePrice: 390000, images: ['https://cdn.tgdd.vn/Products/Images/9499/230035/Adapter-sac-Type-C-20W-Apple-MHJE3-1-600x600.jpg'], color: 'White', stock: 120, sold: 80, featured: true },
    { name: 'Sạc dự phòng 10000mAh 22.5W', slug: 'sac-du-phong-10000mah', brand: 'Anker', category: sacNguon._id, productType: 'accessory', description: 'Pin dự phòng 10000mAh, sạc nhanh 22.5W, 2 cổng.', price: 590000, salePrice: 499000, images: ['https://cdn.tgdd.vn/Products/Images/57/251841/pin-sac-du-phong-10000mah-type-c-pd-qc-3-0-anker-powercore-slim-a1229-1-600x600.jpg'], color: 'Black', battery: '10000mAh', stock: 90, sold: 45, featured: true },
    { name: 'Cáp USB-C to Lightning 1m', slug: 'cap-usbc-lightning-1m', brand: 'Apple', category: sacNguon._id, productType: 'accessory', description: 'Cáp sạc/truyền dữ liệu USB-C to Lightning chính hãng 1m.', price: 450000, salePrice: 390000, images: ['https://cdn.tgdd.vn/Products/Images/58/250033/cap-type-c-lightning-1m-apple-mqgj2-trang-1-600x600.jpg'], color: 'White', stock: 150, sold: 100, featured: false },
    { name: 'Cốc sạc nhanh Samsung 45W', slug: 'coc-sac-samsung-45w', brand: 'Samsung', category: sacNguon._id, productType: 'accessory', description: 'Sạc siêu nhanh 45W cho Galaxy S/Note/Z series.', price: 890000, salePrice: 790000, images: ['https://cdn.tgdd.vn/Products/Images/9499/251866/adapter-sac-type-c-pd-45w-samsung-ep-t4510-1-600x600.jpg'], color: 'Black', stock: 60, sold: 30, featured: false },
    // Phụ kiện — Âm thanh BLT
    { name: 'Tai nghe Bluetooth Hoco ES36', slug: 'tai-nghe-blt-hoco-es36', brand: 'Hoco', category: amThanh._id, productType: 'accessory', description: 'Tai nghe Bluetooth true wireless, pin lâu, đeo êm.', price: 350000, salePrice: 299000, images: ['https://www.phukiensamsung.com/Uploads/tai-nghe-bluetooth-toi--gia-re-hoco-es36-ha-noi-hcm.jpg'], color: 'White', stock: 80, sold: 55, featured: true },
    { name: 'AirPods Pro 2', slug: 'airpods-pro-2', brand: 'Apple', category: amThanh._id, productType: 'accessory', description: 'Chống ồn chủ động, Spatial Audio, MagSafe.', price: 6190000, salePrice: 5790000, images: [img('photo-1606220588913-b3aacb4d2f46')], color: 'White', stock: 35, sold: 40, featured: true },
    { name: 'Loa Bluetooth JBL Go 3', slug: 'loa-blt-jbl-go-3', brand: 'JBL', category: amThanh._id, productType: 'accessory', description: 'Loa Bluetooth nhỏ gọn, chống nước IP67.', price: 990000, salePrice: 849000, images: [img('photo-1608043152269-423dbba4e7e1')], color: 'Blue', stock: 45, sold: 28, featured: false },
    // Phụ kiện — Thiết bị đi kèm BLT
    { name: 'Ốp lưng MagSafe iPhone 15', slug: 'op-lung-magsafe-iphone-15', brand: 'Apple', category: thietBiKem._id, productType: 'accessory', description: 'Ốp silicone MagSafe chính hãng cho iPhone 15.', price: 1290000, salePrice: 1090000, images: [img('photo-1601784551446-20c9e07cdbdb')], color: 'Midnight', stock: 70, sold: 40, featured: false },
    { name: 'Bao da Samsung Galaxy S24', slug: 'bao-da-galaxy-s24', brand: 'Samsung', category: thietBiKem._id, productType: 'accessory', description: 'Bao da thông minh, bảo vệ toàn diện Galaxy S24.', price: 890000, salePrice: 750000, images: [img('photo-1592899677977-9c10ca588bbd')], color: 'Black', stock: 50, sold: 20, featured: false },
    { name: 'Tay cầm chơi game Bluetooth', slug: 'tay-cam-game-blt', brand: 'Gamesir', category: thietBiKem._id, productType: 'accessory', description: 'Tay cầm Bluetooth cho điện thoại, độ trễ thấp.', price: 790000, salePrice: 690000, images: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpMFKFAiYLm6kKZQdPi08CCBSHWBYaXsP57QsZXzJ25A&s=10'], color: 'Pink', stock: 40, sold: 15, featured: true }
  ];
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
    { code: 'NEW10', description: 'Giảm 10%', discountType: 'PERCENT', value: 10, usageLimit: 100 },
    { code: 'SAVE500K', description: 'Giảm 500.000đ', discountType: 'AMOUNT', value: 500000, usageLimit: 50 }
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
    const shipping = 30000;
    const discount = i % 2 === 0 ? 0 : 500000;
    const total = subtotal + shipping - discount;
    const order = await Order.create({
      orderCode: `ORD-${Date.now()}-${i}`,
      user: randUser._id,
      items: [{ product: p._id, name: p.name, quantity: qty, price: p.price }],
      shippingAddress: { line1: '123 Nguyễn Trãi', city: 'Hà Nội', country: 'VN' },
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
