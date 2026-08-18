const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const applyLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
const couponCtrl = require('../controllers/couponController');

router.post('/', requireAuth, requirePermission('COUPON_MANAGE'), couponCtrl.createCoupon);
router.put('/:id', requireAuth, requirePermission('COUPON_MANAGE'), couponCtrl.updateCoupon);
router.delete('/:id', requireAuth, requirePermission('COUPON_MANAGE'), couponCtrl.deleteCoupon);
router.get('/', requireAuth, requirePermission('COUPON_MANAGE'), couponCtrl.listCoupons);
router.post('/apply', requireAuth, applyLimiter,
	body('code').isString().notEmpty(),
	body('orderTotal').optional().isFloat({ min: 0 }),
	(req, res, next) => { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() }); next(); },
	couponCtrl.applyCoupon);

module.exports = router;
