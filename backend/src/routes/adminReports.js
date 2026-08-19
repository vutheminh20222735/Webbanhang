const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const reportCtrl = require('../controllers/adminReportController');

router.get('/dashboard', requireAuth, requirePermission('REPORT_VIEW'), reportCtrl.dashboard);
router.get('/summary', requireAuth, requirePermission('REPORT_VIEW'), reportCtrl.summary);
router.get('/revenue', requireAuth, requirePermission('REPORT_VIEW'), reportCtrl.revenue);
router.get('/top-products', requireAuth, requirePermission('REPORT_VIEW'), reportCtrl.topProducts);
router.get('/low-stock', requireAuth, requirePermission('REPORT_VIEW'), reportCtrl.lowStock);
router.get('/export', requireAuth, requirePermission('REPORT_EXPORT'), reportCtrl.export);

module.exports = router;
