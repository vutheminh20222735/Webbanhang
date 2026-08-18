const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');
const { requireRoles } = require('../middleware/authorization');
const { chat } = require('../controllers/aiController');
const { adminChat } = require('../controllers/adminAiController');

router.post('/chat', optionalAuth, chat);
router.post('/admin-chat', requireAuth, requireRoles(['ADMIN','MANAGER']), adminChat);

module.exports = router;
