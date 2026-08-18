const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const signToken = (user) => {
  const payload = { id: user._id, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (role && role !== 'CUSTOMER') {
      return res.status(403).json({ success: false, message: 'Nhân viên không được tự đăng ký. Liên hệ quản trị viên.' });
    }
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Thiếu họ tên, email hoặc mật khẩu' });
    if (String(password).length < 6) return res.status(400).json({ success: false, message: 'Mật khẩu tối thiểu 6 ký tự' });
    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: String(email).toLowerCase().trim(), password: hashed, role: 'CUSTOMER' });
    const token = signToken(user);
    res.json({ success: true, data: { token, user: { id: user._id, email: user.email, name: user.name, role: user.role } } });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ success: true, data: { token, user: { id: user._id, email: user.email, name: user.name, role: user.role } } });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};
