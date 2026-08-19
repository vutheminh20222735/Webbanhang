const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/wishlistController');

router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, ctrl.add);
router.delete('/', requireAuth, ctrl.clear);
router.delete('/:productId', requireAuth, ctrl.remove);

module.exports = router;
