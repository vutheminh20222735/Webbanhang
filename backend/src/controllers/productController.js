const Product = require('../models/Product');
const Category = require('../models/Category');
const { uploadBuffer } = require('../services/cloudinaryService');

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `phone-${Date.now()}`;
}

async function uniqueSlug(base) {
  let slug = base;
  let i = 1;
  while (await Product.findOne({ slug })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

exports.createProduct = async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.name || body.price === undefined || body.price === '') {
      return res.status(400).json({ success: false, message: 'Cần tên và giá điện thoại' });
    }
    const files = req.files || [];
    const images = [];
    for (const f of files) {
      try {
        const r = await uploadBuffer(f.buffer, { folder: 'phone-shop/products' });
        if (r && r.secure_url) images.push(r.secure_url);
      } catch (e) {
        console.error('Cloudinary upload failed', e.message);
      }
    }
    if (body.imageUrl) images.push(body.imageUrl);
    const extra = Array.isArray(body.images) ? body.images : (body.images ? [body.images] : []);
    const data = {
      name: body.name,
      slug: await uniqueSlug(body.slug ? slugify(body.slug) : slugify(body.name)),
      brand: body.brand || '',
      category: body.category || undefined,
      description: body.description || '',
      price: Number(body.price),
      salePrice: body.salePrice ? Number(body.salePrice) : null,
      images: images.concat(extra).filter(Boolean),
      ram: body.ram || '',
      storage: body.storage || '',
      color: body.color || '',
      screen: body.screen || '',
      cpu: body.cpu || '',
      camera: body.camera || '',
      battery: body.battery || '',
      operatingSystem: body.operatingSystem || 'Android',
      stock: Number(body.stock || 0),
      featured: body.featured === true || body.featured === 'true',
      status: 'active'
    };
    const product = await Product.create(data);
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'PRODUCT_CREATE', user: req.user.id, entity: 'Product', entityId: product._id, after: product });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.listCategories = async (req, res, next) => {
  try {
    const items = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: items });
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
      if (k === 'images' || k === 'imageUrl') return;
      product[k] = data[k];
    });
    if (data.price !== undefined) product.price = Number(data.price);
    if (data.stock !== undefined) product.stock = Number(data.stock);
    if (data.salePrice === '' || data.salePrice === null) product.salePrice = null;
    else if (data.salePrice !== undefined) product.salePrice = Number(data.salePrice);
    if (data.imageUrl) {
      product.images = [data.imageUrl].concat(product.images || []).filter((u, i, arr) => u && arr.indexOf(u) === i);
    } else if (Array.isArray(data.images) && data.images.length) {
      product.images = data.images.filter(Boolean);
    }
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
