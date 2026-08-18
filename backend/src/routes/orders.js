const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const orderController = require('../controllers/orderController');

router.get('/', requireAuth, orderController.listOrders);
router.get('/:id', requireAuth, orderController.getOrder);
router.put('/:id/status', requireAuth, requirePermission('ORDER_UPDATE'), orderController.updateStatus);
router.post('/:id/cancel', requireAuth, orderController.cancelOrder);

module.exports = router;
