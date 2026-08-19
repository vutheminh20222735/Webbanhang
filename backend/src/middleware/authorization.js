const { ROLE_PERMISSIONS } = require('../config/roles');
const User = require('../models/User');

exports.requirePermission = (permission) => async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const role = String(user.role || req.user.role || '').toUpperCase();
    if (role === 'ADMIN') return next();

    const rolePerms = ROLE_PERMISSIONS[role] || [];
    const explicit = Array.isArray(user.permissions) ? user.permissions : [];
    const perms = new Set([...rolePerms, ...explicit]);

    if (!perms.has(permission)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: tài khoản ${role || 'UNKNOWN'} không có quyền ${permission}`
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

exports.requireRoles = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const role = String(req.user.role || '').toUpperCase();
  const allowed = roles.map((r) => String(r).toUpperCase());
  if (!allowed.includes(role)) return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
};
