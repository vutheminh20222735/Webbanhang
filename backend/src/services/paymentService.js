const Payment = require('../models/Payment');

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

class PaymentService {
  static async createPaymentIntent({ order, amount, currency = 'USD', metadata = {} }) {
    if (stripe) {
      const intent = await stripe.paymentIntents.create({ amount: Math.round(amount * 100), currency, metadata });
      return { provider: 'stripe', clientSecret: intent.client_secret, intentId: intent.id };
    }
    // fallback: create internal pending payment record
    const payment = await Payment.create({ order: order._id, user: order.user, paymentMethod: 'OFFLINE', amount, currency, status: 'PENDING', provider: 'internal' });
    return { provider: 'internal', paymentId: payment._id };
  }

  static async processCOD(order, amount) {
    const payment = await Payment.create({ order: order._id, user: order.user, paymentMethod: 'COD', amount, currency: 'USD', status: 'PENDING', provider: 'cod' });
    return payment;
  }

  static async processBNPL(order, amount) {
    // Placeholder BNPL integration - returns PENDING and provider info
    const payment = await Payment.create({ order: order._id, user: order.user, paymentMethod: 'BNPL', amount, currency: 'USD', status: 'PENDING', provider: 'bnpl_demo' });
    return payment;
  }

  static async handleStripeWebhook(rawBody, sig, webhookSecret) {
    if (!stripe) throw new Error('Stripe not configured');
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    return event;
  }
}

module.exports = PaymentService;
