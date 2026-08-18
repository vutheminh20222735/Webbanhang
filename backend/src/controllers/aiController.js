const aiService = require('../services/aiService');

exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'No message' });
    const user = req.user || null;
    const result = await aiService.chat(user, message);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
