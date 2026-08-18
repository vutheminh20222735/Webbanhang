const PaymentService = require('../services/paymentService');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

exports.createPayment = async (req, res, next) => {
  try {
    const { orderId, method } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user.id && req.user.role === 'CUSTOMER') return res.status(403).json({ success: false, message: 'Forbidden' });

    if (method === 'COD') {
      const payment = await PaymentService.processCOD(order, order.total);
      return res.json({ success: true, data: payment });
    }

    if (method === 'BNPL') {
      const payment = await PaymentService.processBNPL(order, order.total);
      return res.json({ success: true, data: payment });
    }

    // default to card/stripe
    const result = await PaymentService.createPaymentIntent({ order, amount: order.total, currency: 'USD', metadata: { orderId: order._id.toString() } });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.refund = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    // For now, mark refunded - real provider refund must be called
    payment.status = 'REFUNDED';
    await payment.save();
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
};
