const Product = require('../models/Product');
const { uploadBuffer } = require('../services/cloudinaryService');

exports.createProduct = async (req, res, next) => {
  try {
    const data = req.body || {};
    const files = req.files || [];
    const images = [];
    for (const f of files) {
      const r = await uploadBuffer(f.buffer, { folder: 'phone-shop/products' });
      images.push(r.secure_url);
    }
    data.images = images.concat(data.images || []);
    const product = await Product.create(data);
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'PRODUCT_CREATE', user: req.user.id, entity: 'Product', entityId: product._id, after: product });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.listProducts = async (req, res, next) => {
  try {
    const { q, category, brand, minPrice, maxPrice, sort = 'createdAt', page = 1, limit = 20, featured, status } = req.query;
    const filter = {};
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }];
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (featured !== undefined) filter.featured = featured === 'true';
    if (status) filter.status = status;
    if (minPrice || maxPrice) filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);

    const skip = (page - 1) * limit;
    const sortObj = {};
    const [field, dir] = sort.split(':');
    sortObj[field] = dir === 'desc' ? -1 : 1;

    const items = await Product.find(filter).sort(sortObj).skip(Number(skip)).limit(Number(limit));
    const total = await Product.countDocuments(filter);
    res.json({ success: true, data: { items, total } });
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const data = req.body || {};
    const files = req.files || [];
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    // upload new images
    for (const f of files) {
      const r = await uploadBuffer(f.buffer, { folder: 'phone-shop/products' });
      product.images.push(r.secure_url);
    }
    Object.keys(data).forEach(k => {
      if (k === 'images') return; // handled
      product[k] = data[k];
    });
    product.updatedAt = Date.now();
    await product.save();
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'PRODUCT_UPDATE', user: req.user.id, entity: 'Product', entityId: product._id, after: product });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'PRODUCT_DELETE', user: req.user.id, entity: 'Product', entityId: product._id, before: product });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

exports.checkStock = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { id: product._id, stock: product.stock } });
  } catch (err) { next(err); }
};
