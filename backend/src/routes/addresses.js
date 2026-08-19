const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/addressController');

router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, ctrl.create);
router.put('/:id', requireAuth, ctrl.update);
router.delete('/:id', requireAuth, ctrl.remove);
router.post('/:id/default', requireAuth, ctrl.setDefault);
router.post('/:id/set-default', requireAuth, ctrl.setDefault);

module.exports = router;
