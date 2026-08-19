const aiService = require('../services/aiService');

exports.adminChat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'No message' });
    // ensure role check done at route
    const role = req.user.role;
    const safeHistory = Array.isArray(history) ? history : [];
    const result = await aiService.chat({ id: req.user.id, role }, message, { admin: true, history: safeHistory });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
