const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRoles, requirePermission } = require('../middleware/authorization');
const { listUsers, getUser, updateRole } = require('../controllers/adminUserController');

// Only ADMIN or MANAGER can list users; role/permission updates require ROLE_UPDATE
router.get('/', requireAuth, requireRoles(['ADMIN','MANAGER']), listUsers);
router.get('/:id', requireAuth, requireRoles(['ADMIN','MANAGER']), getUser);
router.put('/:id/role', requireAuth, requirePermission('ROLE_UPDATE'), updateRole);

module.exports = router;
