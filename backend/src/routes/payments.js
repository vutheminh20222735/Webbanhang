const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const paymentController = require('../controllers/paymentController');

router.post('/create', requireAuth, paymentController.createPayment);
router.post('/:paymentId/refund', requireAuth, requirePermission('PAYMENT_REFUND'), paymentController.refund);

module.exports = router;
