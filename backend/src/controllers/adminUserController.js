const User = require('../models/User');
const bcrypt = require('bcrypt');
const AuditLog = require('../models/AuditLog');
const STAFF_ROLES = ['STAFF', 'MANAGER'];

exports.listUsers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    const skip = (page - 1) * limit;
    const users = await User.find(filter).select('-password').skip(skip).limit(parseInt(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: { users, total } });
  } catch (err) { next(err); }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.createStaff = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Chỉ ADMIN mới được cấp tài khoản nhân viên' });
    }
    const { name, email, password, role = 'STAFF' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Thiếu họ tên, email hoặc mật khẩu' });
    if (!STAFF_ROLES.includes(role)) return res.status(400).json({ success: false, message: 'Chỉ được tạo vai trò STAFF hoặc MANAGER' });
    if (String(password).length < 6) return res.status(400).json({ success: false, message: 'Mật khẩu tối thiểu 6 ký tự' });
    const normalized = String(email).toLowerCase().trim();
    const exists = await User.findOne({ email: normalized });
    if (exists) return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: normalized, password: hashed, role });
    await AuditLog.create({ action: 'STAFF_CREATE', user: req.user.id, entity: 'User', entityId: user._id, after: { email: user.email, role: user.role } });
    res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { role, permissions } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    if (role) {
      if (role === 'ADMIN' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Không được gán quyền ADMIN' });
      }
      user.role = role;
    }
    if (permissions) user.permissions = permissions;
    await user.save();
    res.json({ success: true, data: { id: user._id, role: user.role, permissions: user.permissions } });
  } catch (err) { next(err); }
};
