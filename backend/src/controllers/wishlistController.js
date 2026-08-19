const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

async function getOrCreate(userId) {
  let doc = await Wishlist.findOne({ user: userId });
  if (!doc) doc = await Wishlist.create({ user: userId, products: [] });
  return doc;
}

exports.list = async (req, res, next) => {
  try {
    const doc = await getOrCreate(req.user.id);
    await doc.populate('products');
    res.json({ success: true, data: { items: doc.products || [] } });
  } catch (err) { next(err); }
};

exports.add = async (req, res, next) => {
  try {
    const productId = req.body.productId || req.body.product;
    if (!productId) return res.status(400).json({ success: false, message: 'Thiếu sản phẩm' });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    const doc = await getOrCreate(req.user.id);
    const exists = doc.products.some((id) => String(id) === String(productId));
    if (!exists) doc.products.push(product._id);
    doc.updatedAt = Date.now();
    await doc.save();
    await doc.populate('products');
    res.json({ success: true, data: { items: doc.products || [] } });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const doc = await getOrCreate(req.user.id);
    doc.products = doc.products.filter((id) => String(id) !== String(req.params.productId));
    doc.updatedAt = Date.now();
    await doc.save();
    await doc.populate('products');
    res.json({ success: true, data: { items: doc.products || [] } });
  } catch (err) { next(err); }
};

exports.clear = async (req, res, next) => {
  try {
    const doc = await getOrCreate(req.user.id);
    doc.products = [];
    doc.updatedAt = Date.now();
    await doc.save();
    res.json({ success: true, data: { items: [] } });
  } catch (err) { next(err); }
};
