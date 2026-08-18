const express = require('express');
const router = express.Router();
const PaymentService = require('../services/paymentService');
const Payment = require('../models/Payment');

// Stripe webhook endpoint - uses JSON body if stripe signature verification not configured
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      const event = PaymentService.handleStripeWebhook(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      // handle async
      // eslint-disable-next-line promise/catch-or-return
      event.then(async (ev) => {
        if (ev.type === 'payment_intent.succeeded') {
          const pi = ev.data.object;
          // find payment by metadata if available
          const orderId = pi.metadata && pi.metadata.orderId;
          if (orderId) {
            const payment = await Payment.findOne({ order: orderId });
            if (payment) {
              payment.status = 'PAID'; payment.transactionId = pi.id; payment.paidAt = new Date(); await payment.save();
              // update order paymentStatus and optionally confirm order
              const Order = require('../models/Order');
              const order = await Order.findById(orderId);
              if (order) {
                order.paymentStatus = 'PAID';
                if (order.orderStatus === 'PENDING') {
                  // check stock then deduct
                  const Product = require('../models/Product');
                  for (const it of order.items) {
                    const p = await Product.findById(it.product);
                    if (!p || p.stock < it.quantity) {
                      console.warn('Insufficient stock for order on webhook', order._id);
                      // keep order pending, but mark payment received
                      await order.save();
                      return;
                    }
                  }
                  for (const it of order.items) {
                    const p = await Product.findById(it.product);
                    p.stock -= it.quantity; p.sold = (p.sold || 0) + it.quantity; await p.save();
                  }
                  order.orderStatus = 'CONFIRMED';
                }
                await order.save();
              }
            }
          }
        }
      }).catch(err => console.error('Webhook processing error', err));
      return res.json({ received: true });
    }
    // fallback: accept JSON body
    const body = req.body;
    console.log('Webhook received', body.type || 'unknown');
    return res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

module.exports = router;
