const mongoose = require('mongoose');
require('./Category');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  brand: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  description: { type: String },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  images: { type: [String], default: [] },
  ram: String,
  storage: String,
  color: String,
  screen: String,
  cpu: String,
  camera: String,
  battery: String,
  operatingSystem: String,
  stock: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['active','inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
