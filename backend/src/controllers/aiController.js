const aiService = require('../services/aiService');

exports.chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'No message' });
    const user = req.user || null;
    const safeHistory = Array.isArray(history) ? history : [];
    const result = await aiService.chat(user, message, { history: safeHistory });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
