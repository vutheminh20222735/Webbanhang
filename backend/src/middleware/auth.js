const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'No token' });
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

exports.requireRole = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'No user' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
};
