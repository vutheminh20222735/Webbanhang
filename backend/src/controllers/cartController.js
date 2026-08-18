const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

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
  try {
    const { shippingAddress, paymentMethod, notes, couponCode } = req.body;
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) return res.status(400).json({ success: false, message: 'Cart empty' });
    // Basic calculation
    let subtotal = 0;
    for (const it of cart.items) subtotal += (it.priceAt || it.product.price) * it.quantity;
    let discount = 0;
    if (couponCode) {
      const c = await Coupon.findOne({ code: couponCode, active: true });
      if (!c) return res.status(400).json({ success: false, message: 'Invalid coupon' });
      if (c.discountType === 'PERCENT') discount = subtotal * (c.value / 100);
      else discount = c.value;
    }
    const shippingFee = 5;
    const total = subtotal + shippingFee - discount;

    // create order (controller for orders will handle stock deduction, payments separately)
    const Order = require('../models/Order');
    const order = await Order.create({
      orderCode: `ORD-${Date.now()}`,
      user: req.user.id,
      items: cart.items.map(i => ({ product: i.product._id || i.product, name: i.name, quantity: i.quantity, price: i.priceAt })),
      shippingAddress,
      subtotal,
      discount,
      shippingFee,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'CARD' ? 'PENDING' : 'PENDING',
      orderStatus: 'PENDING',
      notes
    });

    // return order for client to proceed to payment
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};
