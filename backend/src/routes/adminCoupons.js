const express = require('express');

const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const couponCtrl = require('../controllers/couponController');

router.post(
  '/',
  requireAuth,
  requirePermission('COUPON_MANAGE'),
  couponCtrl.createCoupon
);

router.put(
  '/:id',
  requireAuth,
  requirePermission('COUPON_MANAGE'),
  couponCtrl.updateCoupon
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('COUPON_MANAGE'),
  couponCtrl.deleteCoupon
);

router.get(
  '/',
  requireAuth,
  requirePermission('COUPON_MANAGE'),
  couponCtrl.listCoupons
);

module.exports = router;