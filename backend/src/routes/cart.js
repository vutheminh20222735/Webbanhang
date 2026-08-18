const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const cartController = require('../controllers/cartController');

router.get('/', requireAuth, cartController.getCart);
router.post('/add', requireAuth, cartController.addToCart);
router.put('/item', requireAuth, cartController.updateItem);
router.delete('/item/:itemId', requireAuth, cartController.removeItem);
router.post('/coupon', requireAuth, cartController.applyCoupon);
router.post('/checkout', requireAuth, cartController.checkout);

module.exports = router;
