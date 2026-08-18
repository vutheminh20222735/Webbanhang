const Review = require('../models/Review');
const Product = require('../models/Product');

exports.createReview = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(403).json({ success: false, message: 'Unauthorized' });
    const { product: productId, rating, title, body } = req.body || {};
    if (!productId || !rating) return res.status(400).json({ success: false, message: 'Missing fields' });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    // require purchaser check: user must have an order containing this product with progressed status
    const Order = require('../models/Order');
    const hasBought = await Order.exists({ user: userId, 'items.product': productId, orderStatus: { $in: ['CONFIRMED','PROCESSING','SHIPPING','DELIVERED'] } });
    if (!hasBought) return res.status(403).json({ success: false, message: 'Only customers who purchased this product can review' });
    const review = await Review.create({ user: userId, product: productId, rating: Number(rating), title, body });
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'REVIEW_CREATE', user: userId, entity: 'Review', entityId: review._id, after: review });
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};

exports.updateReview = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    const rev = await Review.findById(req.params.id);
    if (!rev) return res.status(404).json({ success: false, message: 'Not found' });
    if (rev.user.toString() !== userId && req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Forbidden' });
    const before = rev.toObject();
    const { rating, title, body } = req.body || {};
    if (rating) rev.rating = Number(rating);
    if (title !== undefined) rev.title = title;
    if (body !== undefined) rev.body = body;
    await rev.save();
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'REVIEW_UPDATE', user: userId, entity: 'Review', entityId: rev._id, before, after: rev });
    res.json({ success: true, data: rev });
  } catch (err) { next(err); }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    const rev = await Review.findById(req.params.id);
    if (!rev) return res.status(404).json({ success: false, message: 'Not found' });
    if (rev.user.toString() !== userId && req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Forbidden' });
    await Review.findByIdAndDelete(req.params.id);
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'REVIEW_DELETE', user: userId, entity: 'Review', entityId: req.params.id, before: rev });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

exports.listByProduct = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const page = parseInt(req.query.page || '1');
    const limit = Math.min(50, parseInt(req.query.limit || '20'));
    const skip = (page - 1) * limit;
    const items = await Review.find({ product: productId }).populate('user', 'email name').sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

exports.canReview = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const userId = req.user && req.user.id;
    if (!userId) return res.json({ success: true, data: false });
    const Order = require('../models/Order');
    const hasBought = await Order.exists({ user: userId, 'items.product': productId, orderStatus: { $in: ['CONFIRMED','PROCESSING','SHIPPING','DELIVERED'] } });
    res.json({ success: true, data: Boolean(hasBought) });
  } catch (err) { next(err); }
};
