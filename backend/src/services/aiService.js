const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Coupon = require('../models/Coupon');
const AIConversation = require('../models/AIConversation');

const vnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')}₫`;

function parseNumberLoose(input) {
  if (input === null || input === undefined) return null;
  const s = String(input).trim();
  if (!s) return null;
  // Allow "7,000,000", "7.000.000", "7 000 000"
  const cleaned = s.replace(/\s+/g, '').replace(/,/g, '').replace(/\./g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function vndFromMoneyValue(value, unit) {
  const v = Number(value);
  if (!Number.isFinite(v)) return null;
  const u = String(unit || '').toLowerCase();
  if (u.includes('tỷ') || u.includes('ty')) return v * 1_000_000_000;
  if (u.includes('triệu') || u === 'tr' || u.includes('trieu')) return v * 1_000_000;
  if (u.includes('nghìn') || u.includes('nghin') || u === 'k') return v * 1_000;
  return v;
}

function parseBudgetVnd(text) {
  const raw = String(text || '').toLowerCase();
  const t = raw.replace(/\s+/g, ' ').trim();
  if (!t) return null;

  // Range: "7-8 triệu", "7 đến 8 triệu"
  const range1 = t.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tr|tỷ|ty|nghìn|nghin)\s*(?:-|–|—|to|đến|tới)\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|tỷ|ty|nghìn|nghin)/i);
  if (range1) {
    const a = parseNumberLoose(range1[1]);
    const b = parseNumberLoose(range1[3]);
    const va = vndFromMoneyValue(a, range1[2]);
    const vb = vndFromMoneyValue(b, range1[4]);
    if (va && vb) {
      const minVnd = Math.min(va, vb);
      const maxVnd = Math.max(va, vb);
      return { minVnd, maxVnd, midVnd: (minVnd + maxVnd) / 2, source: range1[0] };
    }
  }

  // Range: "7-8 triệu" where unit appears once
  const range2 = t.match(/(\d+(?:[.,]\d+)?)\s*(?:-|–|—)\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|tỷ|ty|nghìn|nghin)/i);
  if (range2) {
    const a = parseNumberLoose(range2[1]);
    const b = parseNumberLoose(range2[2]);
    const unit = range2[3];
    const va = vndFromMoneyValue(a, unit);
    const vb = vndFromMoneyValue(b, unit);
    if (va && vb) {
      const minVnd = Math.min(va, vb);
      const maxVnd = Math.max(va, vb);
      return { minVnd, maxVnd, midVnd: (minVnd + maxVnd) / 2, source: range2[0] };
    }
  }

  // VND: "7.000.000đ", "9000000 vnd"
  const vnd1 = t.match(/(\d{3,}(?:[.,]\d+)*)\s*(đ|vnd)\b/i);
  if (vnd1) {
    const v = parseNumberLoose(vnd1[1]);
    if (v) {
      const approx = /(khoảng|tầm|xấp xỉ|chừng)/i.test(t);
      const under = /(dưới|không quá|tối đa|max|<=)/i.test(t);
      const over = /(trên|ít nhất|tối thiểu|min|>=)/i.test(t);
      if (under) return { minVnd: v * 0.7, maxVnd: v, midVnd: (v * 0.7 + v) / 2, source: vnd1[0] };
      if (over) return { minVnd: v, maxVnd: v * 1.5, midVnd: (v + v * 1.5) / 2, source: vnd1[0] };
      if (approx) return { minVnd: v * 0.85, maxVnd: v * 1.15, midVnd: v, source: vnd1[0] };
      return { minVnd: v * 0.85, maxVnd: v * 1.15, midVnd: v, source: vnd1[0] };
    }
  }

  // Units: "7 triệu", "1.5 tỷ", "500 nghìn"
  const single = t.match(/(\d+(?:[.,]\d+)?)\s*(tỷ|ty|triệu|tr|trieu|nghìn|nghin)\b/i);
  if (single) {
    const v = parseNumberLoose(single[1]);
    const budget = vndFromMoneyValue(v, single[2]);
    if (budget) {
      const approx = /(khoảng|tầm|xấp xỉ|chừng|ước chừng|tầm khoảng)/i.test(t);
      const under = /(dưới|không quá|tối đa|max|<=)/i.test(t);
      const over = /(trên|ít nhất|tối thiểu|min|>=)/i.test(t);
      if (under) return { minVnd: budget * 0.7, maxVnd: budget, midVnd: (budget * 0.7 + budget) / 2, source: single[0] };
      if (over) return { minVnd: budget, maxVnd: budget * 1.5, midVnd: (budget + budget * 1.5) / 2, source: single[0] };
      if (approx) return { minVnd: budget * 0.85, maxVnd: budget * 1.15, midVnd: budget, source: single[0] };
      return { minVnd: budget * 0.85, maxVnd: budget * 1.15, midVnd: budget, source: single[0] };
    }
  }

  // Raw digits: "7000000"
  const rawDigits = t.match(/\b(\d{5,})\b/);
  if (rawDigits) {
    const v = parseNumberLoose(rawDigits[1]);
    if (v) return { minVnd: v * 0.85, maxVnd: v * 1.15, midVnd: v, source: rawDigits[0] };
  }

  return null;
}

function extractBrandsPref(text) {
  const t = String(text || '').toLowerCase();
  const brands = [];
  if (/(iphone|apple|ios)/i.test(t)) brands.push('Apple');
  if (/(samsung|galaxy)/i.test(t)) brands.push('Samsung');
  if (/(xiaomi|redmi|poco|mi)/i.test(t)) brands.push('Xiaomi');
  if (/(oppo)/i.test(t)) brands.push('OPPO');
  if (/(vivo)/i.test(t)) brands.push('Vivo');
  if (/(realme)/i.test(t)) brands.push('Realme');
  return brands.length ? brands : null;
}

function extractNeeds(text) {
  const t = String(text || '').toLowerCase();
  const needs = [];
  if (/(camera|chụp|ảnh|zoom|xóa phông)/i.test(t)) needs.push('Camera tốt');
  if (/(pin|trâu|sạc nhanh)/i.test(t)) needs.push('Pin trâu');
  if (/(game|chơi game|fps|tốc độ)/i.test(t)) needs.push('Chơi game mượt');
  if (/(mỏng|nhỏ|gọn|một tay)/i.test(t)) needs.push('Gọn nhẹ');
  if (!needs.length) return null;
  return needs;
}

function buildBudgetReasons(p) {
  const parts = [];
  if (p.ram) parts.push(`RAM ${p.ram}`);
  if (p.storage) parts.push(`bộ nhớ ${p.storage}`);
  if (p.cpu) parts.push(`CPU ${p.cpu}`);
  if (p.screen) parts.push(`màn ${p.screen}`);
  if (p.camera) parts.push(`camera ${p.camera}`);
  if (p.battery) parts.push(`pin ${p.battery}`);
  return parts.slice(0, 4).join(' · ');
}

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

  const payload = {
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    messages,
    temperature: 0.4
  };

  if (Array.isArray(tools) && tools.length) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI provider error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function selectProductsByBudget({ minVnd, maxVnd, midVnd, brandPrefs, needs }, { limit = 3 } = {}) {
  const margin = 0.15;
  const qMin = minVnd * (1 - margin);
  const qMax = maxVnd * (1 + margin);

  const rawProducts = await Product.find({
    status: 'active',
    $or: [
      { salePrice: { $gte: qMin, $lte: qMax } },
      { price: { $gte: qMin, $lte: qMax } }
    ]
  }).limit(60);

  const effective = rawProducts
    .map((p) => {
      const eff = (p.salePrice || p.price) || 0;
      return { p, eff };
    })
    .filter((x) => x.eff > 0);

  let within = effective.filter((x) => x.eff >= minVnd && x.eff <= maxVnd);
  if (!within.length) within = effective; // fallback: lấy gần nhất

  const needHints = Array.isArray(needs) ? needs : [];

  const scored = within
    .map(({ p, eff }) => {
      const brandScore = Array.isArray(brandPrefs) && brandPrefs.length
        ? (brandPrefs.some((b) => String(p.brand || '').toLowerCase().includes(String(b).toLowerCase())) ? 1 : 0)
        : 0;

      const stockScore = (p.stock || 0) > 0 ? 1 : 0;
      const ratingScore = Number(p.rating || 0) / 10;
      const featuredScore = p.featured ? 0.5 : 0;
      const closest = -Math.abs(eff - midVnd) / midVnd;

      // Heuristic by needs: only if fields exist
      let needBonus = 0;
      const t = needHints.join(' ').toLowerCase();
      if (t.includes('camera') && p.camera) needBonus += 0.15;
      if (t.includes('pin') && p.battery) needBonus += 0.15;
      if (t.includes('game') && p.cpu) needBonus += 0.1;

      const score = closest + brandScore * 0.3 + stockScore * 0.2 + ratingScore * 0.05 + featuredScore + needBonus;
      return { p, eff, score };
    })
    .sort((a, b) => b.score - a.score);

  const picked = [];
  const seen = new Set();
  for (const item of scored) {
    const key = String(item.p.name || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    picked.push(item);
    seen.add(key);
    if (picked.length >= limit) break;
  }

  return picked.map(({ p, eff }) => ({
    id: p._id,
    name: p.name,
    brand: p.brand,
    priceVnd: vnd(eff),
    price: eff,
    ram: p.ram,
    storage: p.storage,
    cpu: p.cpu,
    screen: p.screen,
    camera: p.camera,
    battery: p.battery,
    stock: p.stock || 0
  }));
}

function fallbackReply(budget, candidates, needs) {
  const budgetText = budget && budget.minVnd && budget.maxVnd
    ? `khoảng ${vnd(budget.minVnd)} - ${vnd(budget.maxVnd)}`
    : 'trong tầm ngân sách bạn đưa ra';
  const needText = Array.isArray(needs) && needs.length ? ` Ưu tiên của bạn: ${needs.join(', ')}.` : '';

  if (!candidates.length) {
    return `Mình chưa tìm thấy máy nào khớp sát với ${budgetText}.${needText}\nBạn cho mình mở rộng ngân sách (ví dụ +1–2 triệu) hoặc cho biết thêm ưu tiên (camera/pin/chơi game) để mình gợi ý chính xác hơn.`;
  }

  const pick = candidates.slice(0, 3);
  const lines = [];
  lines.push(`Với ${budgetText}${needText} dưới đây là 2–3 lựa chọn đáng cân nhắc:`);
  for (const c of pick) {
    const specs = buildBudgetReasons(c);
    lines.push(`- ${c.name} (${c.brand}) — ${c.priceVnd}${c.stock ? ` (còn hàng: ${c.stock})` : ''}`);
    if (specs) lines.push(`  Ưu điểm: ${specs}`);
  }
  lines.push(`Bạn muốn mình ưu tiên hơn về ${Array.isArray(needs) && needs.length ? 'một trong các điểm trên' : 'camera/pin/chơi game'} để mình chốt đúng mẫu nhất nhé.`);
  return lines.join('\n');
}

async function chat(user, messageText, { admin = false, history = [] } = {}) {
  const roleUpper = user && user.role ? String(user.role).toUpperCase() : '';
  const isAdmin = admin || ['ADMIN', 'MANAGER'].includes(roleUpper);
  const tools = isAdmin ? adminTools : customerTools;

  const safeHistory = Array.isArray(history) ? history : [];
  const historyUserText = safeHistory
    .filter((m) => m && m.role === 'user' && typeof m.text === 'string' && m.text.trim())
    .map((m) => m.text.trim())
    .join('\n');

  const fullContextText = [historyUserText, messageText].filter(Boolean).join('\n');

  // ================== Customer (tư vấn điện thoại) ==================
  if (!isAdmin) {
    const budget = parseBudgetVnd(fullContextText);
    const needs = extractNeeds(fullContextText);
    const brandPrefs = extractBrandsPref(fullContextText);

    // Nếu chưa rõ ngân sách -> hỏi lại để tư vấn đúng
    if (!budget) {
      const needHint = Array.isArray(needs) && needs.length ? `Mình thấy bạn có vẻ quan tâm: ${needs.join(', ')}.` : '';
      const reply = `${needHint} Bạn cho mình xin ngân sách khoảng bao nhiêu (ví dụ 5–7 triệu) và ưu tiên chính (camera/pin/chơi game) nhé?`.trim();
      await AIConversation.create({
        user: user && user.id ? user.id : null,
        role: roleUpper || 'GUEST',
        metadata: { detectedNeeds: needs },
        messages: [{ sender: 'user', text: messageText }, { sender: 'assistant', text: reply }]
      });
      return { reply };
    }

    const candidates = await selectProductsByBudget(
      { minVnd: budget.minVnd, maxVnd: budget.maxVnd, midVnd: budget.midVnd, brandPrefs, needs },
      { limit: 3 }
    );

    const system = 'Bạn là tư vấn bán điện thoại PhoneShop. Trả lời tiếng Việt, tự nhiên, thuyết phục. Quan trọng: TUYỆT ĐỐI KHÔNG bịa sản phẩm hoặc giá. Chỉ được nêu đúng các máy có trong danh sách <PRODUCTS>. Khi nêu giá, hãy dùng đúng format `priceVnd` trong JSON. Nếu có nhiều lựa chọn, hãy so sánh ngắn gọn 1–2 ý quan trọng giữa các máy. Nếu cần hỏi thêm để chốt nhu cầu, hỏi 1-2 câu.';
    const userPrompt = [
      `Ngân sách của khách: ${vnd(budget.midVnd)} (khoảng ${vnd(budget.minVnd)} - ${vnd(budget.maxVnd)}).`,
      `Nhu cầu/ưu tiên phát hiện: ${Array.isArray(needs) && needs.length ? needs.join(', ') : '(chưa rõ)'}.`,
      `Tùy chọn thương hiệu (nếu có): ${Array.isArray(brandPrefs) && brandPrefs.length ? brandPrefs.join(', ') : '(không có)'}.`,
      'Giọng điệu: ngắn gọn, có lý do rõ ràng, nêu tên máy + giá + ưu điểm chính.',
      '<PRODUCTS>',
      JSON.stringify(candidates, null, 2),
      '</PRODUCTS>',
      '',
      `Tin nhắn gần nhất của khách: ${messageText}`
    ].join('\n');

    try {
      const apiResp = await callOpenAI([
        { role: 'system', content: system },
        { role: 'user', content: userPrompt }
      ]);

      const reply = (apiResp && apiResp.choices && apiResp.choices[0] && apiResp.choices[0].message && apiResp.choices[0].message.content)
        || fallbackReply(budget, candidates, needs);

      // Guard rail: đảm bảo ít nhất nhắc tới 1 máy + (nếu nêu tên) có giá khớp với priceVnd
      const replyLower = String(reply).toLowerCase();
      const digitsReply = String(reply).replace(/[^\d]/g, '');
      const verified = candidates.some((c) => {
        const name = String(c.name || '').toLowerCase();
        if (!name || !replyLower.includes(name)) return false;
        const digitsCandidate = String(c.priceVnd || '').replace(/[^\d]/g, '');
        if (!digitsCandidate) return false;
        return digitsReply.includes(digitsCandidate);
      });
      const finalReply = verified ? reply : fallbackReply(budget, candidates, needs);

      await AIConversation.create({
        user: user && user.id ? user.id : null,
        role: roleUpper || 'GUEST',
        metadata: { budget, detectedNeeds: needs, candidates: candidates.map((c) => c.name) },
        messages: [{ sender: 'user', text: messageText }, { sender: 'assistant', text: finalReply }]
      });

      return { reply: finalReply };
    } catch (err) {
      console.error('AI chat error', err && err.message ? err.message : err);
      const fallback = fallbackReply(budget, candidates, needs);
      await AIConversation.create({
        user: user && user.id ? user.id : null,
        role: roleUpper || 'GUEST',
        metadata: { budget, detectedNeeds: needs, candidates: candidates.map((c) => c.name), fallback: true },
        messages: [{ sender: 'user', text: messageText }, { sender: 'assistant', text: fallback }]
      });
      return { reply: fallback };
    }
  }

  // ================== Admin (giữ tool-calling cũ) ==================
  const system = 'Bạn là trợ lý quản trị PhoneShop. Trả lời tiếng Việt, ngắn gọn, dùng số liệu từ công cụ. Định dạng tiền Việt Nam Đồng.';
  const messages = [
    { role: 'system', content: system },
    ...safeHistory
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
      .map((m) => ({ role: m.role, content: m.text })),
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
        const result = await runTool(call.function.name, args, { userId: user && user.id, role: roleUpper });
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
      apiResp = await callOpenAI(messages, tools);
      choice = apiResp.choices && apiResp.choices[0];
      loops += 1;
    }

    const reply = (choice && choice.message && choice.message.content) || 'Xin lỗi, tôi chưa trả lời được.';
    await AIConversation.create({
      user: user && user.id ? user.id : null,
      role: roleUpper || 'GUEST',
      messages: [{ sender: 'user', text: messageText }, { sender: 'assistant', text: reply }]
    });
    return { reply };
  } catch (err) {
    if (String(err.message).includes('missing_key')) {
      return { reply: 'Chatbot chưa cấu hình AI_API_KEY. Vui lòng liên hệ quản trị.' };
    }
    console.error('AI chat error', err && err.message ? err.message : err);
    return { reply: 'Xin lỗi, hệ thống không thể xử lý yêu cầu của bạn ngay lúc này. Vui lòng thử lại.' };
  }
}

module.exports = { chat };
