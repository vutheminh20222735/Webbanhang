const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

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
      { $unwind: '$items' },
      { $group: { _id: '$items.product', qty: { $sum: '$items.quantity' } } },
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
