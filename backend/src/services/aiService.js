const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const Product = require('../models/Product');
const Order = require('../models/Order');
const AIConversation = require('../models/AIConversation');

const PROVIDER_OPENAI = 'openai';

const functionDefinitions = [
  {
    name: 'searchProducts',
    description: 'Search products by query and filters',
    parameters: {
      type: 'object',
      properties: { q: { type: 'string' }, maxResults: { type: 'integer' } },
      required: ['q']
    }
  },
  {
    name: 'getProductDetails',
    description: 'Get detailed product info by id or slug',
    parameters: { type: 'object', properties: { id: { type: 'string' }, slug: { type: 'string' } } }
  },
  {
    name: 'compareProducts',
    description: 'Compare products given ids',
    parameters: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } }, required: ['ids'] }
  },
  {
    name: 'checkProductStock',
    description: 'Check stock for a product id',
    parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'getMyOrders',
    description: 'Get orders for the authenticated user',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'getOrderDetails',
    description: 'Get order details by order id',
    parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
  },
  {
    name: 'addProductToCart',
    description: 'Add a product to the authenticated user cart (id, qty, options)',
    parameters: { type: 'object', properties: { id: { type: 'string' }, quantity: { type: 'integer' } }, required: ['id'] }
  },
  {
    name: 'getPromotions',
    description: 'Return current promotions and coupons',
    parameters: { type: 'object', properties: {} }
  }
  ,
  {
    name: 'getRevenue',
    description: 'Get revenue summary for a date range',
    parameters: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } } }
  },
  {
    name: 'topProducts',
    description: 'Return top selling products in a range',
    parameters: { type: 'object', properties: { limit: { type: 'integer' } } }
  },
  {
    name: 'lowStock',
    description: 'Return products with low stock threshold',
    parameters: { type: 'object', properties: { threshold: { type: 'integer' } } }
  },
  {
    name: 'paymentsStats',
    description: 'Return payment counts by method/provider',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'todaysOrders',
    description: 'Return number of orders today',
    parameters: { type: 'object', properties: {} }
  }
];

async function callProviderOpenAI(messages, userId) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model: process.env.AI_MODEL || 'gpt-4o',
    messages,
    functions: functionDefinitions,
    function_call: 'auto'
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${process.env.AI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`AI provider error ${res.status}`);
  const json = await res.json();
  return json;
}

async function runFunctionByName(name, args, context) {
  // Admin-only tools require role check
  const isAdmin = context && (context.role === 'ADMIN' || context.role === 'MANAGER');
  switch (name) {
    case 'searchProducts': {
      const q = args.q || '';
      const items = await Product.find({ $or: [{ name: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }] }).limit(args.maxResults || 5);
      return { results: items.map(i => ({ id: i._id, name: i.name, price: i.price, slug: i.slug, stock: i.stock })) };
    }
    case 'getProductDetails': {
      const cond = {};
      if (args.id) cond._id = args.id;
      if (args.slug) cond.slug = args.slug;
      const p = await Product.findOne(cond);
      if (!p) return { error: 'Not found' };
      return { product: p };
    }
    case 'compareProducts': {
      const ids = args.ids || [];
      const items = await Product.find({ _id: { $in: ids } });
      return { items };
    }
    case 'checkProductStock': {
      const p = await Product.findById(args.id);
      return { id: args.id, stock: p ? p.stock : 0 };
    }
    case 'getMyOrders': {
      const userId = context.userId;
      const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(10);
      return { orders };
    }
    case 'getOrderDetails': {
      const o = await Order.findById(args.id).populate('items.product');
      return { order: o };
    }
    case 'addProductToCart': {
      // This function is a placeholder - actual cart mutation must go through /cart endpoints with auth
      return { success: false, message: 'Use cart API' };
    }
    case 'getPromotions': {
      // minimal: return coupon codes
      const Coupon = require('../models/Coupon');
      const coupons = await Coupon.find({ active: true }).limit(10);
      return { coupons: coupons.map(c => ({ code: c.code, type: c.discountType, value: c.value })) };
    }
    case 'getRevenue': {
      if (!isAdmin) return { error: 'permission_denied' };
      const Payment = require('../models/Payment');
      const from = args.from ? new Date(args.from) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
      const to = args.to ? new Date(args.to) : new Date();
      const payments = await Payment.find({ paidAt: { $gte: from, $lte: to }, status: 'PAID' });
      const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
      return { total, count: payments.length };
    }
    case 'topProducts': {
      if (!isAdmin) return { error: 'permission_denied' };
      const Order = require('../models/Order');
      const lim = args.limit || 5;
      const agg = await Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', qty: { $sum: '$items.quantity' } } },
        { $sort: { qty: -1 } },
        { $limit: lim }
      ]);
      const Product = require('../models/Product');
      const results = [];
      for (const a of agg) {
        const p = await Product.findById(a._id);
        results.push({ id: a._id, name: p ? p.name : 'Unknown', qty: a.qty });
      }
      return { top: results };
    }
    case 'lowStock': {
      if (!isAdmin) return { error: 'permission_denied' };
      const threshold = args.threshold || 10;
      const Product = require('../models/Product');
      const items = await Product.find({ stock: { $lte: threshold } }).limit(50);
      return { items: items.map(i => ({ id: i._id, name: i.name, stock: i.stock })) };
    }
    case 'paymentsStats': {
      if (!isAdmin) return { error: 'permission_denied' };
      const Payment = require('../models/Payment');
      const agg = await Payment.aggregate([{ $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }]);
      return { stats: agg };
    }
    case 'todaysOrders': {
      if (!isAdmin) return { error: 'permission_denied' };
      const Order = require('../models/Order');
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(); end.setHours(23,59,59,999);
      const count = await Order.countDocuments({ createdAt: { $gte: start, $lte: end } });
      return { count };
    }
    default:
      return { error: 'unknown function' };
  }
}

async function chat(user, messageText) {
  // messages: system + user
  const messages = [
    { role: 'system', content: 'You are an AI sales assistant for Phone Shop. Answer in Vietnamese. Use the provided tools when necessary and do not hallucinate product data.' },
    { role: 'user', content: messageText }
  ];

  const provider = (process.env.AI_PROVIDER || PROVIDER_OPENAI).toLowerCase();
  let response = null;
  if (provider === PROVIDER_OPENAI) {
    const apiResp = await callProviderOpenAI(messages, user ? user.id : null);
    // parse first choice
    const choice = apiResp.choices && apiResp.choices[0];
    if (choice && choice.message) {
      const msg = choice.message;
      if (msg.function_call) {
        const fname = msg.function_call.name;
        const fargs = JSON.parse(msg.function_call.arguments || '{}');
        const result = await runFunctionByName(fname, fargs, { userId: user ? user.id : null });
        // create assistant message with tool result
        const assistantReply = { role: 'assistant', content: `Called ${fname} and got result.` };
        // save conversation
        await AIConversation.create({ user: user ? user.id : null, messages: [{ sender: 'user', text: messageText }, { sender: 'assistant', text: JSON.stringify(result) }], metadata: { tool: fname } });
        return { tool: fname, result };
      } else {
        await AIConversation.create({ user: user ? user.id : null, messages: [{ sender: 'user', text: messageText }, { sender: 'assistant', text: msg.content }] });
        return { reply: msg.content };
      }
    }
  }
  return { reply: "Xin lỗi, hiện tại tôi không thể xử lý yêu cầu." };
}

module.exports = { chat };
