/**
 * Upsert danh mục + phụ kiện mẫu mà không xóa dữ liệu hiện có.
 * Chạy: node src/seed/ensure-categories.js
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');

const CATEGORIES = [
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

async function upsertCategories() {
  const map = {};
  for (const c of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug },
      { $set: { name: c.name, description: c.description, group: c.group, sortOrder: c.sortOrder, updatedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    map[c.slug] = doc;
  }
  return map;
}

async function ensureAccessories(bySlug) {
  const accessories = [
    {
      slug: 'coc-sac-nhanh-20w-usbc',
      name: 'Cốc sạc nhanh 20W USB-C',
      brand: 'Apple',
      category: bySlug['sac-nguon']._id,
      productType: 'accessory',
      description: 'Sạc nhanh 20W chuẩn USB-C, tương thích iPhone/iPad.',
      price: 490000,
      salePrice: 390000,
      images: ['https://cdn.tgdd.vn/Products/Images/9499/230035/Adapter-sac-Type-C-20W-Apple-MHJE3-1-600x600.jpg'],
      color: 'White',
      stock: 120,
      featured: true
    },
    {
      slug: 'sac-du-phong-10000mah',
      name: 'Sạc dự phòng 10000mAh 22.5W',
      brand: 'Anker',
      category: bySlug['sac-nguon']._id,
      productType: 'accessory',
      description: 'Pin dự phòng 10000mAh, sạc nhanh 22.5W, 2 cổng.',
      price: 590000,
      salePrice: 499000,
      images: ['https://cdn.tgdd.vn/Products/Images/57/251841/pin-sac-du-phong-10000mah-type-c-pd-qc-3-0-anker-powercore-slim-a1229-1-600x600.jpg'],
      color: 'Black',
      battery: '10000mAh',
      stock: 90,
      featured: true
    },
    {
      slug: 'cap-usbc-lightning-1m',
      name: 'Cáp USB-C to Lightning 1m',
      brand: 'Apple',
      category: bySlug['sac-nguon']._id,
      productType: 'accessory',
      description: 'Cáp sạc/truyền dữ liệu USB-C to Lightning chính hãng 1m.',
      price: 450000,
      salePrice: 390000,
      images: ['https://cdn.tgdd.vn/Products/Images/58/250033/cap-type-c-lightning-1m-apple-mqgj2-trang-1-600x600.jpg'],
      color: 'White',
      stock: 150
    },
    {
      slug: 'coc-sac-samsung-45w',
      name: 'Cốc sạc nhanh Samsung 45W',
      brand: 'Samsung',
      category: bySlug['sac-nguon']._id,
      productType: 'accessory',
      description: 'Sạc siêu nhanh 45W cho Galaxy S/Note/Z series.',
      price: 890000,
      salePrice: 790000,
      images: ['https://cdn.tgdd.vn/Products/Images/9499/251866/adapter-sac-type-c-pd-45w-samsung-ep-t4510-1-600x600.jpg'],
      color: 'Black',
      stock: 60
    },
    {
      slug: 'tai-nghe-blt-hoco-es36',
      name: 'Tai nghe Bluetooth Hoco ES36',
      brand: 'Hoco',
      category: bySlug['am-thanh-blt']._id,
      productType: 'accessory',
      description: 'Tai nghe Bluetooth true wireless, pin lâu, đeo êm.',
      price: 350000,
      salePrice: 299000,
      images: ['https://www.phukiensamsung.com/Uploads/tai-nghe-bluetooth-toi--gia-re-hoco-es36-ha-noi-hcm.jpg'],
      color: 'White',
      stock: 80,
      featured: true
    },
    {
      slug: 'airpods-pro-2',
      name: 'AirPods Pro 2',
      brand: 'Apple',
      category: bySlug['am-thanh-blt']._id,
      productType: 'accessory',
      description: 'Chống ồn chủ động, Spatial Audio, MagSafe.',
      price: 6190000,
      salePrice: 5790000,
      images: ['https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=800&q=80'],
      color: 'White',
      stock: 35,
      featured: true
    },
    {
      slug: 'loa-blt-jbl-go-3',
      name: 'Loa Bluetooth JBL Go 3',
      brand: 'JBL',
      category: bySlug['am-thanh-blt']._id,
      productType: 'accessory',
      description: 'Loa Bluetooth nhỏ gọn, chống nước IP67.',
      price: 990000,
      salePrice: 849000,
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80'],
      color: 'Blue',
      stock: 45
    },
    {
      slug: 'op-lung-magsafe-iphone-15',
      name: 'Ốp lưng MagSafe iPhone 15',
      brand: 'Apple',
      category: bySlug['thiet-bi-di-kem-blt']._id,
      productType: 'accessory',
      description: 'Ốp silicone MagSafe chính hãng cho iPhone 15.',
      price: 1290000,
      salePrice: 1090000,
      images: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80'],
      color: 'Midnight',
      stock: 70
    },
    {
      slug: 'bao-da-galaxy-s24',
      name: 'Bao da Samsung Galaxy S24',
      brand: 'Samsung',
      category: bySlug['thiet-bi-di-kem-blt']._id,
      productType: 'accessory',
      description: 'Bao da thông minh, bảo vệ toàn diện Galaxy S24.',
      price: 890000,
      salePrice: 750000,
      images: ['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80'],
      color: 'Black',
      stock: 50
    },
    {
      slug: 'tay-cam-game-blt',
      name: 'Tay cầm chơi game Bluetooth',
      brand: 'Gamesir',
      category: bySlug['thiet-bi-di-kem-blt']._id,
      productType: 'accessory',
      description: 'Tay cầm Bluetooth cho điện thoại, độ trễ thấp.',
      price: 790000,
      salePrice: 690000,
      images: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpMFKFAiYLm6kKZQdPi08CCBSHWBYaXsP57QsZXzJ25A&s=10'],
      color: 'Pink',
      stock: 40,
      featured: true
    }
  ];

  let created = 0;
  for (const a of accessories) {
    const exists = await Product.findOne({ slug: a.slug });
    if (exists) continue;
    await Product.create(a);
    created += 1;
  }
  return created;
}

async function main() {
  await connectDB();
  const bySlug = await upsertCategories();
  console.log(`Upserted ${Object.keys(bySlug).length} categories`);
  const n = await ensureAccessories(bySlug);
  console.log(`Created ${n} accessory products (skipped existing)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
