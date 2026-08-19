const Coupon = require('../models/Coupon');

function isoDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function mapCouponInput(body = {}) {
  const typeRaw = String(body.discountType || 'PERCENT').toUpperCase();
  const discountType = (typeRaw === 'FIXED' || typeRaw === 'AMOUNT') ? 'AMOUNT' : 'PERCENT';
  const value = (body.discountValue != null && body.discountValue !== '')
    ? Number(body.discountValue)
    : Number(body.value);
  const active = body.isActive != null ? !!body.isActive : (body.active != null ? !!body.active : true);
  return {
    code: body.code ? String(body.code).trim().toUpperCase() : '',
    description: body.description || '',
    discountType,
    value,
    maxDiscount: body.maxDiscount != null && body.maxDiscount !== '' ? Number(body.maxDiscount) : undefined,
    minOrderValue: Number(body.minOrderValue || 0),
    usageLimit: Number(body.maxUsage != null ? body.maxUsage : (body.usageLimit || 0)),
    usedCount: Number(body.usageCount != null ? body.usageCount : (body.usedCount || 0)),
    active,
    startDate: body.startDate || undefined,
    expiresAt: body.endDate || body.expiresAt || undefined
  };
}

function toAdminCoupon(coupon) {
  if (!coupon) return coupon;
  const c = coupon.toObject ? coupon.toObject() : coupon;
  const isAmount = c.discountType === 'AMOUNT' || c.discountType === 'fixed';
  return {
    _id: c._id,
    code: c.code,
    description: c.description || '',
    discountType: isAmount ? 'fixed' : 'percentage',
    discountValue: c.value,
    maxDiscount: c.maxDiscount,
    minOrderValue: c.minOrderValue || 0,
    maxUsage: c.usageLimit || 0,
    usageCount: c.usedCount || 0,
    startDate: isoDate(c.startDate),
    endDate: isoDate(c.expiresAt),
    isActive: c.active !== false
  };
}

exports.createCoupon = async (req, res, next) => {
  try {
    const data = mapCouponInput(req.body);
    if (!data.code || !Number.isFinite(data.value) || data.value <= 0) {
      return res.status(400).json({ success: false, message: 'Thiếu mã hoặc giá trị giảm' });
    }
    const coupon = await Coupon.create(data);
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'COUPON_CREATE', user: req.user.id, entity: 'Coupon', entityId: coupon._id, after: coupon });
    res.json({ success: true, data: toAdminCoupon(coupon) });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã tồn tại' });
    }
    next(err);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Not found' });
    const before = coupon.toObject();
    const data = mapCouponInput({ ...before, ...req.body });
    data.usedCount = before.usedCount || 0;
    Object.assign(coupon, data);
    await coupon.save();
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'COUPON_UPDATE', user: req.user.id, entity: 'Coupon', entityId: coupon._id, before, after: coupon });
    res.json({ success: true, data: toAdminCoupon(coupon) });
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
    const items = await Coupon.find(q).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, data: { items: items.map(toAdminCoupon) } });
  } catch (err) { next(err); }
};

exports.applyCoupon = async (req, res, next) => {
  try {
    const { code, orderTotal } = req.body || {};
    if (!code) return res.status(400).json({ success: false, message: 'Missing code' });
    const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase(), active: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found or inactive' });
    if (coupon.startDate && coupon.startDate > new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon is not active yet' });
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'Coupon expired' });
    if (coupon.minOrderValue && Number(orderTotal || 0) < coupon.minOrderValue) {
      return res.status(400).json({ success: false, message: 'Order total too low' });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }
    let discount = 0;
    if (coupon.discountType === 'PERCENT') discount = (Number(orderTotal || 0) * coupon.value) / 100;
    else discount = coupon.value;
    if (coupon.maxDiscount && coupon.discountType === 'PERCENT' && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
    if (discount > Number(orderTotal || 0)) discount = Number(orderTotal || 0);
    if (discount < 0) discount = 0;
    res.json({
      success: true,
      data: {
        code: coupon.code,
        discount,
        discountAmount: discount,
        discountType: coupon.discountType,
        _id: coupon._id
      }
    });
  } catch (err) { next(err); }
};
