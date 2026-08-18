const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Coupon = require('../models/Coupon');
const AIConversation = require('../models/AIConversation');

const vnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')}₫`;

const customerTools = [
  { type: 'function', function: { name: 'searchProducts', description: 'Tìm điện thoại theo tên, hãng hoặc mô tả', parameters: { type: 'object', properties: { q: { type: 'string' }, maxResults: { type: 'integer' } }, required: ['q'] } } },
  { type: 'function', function: { name: 'getProductDetails', description: 'Chi tiết sản phẩm theo id hoặc slug', parameters: { type: 'object', properties: { id: { type: 'string' }, slug: { type: 'string' } } } } },
  { type: 'function', function: { name: 'checkProductStock', description: 'Kiểm tra tồn kho theo id sản phẩm', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
  { type: 'function', function: { name: 'getPromotions', description: 'Danh sách mã giảm giá đang áp dụng', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'getMyOrders', description: 'Đơn hàng của khách đã đăng nhập', parameters: { type: 'object', properties: {} } } }
];

const adminTools = [
  ...customerTools,
  { type: 'function', function: { name: 'getRevenue', description: 'Tổng doanh thu đã thanh toán theo khoảng ngày', parameters: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } } } } },
  { type: 'function', function: { name: 'topProducts', description: 'Sản phẩm bán chạy', parameters: { type: 'object', properties: { limit: { type: 'integer' } } } } },
  { type: 'function', function: { name: 'lowStock', description: 'Sản phẩm sắp hết hàng', parameters: { type: 'object', properties: { threshold: { type: 'integer' } } } } },
  { type: 'function', function: { name: 'paymentsStats', description: 'Thống kê thanh toán theo phương thức', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'todaysOrders', description: 'Số đơn hàng hôm nay', parameters: { type: 'object', properties: {} } } }
];

async function runTool(name, args, context) {
  const isAdmin = context && (context.role === 'ADMIN' || context.role === 'MANAGER');
  switch (name) {
    case 'searchProducts': {
      const q = args.q || '';
      const items = await Product.find({ $or: [{ name: new RegExp(q, 'i') }, { brand: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }] }).limit(args.maxResults || 5);
      return { results: items.map(i => ({ id: i._id, name: i.name, brand: i.brand, price: vnd(i.salePrice || i.price), stock: i.stock })) };
    }
    case 'getProductDetails': {
      const p = await Product.findOne(args.id ? { _id: args.id } : { slug: args.slug });
      if (!p) return { error: 'Không tìm thấy sản phẩm' };
      return { name: p.name, brand: p.brand, price: vnd(p.salePrice || p.price), ram: p.ram, storage: p.storage, stock: p.stock, description: p.description };
    }
    case 'checkProductStock': {
      const p = await Product.findById(args.id);
      return { name: p ? p.name : null, stock: p ? p.stock : 0 };
    }
    case 'getPromotions': {
      const coupons = await Coupon.find({ active: true }).limit(10);
      return { coupons: coupons.map(c => ({ code: c.code, type: c.discountType, value: c.value })) };
    }
    case 'getMyOrders': {
      if (!context.userId) return { error: 'Cần đăng nhập để xem đơn hàng' };
      const orders = await Order.find({ user: context.userId }).sort({ createdAt: -1 }).limit(8);
      return { orders: orders.map(o => ({ code: o.orderCode, total: vnd(o.total), status: o.orderStatus })) };
    }
    case 'getRevenue': {
      if (!isAdmin) return { error: 'Không có quyền' };
      const from = args.from ? new Date(args.from) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
      const to = args.to ? new Date(args.to) : new Date();
      const payments = await Payment.find({ paidAt: { $gte: from, $lte: to }, status: 'PAID' });
      const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
      return { total: vnd(total), count: payments.length, from, to };
    }
    case 'topProducts': {
      if (!isAdmin) return { error: 'Không có quyền' };
      const lim = args.limit || 5;
      const agg = await Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', qty: { $sum: '$items.quantity' } } },
        { $sort: { qty: -1 } },
        { $limit: lim }
      ]);
      const results = [];
      for (const a of agg) {
        const p = await Product.findById(a._id);
        results.push({ name: p ? p.name : 'Unknown', qty: a.qty });
      }
      return { top: results };
    }
    case 'lowStock': {
      if (!isAdmin) return { error: 'Không có quyền' };
      const threshold = args.threshold || 10;
      const items = await Product.find({ stock: { $lte: threshold } }).limit(20);
      return { items: items.map(i => ({ name: i.name, stock: i.stock })) };
    }
    case 'paymentsStats': {
      if (!isAdmin) return { error: 'Không có quyền' };
      const agg = await Payment.aggregate([{ $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }]);
      return { stats: agg.map(a => ({ method: a._id, count: a.count, total: vnd(a.total) })) };
    }
    case 'todaysOrders': {
      if (!isAdmin) return { error: 'Không có quyền' };
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const count = await Order.countDocuments({ createdAt: { $gte: start, $lte: end } });
      return { count };
    }
    default:
      return { error: 'Công cụ không hỗ trợ' };
  }
}

async function callOpenAI(messages, tools) {
  const key = process.env.AI_API_KEY;
  if (!key) throw new Error('missing_key');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.4
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI provider error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function chat(user, messageText, { admin = false } = {}) {
  const isAdmin = admin || (user && (user.role === 'ADMIN' || user.role === 'MANAGER'));
  const tools = isAdmin ? adminTools : customerTools;
  const system = isAdmin
    ? 'Bạn là trợ lý quản trị PhoneShop. Trả lời tiếng Việt, ngắn gọn, dùng số liệu từ công cụ. Định dạng tiền Việt Nam Đồng.'
    : 'Bạn là tư vấn bán điện thoại PhoneShop. Trả lời tiếng Việt, thân thiện. Chỉ dùng dữ liệu từ công cụ, không bịa giá. Gợi ý 1-3 máy phù hợp.';

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: messageText }
  ];

  try {
    let apiResp = await callOpenAI(messages, tools);
    let choice = apiResp.choices && apiResp.choices[0];
    let loops = 0;
    while (choice && choice.message && choice.message.tool_calls && loops < 3) {
      messages.push(choice.message);
      for (const call of choice.message.tool_calls) {
        const args = JSON.parse(call.function.arguments || '{}');
        const result = await runTool(call.function.name, args, { userId: user && user.id, role: user && user.role });
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
      apiResp = await callOpenAI(messages, tools);
      choice = apiResp.choices && apiResp.choices[0];
      loops += 1;
    }
    const reply = (choice && choice.message && choice.message.content) || 'Xin lỗi, tôi chưa trả lời được.';
    await AIConversation.create({
      user: user && user.id ? user.id : null,
      role: user && user.role ? user.role : 'GUEST',
      messages: [{ sender: 'user', text: messageText }, { sender: 'assistant', text: reply }]
    });
    return { reply };
  } catch (err) {
    if (String(err.message).includes('missing_key')) {
      return { reply: 'Chatbot chưa cấu hình AI_API_KEY. Vui lòng liên hệ quản trị.' };
    }
    console.error('AI chat error', err.message);
    return { reply: 'Xin lỗi, trợ lý AI đang bận. Bạn có thể xem danh sách điện thoại trên trang chủ.' };
  }
}

module.exports = { chat };
