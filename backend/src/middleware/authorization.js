const { ROLE_PERMISSIONS } = require('../config/roles');
const User = require('../models/User');

exports.requirePermission = (permission) => async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    // load user with permissions
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    // accumulate permissions: explicit + role-based
    const rolePerms = ROLE_PERMISSIONS[user.role] || [];
    const explicit = Array.isArray(user.permissions) ? user.permissions : [];
    const perms = new Set([...rolePerms, ...explicit]);

    if (!perms.has(permission)) return res.status(403).json({ success: false, message: 'Forbidden' });
    next();
  } catch (err) {
    next(err);
  }
};

exports.requireRoles = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
};
