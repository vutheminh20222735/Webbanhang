const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRoles, requirePermission } = require('../middleware/authorization');
const { listUsers, getUser, updateRole, createStaff } = require('../controllers/adminUserController');

router.get('/', requireAuth, requireRoles(['ADMIN','MANAGER']), listUsers);
router.post('/', requireAuth, requireRoles(['ADMIN']), createStaff);
router.get('/:id', requireAuth, requireRoles(['ADMIN','MANAGER']), getUser);
router.put('/:id/role', requireAuth, requirePermission('ROLE_UPDATE'), updateRole);

module.exports = router;
