const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');

// List orders. Customers see only their orders; staff/managers/admin can filter
exports.listOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q, status } = req.query;
    const skip = (page - 1) * limit;
    const filter = {};
    if (q) filter.orderCode = new RegExp(q, 'i');
    if (status) filter.orderStatus = status;

    if (req.user.role === 'CUSTOMER') {
      filter.user = req.user.id;
    }

    const items = await Order.find(filter).populate('items.product').populate('user', '-password').sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit));
    const total = await Order.countDocuments(filter);
    res.json({ success: true, data: { items, total } });
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product').populate('user', '-password');
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user.role === 'CUSTOMER' && order.user._id.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// Update order status (admin/staff/manager)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });

    // If transitioning to CONFIRMED, reserve/deduct stock
    if (status === 'CONFIRMED' && order.orderStatus !== 'CONFIRMED') {
      for (const it of order.items) {
        const p = await Product.findById(it.product);
        if (!p) return res.status(400).json({ success: false, message: `Product ${it.name} not found` });
        if (p.stock < it.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${p.name}` });
      }
      // deduct
      for (const it of order.items) {
        const p = await Product.findById(it.product);
        p.stock -= it.quantity;
        p.sold = (p.sold || 0) + it.quantity;
        await p.save();
      }
    }

    order.orderStatus = status;
    order.updatedAt = Date.now();
    await order.save();

    await AuditLog.create({ action: 'ORDER_STATUS_UPDATE', user: req.user.id, entity: 'Order', entityId: order._id, before: null, after: { status } });

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// Customer cancels own order when allowed
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    if (order.user.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
    if (!['PENDING','CONFIRMED'].includes(order.orderStatus)) return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' });
    order.orderStatus = 'CANCELLED';
    await order.save();
    await AuditLog.create({ action: 'ORDER_CANCELLED', user: req.user.id, entity: 'Order', entityId: order._id, before: null, after: { status: 'CANCELLED' } });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};
