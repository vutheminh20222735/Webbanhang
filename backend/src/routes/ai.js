const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRoles } = require('../middleware/authorization');
const { chat } = require('../controllers/aiController');
const { adminChat } = require('../controllers/adminAiController');

router.post('/chat', requireAuth, chat);
router.post('/admin-chat', requireAuth, requireRoles(['ADMIN','MANAGER']), adminChat);

module.exports = router;
