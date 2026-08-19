const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

const checkoutLocks = new Map();
const SHIPPING_FEE = 30000;

exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    res.json({ success: true, data: cart || { items: [] } });
  } catch (err) { next(err); }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, color, storage } = req.body;
    const p = await Product.findById(productId);
    if (!p) return res.status(404).json({ success: false, message: 'Product not found' });
    if (p.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });
    const idx = cart.items.findIndex(i => i.product.toString() === productId && i.color === color && i.storage === storage);
    if (idx >= 0) {
      cart.items[idx].quantity += quantity;
    } else {
      cart.items.push({ product: p._id, name: p.name, quantity, priceAt: p.salePrice || p.price, color, storage });
    }
    cart.updatedAt = Date.now();
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { itemId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (quantity <= 0) item.remove(); else item.quantity = quantity;
    cart.updatedAt = Date.now();
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

exports.removeItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    cart.items.id(itemId).remove();
    cart.updatedAt = Date.now();
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

exports.applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code, active: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, data: coupon });
  } catch (err) { next(err); }
};

exports.checkout = async (req, res, next) => {
  const userId = String(req.user.id);
  if (checkoutLocks.has(userId)) {
    return res.status(409).json({ success: false, message: 'Đơn hàng đang được xử lý, vui lòng đợi' });
  }
  checkoutLocks.set(userId, Date.now());

  try {
    const { shippingAddress, paymentMethod, notes, couponCode, itemIds } = req.body || {};

    if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone || !shippingAddress.line1) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin giao hàng' });
    }

    const requestedIds = Array.isArray(itemIds)
      ? [...new Set(itemIds.map((id) => String(id || '')).filter(Boolean))]
      : [];
    if (!requestedIds.length) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn sản phẩm để thanh toán' });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
    }

    const selected = [];
    for (const id of requestedIds) {
      const item = cart.items.id(id);
      if (!item) {
        return res.status(400).json({ success: false, message: 'Sản phẩm không còn trong giỏ hàng' });
      }
      selected.push(item);
    }

    const orderItems = [];
    let subtotal = 0;
    for (const it of selected) {
      const productId = it.product && it.product._id ? it.product._id : it.product;
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Sản phẩm ${it.name || ''} không tồn tại` });
      }
      if (product.status && product.status !== 'active') {
        return res.status(400).json({ success: false, message: `${product.name} hiện không bán` });
      }

      const qty = Number(it.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ success: false, message: `Số lượng không hợp lệ cho ${product.name}` });
      }
      if (product.stock < qty) {
        return res.status(400).json({ success: false, message: `Không đủ tồn kho cho ${product.name}` });
      }

      const price = Number(product.salePrice || product.price);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ success: false, message: `Giá không hợp lệ cho ${product.name}` });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: qty,
        price,
        color: it.color,
        storage: it.storage
      });
      subtotal += price * qty;
    }

    let discount = 0;
    let couponDoc = null;
    if (couponCode) {
      const code = String(couponCode).trim().toUpperCase();
      couponDoc = await Coupon.findOne({ code, active: true });
      if (!couponDoc) return res.status(400).json({ success: false, message: 'Mã giảm giá không hợp lệ' });
      if (couponDoc.startDate && couponDoc.startDate > new Date()) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá chưa tới ngày áp dụng' });
      }
      if (couponDoc.expiresAt && couponDoc.expiresAt < new Date()) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' });
      }
      if (couponDoc.minOrderValue && subtotal < couponDoc.minOrderValue) {
        return res.status(400).json({ success: false, message: 'Đơn hàng chưa đạt giá trị tối thiểu' });
      }
      if (couponDoc.usageLimit && couponDoc.usedCount >= couponDoc.usageLimit) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt dùng' });
      }
      discount = couponDoc.discountType === 'PERCENT'
        ? subtotal * (Number(couponDoc.value) / 100)
        : Number(couponDoc.value);
      if (couponDoc.maxDiscount && couponDoc.discountType === 'PERCENT' && discount > couponDoc.maxDiscount) {
        discount = couponDoc.maxDiscount;
      }
      if (discount > subtotal) discount = subtotal;
      if (discount < 0) discount = 0;
    }

    const shippingFee = SHIPPING_FEE;
    const total = Math.max(0, subtotal + shippingFee - discount);

    const order = await Order.create({
      orderCode: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      subtotal,
      discount,
      shippingFee,
      total,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      coupon: couponDoc ? couponDoc._id : undefined,
      notes
    });

    if (couponDoc) {
      await Coupon.updateOne({ _id: couponDoc._id }, { $inc: { usedCount: 1 } });
    }

    try {
      for (const id of requestedIds) {
        const sub = cart.items.id(id);
        if (sub) sub.remove();
      }
      cart.updatedAt = Date.now();
      await cart.save();
    } catch (cartErr) {
      console.error('Order created but cart cleanup failed', cartErr);
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  } finally {
    checkoutLocks.delete(userId);
  }
};
