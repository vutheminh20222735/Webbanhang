const User = require('../models/User');

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

exports.updateRole = async (req, res, next) => {
  try {
    const { role, permissions } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    if (role) user.role = role;
    if (permissions) user.permissions = permissions;
    await user.save();
    res.json({ success: true, data: { id: user._id, role: user.role, permissions: user.permissions } });
  } catch (err) { next(err); }
};
