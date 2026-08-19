const Order = require('../models/Order');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const { canonicalOrderStatus } = require('../utils/orderStatus');

async function populateOrder(id) {
  return Order.findById(id).populate('items.product').populate('user', '-password');
}

// List orders. Customers see only their orders; staff/managers/admin can filter
exports.listOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q, status } = req.query;
    const skip = (page - 1) * limit;
    const filter = {};
    if (q) filter.orderCode = new RegExp(q, 'i');
    if (status) {
      const mapped = canonicalOrderStatus(status);
      if (mapped) filter.orderStatus = mapped;
    }

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
    const order = await populateOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user.role === 'CUSTOMER' && order.user._id.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// Update order status (admin/staff/manager)
exports.updateStatus = async (req, res, next) => {
  try {
    const raw = req.body.status || req.body.orderStatus;
    const status = canonicalOrderStatus(raw);
    if (!status) return res.status(400).json({ success: false, message: 'Thiếu hoặc sai trạng thái' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });

    const previous = order.orderStatus;

    if (previous === status) {
      const current = await populateOrder(order._id);
      return res.json({ success: true, data: current });
    }

    // If transitioning to CONFIRMED, reserve/deduct stock (once)
    if (status === 'CONFIRMED' && previous !== 'CONFIRMED') {
      for (const it of order.items) {
        const p = await Product.findById(it.product);
        if (!p) return res.status(400).json({ success: false, message: `Product ${it.name} not found` });
        if (p.stock < it.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${p.name}` });
      }
      for (const it of order.items) {
        await Product.updateOne(
          { _id: it.product },
          { $inc: { stock: -it.quantity, sold: it.quantity } }
        );
      }
    }

    order.orderStatus = status;
    order.markModified('orderStatus');
    order.updatedAt = Date.now();
    await order.save();

    await AuditLog.create({
      action: 'ORDER_STATUS_UPDATE',
      user: req.user.id,
      entity: 'Order',
      entityId: order._id,
      before: { orderStatus: previous },
      after: { orderStatus: status }
    });

    const updated = await populateOrder(order._id);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// Customer cancels own order when allowed
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    if (order.user.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
    if (!['PENDING', 'CONFIRMED'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' });
    }
    const previous = order.orderStatus;
    order.orderStatus = 'CANCELLED';
    order.markModified('orderStatus');
    await order.save();
    await AuditLog.create({
      action: 'ORDER_CANCELLED',
      user: req.user.id,
      entity: 'Order',
      entityId: order._id,
      before: { orderStatus: previous },
      after: { orderStatus: 'CANCELLED' }
    });
    const updated = await populateOrder(order._id);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};
