const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { ORDER_STATUSES } = require('../utils/orderStatus');

const TZ = 'Asia/Ho_Chi_Minh';
const LOW_STOCK_THRESHOLD = 10;
/** Doanh thu thực tế = đơn đã giao */
const REVENUE_ORDER_STATUS = 'DELIVERED';

function formatDateVN(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function startOfTodayVN() {
  return new Date(`${formatDateVN(new Date())}T00:00:00+07:00`);
}

function parseRange(range) {
  const to = new Date();
  if (range === 'all') return { from: null, to };
  const days = range === '7days' ? 7 : range === '90days' ? 90 : 30;
  return { from: new Date(to.getTime() - days * 24 * 60 * 60 * 1000), to };
}

function eachDay(from, to) {
  if (!from) return [];
  const days = [];
  const cursor = new Date(from.getTime());
  let guard = 0;
  while (formatDateVN(cursor) <= formatDateVN(to) && guard++ < 400) {
    days.push(formatDateVN(cursor));
    cursor.setTime(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return days;
}

function dateMatch(from, to) {
  if (!from) return {};
  return { createdAt: { $gte: from, $lte: to } };
}

exports.dashboard = async (req, res, next) => {
  try {
    const { from, to } = parseRange(req.query.range || '30days');
    const match = dateMatch(from, to);
    const todayStart = startOfTodayVN();

    const [facet] = await Order.aggregate([
      { $match: match },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                revenue: {
                  $sum: { $cond: [{ $eq: ['$orderStatus', REVENUE_ORDER_STATUS] }, '$total', 0] }
                },
                delivered: {
                  $sum: { $cond: [{ $eq: ['$orderStatus', 'DELIVERED'] }, 1, 0] }
                }
              }
            }
          ],
          byStatus: [
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
          ],
          byDay: [
            { $match: { orderStatus: REVENUE_ORDER_STATUS } },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ }
                },
                total: { $sum: '$total' }
              }
            },
            { $sort: { _id: 1 } }
          ],
          topProducts: [
            { $match: { orderStatus: 'DELIVERED' } },
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.product',
                name: { $first: '$items.name' },
                quantity: { $sum: '$items.quantity' },
                revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
              }
            },
            { $sort: { quantity: -1 } },
            { $limit: 8 },
            {
              $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'product'
              }
            },
            {
              $addFields: {
                name: {
                  $ifNull: ['$name', { $arrayElemAt: ['$product.name', 0] }]
                }
              }
            }
          ],
          categories: [
            { $match: { orderStatus: REVENUE_ORDER_STATUS } },
            { $unwind: '$items' },
            {
              $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'product'
              }
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: 'categories',
                localField: 'product.category',
                foreignField: '_id',
                as: 'category'
              }
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: { $ifNull: ['$category.name', 'Khác'] },
                revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
              }
            },
            { $sort: { revenue: -1 } }
          ]
        }
      }
    ]);

    const [todayAgg] = await Order.aggregate([
      { $match: { createdAt: { $gte: todayStart }, orderStatus: REVENUE_ORDER_STATUS } },
      {
        $group: {
          _id: null,
          todayOrders: { $sum: 1 },
          todayRevenue: { $sum: '$total' }
        }
      }
    ]);

    const [todayOrdersAgg] = await Order.aggregate([
      { $match: { createdAt: { $gte: todayStart }, orderStatus: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);

    const totals = (facet && facet.totals[0]) || { totalOrders: 0, revenue: 0, delivered: 0 };
    const statusMap = {};
    ((facet && facet.byStatus) || []).forEach((s) => {
      statusMap[s._id] = s.count;
    });
    const ordersByStatus = ORDER_STATUSES.map((status) => ({
      status,
      count: statusMap[status] || 0
    }));

    const dayMap = {};
    ((facet && facet.byDay) || []).forEach((d) => {
      dayMap[d._id] = d.total;
    });
    const filledDays = from ? eachDay(from, to) : Object.keys(dayMap).sort();
    const revenueChart = filledDays.map((date) => ({
      date,
      total: dayMap[date] || 0
    }));

    const topProducts = ((facet && facet.topProducts) || []).map((p) => ({
      id: p._id,
      name: p.name || 'Sản phẩm',
      quantity: p.quantity,
      qty: p.quantity,
      revenue: p.revenue
    }));

    const categoryData = ((facet && facet.categories) || []).map((c) => ({
      category: c._id,
      revenue: c.revenue
    }));

    const [totalCustomers, totalProducts, lowStockDocs] = await Promise.all([
      User.countDocuments({ role: 'CUSTOMER' }),
      Product.countDocuments(),
      Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } }).sort({ stock: 1 }).limit(20).select('name stock')
    ]);

    const lowStock = lowStockDocs.map((p) => ({
      id: p._id,
      name: p.name,
      stock: p.stock
    }));

    const successRate = totals.totalOrders
      ? Math.round((totals.delivered / totals.totalOrders) * 1000) / 10
      : 0;

    res.json({
      success: true,
      data: {
        totalRevenue: totals.revenue || 0,
        totalOrders: totals.totalOrders || 0,
        totalCustomers,
        totalProducts,
        successRate,
        todayRevenue: (todayAgg && todayAgg.todayRevenue) || 0,
        todayOrders: (todayOrdersAgg && todayOrdersAgg.count) || 0,
        todayDelivered: (todayAgg && todayAgg.todayOrders) || 0,
        revenueChart,
        ordersByStatus,
        topProducts,
        lowStock,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
        categoryData
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.summary = async (req, res, next) => {
  try {
    const totalRevenueAgg = await Payment.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueAgg[0] ? totalRevenueAgg[0].total : 0;
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' });
    const totalProducts = await Product.countDocuments();
    // audit
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'REPORT_SUMMARY_VIEW', user: req.user.id, entity: 'Report', entityId: null, after: { totalRevenue, totalOrders } });
    res.json({ success: true, data: { totalRevenue, totalOrders, totalCustomers, totalProducts } });
  } catch (err) { next(err); }
};

exports.revenue = async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const agg = await Payment.aggregate([
      { $match: { status: 'PAID', paidAt: { $gte: from, $lte: to } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } }
    ]);
    const data = agg.map(a => ({ date: a._id, total: a.total }));
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'REPORT_REVENUE_VIEW', user: req.user.id, entity: 'Report', entityId: null, after: { from: from.toISOString(), to: to.toISOString() } });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.topProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '5');
    const agg = await Order.aggregate([
      { $match: { orderStatus: 'DELIVERED' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          qty: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { qty: -1 } },
      { $limit: limit }
    ]);
    const results = [];
    for (const a of agg) {
      const p = await Product.findById(a._id);
      results.push({ id: a._id, name: p ? p.name : 'Unknown', qty: a.qty });
    }
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'REPORT_TOP_PRODUCTS_VIEW', user: req.user.id, entity: 'Report', entityId: null, after: { limit } });
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};

exports.lowStock = async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.threshold || '10');
    const items = await Product.find({ stock: { $lte: threshold } }).limit(100);
    const data = items.map(i => ({ id: i._id, name: i.name, stock: i.stock }));
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'REPORT_LOW_STOCK_VIEW', user: req.user.id, entity: 'Report', entityId: null, after: { threshold } });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// Export report data to CSV/Excel/PDF
exports.export = async (req, res, next) => {
  try {
    const { report = 'summary', type = 'csv' } = req.query;
    // rate limit simple per-user export (prevent abuse)
    const userId = req.user && req.user.id;
    if (!userId) return res.status(403).json({ success: false, message: 'Unauthorized' });
    let rows = [];
    if (report === 'top-products') {
      const limit = parseInt(req.query.limit || '50');
      const agg = await require('../models/Order').aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', qty: { $sum: '$items.quantity' } } },
        { $sort: { qty: -1 } },
        { $limit: limit }
      ]);
      for (const a of agg) {
        const p = await require('../models/Product').findById(a._id);
        rows.push({ id: a._id.toString(), name: p ? p.name : 'Unknown', qty: a.qty });
      }
    } else if (report === 'revenue') {
      const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
      const to = req.query.to ? new Date(req.query.to) : new Date();
      const agg = await require('../models/Payment').aggregate([
        { $match: { status: 'PAID', paidAt: { $gte: from, $lte: to } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ]);
      rows = agg.map(a => ({ date: a._id, total: a.total }));
    } else if (report === 'low-stock') {
      const threshold = parseInt(req.query.threshold || '10');
      const items = await require('../models/Product').find({ stock: { $lte: threshold } }).limit(100);
      rows = items.map(i => ({ id: i._id.toString(), name: i.name, stock: i.stock }));
    } else {
      // default summary
      const payments = await require('../models/Payment').find({ status: 'PAID' }).limit(1000);
      rows = payments.map(p => ({ id: p._id.toString(), amount: p.amount, paidAt: p.paidAt }));
    }

    // audit export
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({ action: 'REPORT_EXPORT', user: req.user.id, entity: 'Report', entityId: null, after: { report, type } });

    if (type === 'csv') {
      const { Parser } = require('json2csv');
      const parser = new Parser();
      const csv = parser.parse(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${report}.csv"`);
      return res.send(csv);
    }

    if (type === 'excel') {
      const ExcelJS = require('exceljs');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Report');
      if (rows.length) ws.columns = Object.keys(rows[0]).map(k => ({ header: k, key: k }));
      ws.addRows(rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${report}.xlsx"`);
      await wb.xlsx.write(res);
      res.end();
      return;
    }

    if (type === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${report}.pdf"`);
      doc.pipe(res);
      doc.fontSize(16).text(`Report: ${report}`);
      doc.moveDown();
      rows.forEach(r => { doc.fontSize(10).text(JSON.stringify(r)); doc.moveDown(); });
      doc.end();
      return;
    }

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};
