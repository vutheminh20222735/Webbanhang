const mongoose = require('mongoose');

const Roles = ['CUSTOMER','STAFF','MANAGER','ADMIN'];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: Roles, default: 'CUSTOMER' },
  permissions: { type: [String], default: [] },
  avatar: { type: String },
  address: { type: String },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
