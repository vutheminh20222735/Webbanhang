const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRoles } = require('../middleware/authorization');
const { optionalAuth } = require('../middleware/optionalAuth');
const c = require('../controllers/chatController');

// Public / optional-auth
router.get('/contact', c.getContact);
router.post('/conversations', optionalAuth, c.getOrCreateConversation);
router.get('/conversations/:id', optionalAuth, c.getConversation);
router.post('/conversations/:id/messages', optionalAuth, c.sendMessage);

// Staff only
router.get('/admin/conversations', requireAuth, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), c.listConversations);
router.patch('/admin/conversations/:id/status', requireAuth, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), c.updateStatus);
router.patch('/admin/conversations/:id/read', requireAuth, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), c.markRead);
router.get('/admin/unread-count', requireAuth, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), c.unreadCount);

module.exports = router;
