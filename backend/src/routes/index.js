const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/ai', require('./ai'));

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

module.exports = router;