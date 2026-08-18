const jwt = require('jsonwebtoken');

exports.optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
  } catch (err) {
    // ignore invalid token for public endpoints
  }
  next();
};
