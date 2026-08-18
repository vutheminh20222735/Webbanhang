const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const createLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });
const reviewCtrl = require('../controllers/reviewController');

router.post('/', requireAuth, createLimiter,
	body('product').isMongoId(),
	body('rating').isInt({ min: 1, max: 5 }),
	(req, res, next) => { const errors = validationResult(req); if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() }); next(); },
	reviewCtrl.createReview);
router.get('/can-review/:productId', requireAuth, reviewCtrl.canReview);
router.put('/:id', requireAuth, reviewCtrl.updateReview);
router.delete('/:id', requireAuth, reviewCtrl.deleteReview);
router.get('/product/:productId', reviewCtrl.listByProduct);

module.exports = router;
