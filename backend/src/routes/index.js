const express = require('express');

const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const reportCtrl = require('../controllers/adminReportController');

router.use('/auth', require('./auth'));
router.use('/ai', require('./ai'));

router.get('/admin/dashboard', requireAuth, requirePermission('REPORT_VIEW'), reportCtrl.dashboard);
router.use('/admin/users', require('./adminUsers'));
router.use('/admin/coupons', require('./adminCoupons')); // THÊM

router.use('/products', require('./products'));
router.use('/cart', require('./cart'));
router.use('/reviews', require('./reviews'));
router.use('/coupons', require('./coupons'));
router.use('/payments', require('./payments'));
router.use('/webhooks', require('./webhooks'));
router.use('/orders', require('./orders'));
router.use('/admin/reports', require('./adminReports'));
router.use('/wishlist', require('./wishlist'));
router.use('/addresses', require('./addresses'));

module.exports = router;