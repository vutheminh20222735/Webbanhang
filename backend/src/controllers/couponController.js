const Coupon = require('../models/Coupon');

exports.createCoupon = async (req, res, next) => {
  try {
    const data = req.body || {};
    if (!data.code || !data.value) return res.status(400).json({ success: false, message: 'Missing fields' });
    data.code = data.code.toUpperCase();
    const coupon = await Coupon.create(data);
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'COUPON_CREATE', user: req.user.id, entity: 'Coupon', entityId: coupon._id, after: coupon });
    res.json({ success: true, data: coupon });
  } catch (err) { next(err); }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Not found' });
    const before = coupon.toObject();
    Object.assign(coupon, req.body || {});
    if (coupon.code) coupon.code = coupon.code.toUpperCase();
    await coupon.save();
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'COUPON_UPDATE', user: req.user.id, entity: 'Coupon', entityId: coupon._id, before, after: coupon });
    res.json({ success: true, data: coupon });
  } catch (err) { next(err); }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Not found' });
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'COUPON_DELETE', user: req.user.id, entity: 'Coupon', entityId: coupon._id, before: coupon });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

exports.listCoupons = async (req, res, next) => {
  try {
    const onlyActive = req.query.active === '1' || req.query.active === 'true';
    const q = onlyActive ? { active: true } : {};
    const items = await Coupon.find(q).limit(200);
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

exports.applyCoupon = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    const { code, orderTotal } = req.body || {};
    if (!code) return res.status(400).json({ success: false, message: 'Missing code' });
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found or inactive' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'Coupon expired' });
    if (coupon.minOrderValue && Number(orderTotal || 0) < coupon.minOrderValue) return res.status(400).json({ success: false, message: 'Order total too low' });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    let discount = 0;
    if (coupon.discountType === 'PERCENT') discount = (Number(orderTotal || 0) * coupon.value) / 100;
    else discount = coupon.value;
    if (discount > Number(orderTotal || 0)) discount = Number(orderTotal || 0);
    coupon.usedCount = (coupon.usedCount || 0) + 1;
    await coupon.save();
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'COUPON_APPLY', user: userId, entity: 'Coupon', entityId: coupon._id, after: { code: coupon.code, discount } });
    res.json({ success: true, data: { code: coupon.code, discount } });
  } catch (err) { next(err); }
};
