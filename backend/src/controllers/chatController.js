const ChatConversation = require('../models/ChatConversation');
const shopContact = require('../config/shopContact');

// GET /api/chat/contact — trả về thông tin liên hệ cửa hàng
exports.getContact = (req, res) => {
  res.json({ success: true, data: shopContact });
};

// POST /api/chat/conversations — tạo hoặc lấy conversation hiện tại
exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { guestId, guestName } = req.body;

    let conv;
    if (userId) {
      // Tìm conversation đang open của user đăng nhập
      conv = await ChatConversation.findOne({ user: userId, status: 'open' });
      if (!conv) {
        conv = await ChatConversation.create({ user: userId, status: 'open', messages: [] });
      }
    } else {
      if (!guestId) return res.status(400).json({ success: false, message: 'guestId required for guest chat' });
      conv = await ChatConversation.findOne({ guestId, status: 'open' });
      if (!conv) {
        conv = await ChatConversation.create({
          guestId,
          guestName: guestName || 'Khách hàng',
          status: 'open',
          messages: []
        });
      }
    }

    res.json({ success: true, data: conv });
  } catch (err) { next(err); }
};

// GET /api/chat/conversations/:id — lịch sử tin nhắn
exports.getConversation = async (req, res, next) => {
  try {
    const conv = await ChatConversation.findById(req.params.id).populate('user', 'name email').lean();
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

    // Customer chỉ xem được conversation của mình
    const userId = req.user ? req.user.id : null;
    const role = req.user ? String(req.user.role || '').toUpperCase() : '';
    const isStaff = ['ADMIN', 'MANAGER', 'STAFF'].includes(role);
    if (!isStaff) {
      const ownedByUser = userId && conv.user && String(conv.user._id || conv.user) === String(userId);
      const ownedByGuest = req.query.guestId && conv.guestId === req.query.guestId;
      if (!ownedByUser && !ownedByGuest) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    res.json({ success: true, data: conv });
  } catch (err) { next(err); }
};

// POST /api/chat/conversations/:id/messages — khách hàng gửi tin
exports.sendMessage = async (req, res, next) => {
  try {
    const { text, guestId } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'text required' });

    const conv = await ChatConversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

    const userId = req.user ? req.user.id : null;
    const role = req.user ? String(req.user.role || '').toUpperCase() : '';
    const isStaff = ['ADMIN', 'MANAGER', 'STAFF'].includes(role);

    // Kiểm tra ownership
    if (!isStaff) {
      const ownedByUser = userId && conv.user && String(conv.user) === String(userId);
      const ownedByGuest = guestId && conv.guestId === guestId;
      if (!ownedByUser && !ownedByGuest) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    const msg = { sender: isStaff ? 'staff' : 'customer', text: text.trim() };
    conv.messages.push(msg);
    conv.lastMessage = text.trim();
    conv.lastMessageAt = new Date();
    conv.updatedAt = new Date();

    if (isStaff) {
      conv.unreadCustomer = (conv.unreadCustomer || 0) + 1;
    } else {
      conv.unreadStaff = (conv.unreadStaff || 0) + 1;
    }

    await conv.save();
    const savedMsg = conv.messages[conv.messages.length - 1];

    // emit socket event (handled in socket init)
    const io = req.app.get('io');
    if (io) {
      io.to(`conv_${conv._id}`).emit('new_message', {
        conversationId: conv._id,
        message: savedMsg
      });
      // Thông báo cho staff room khi khách gửi
      if (!isStaff) {
        io.to('staff_room').emit('conversation_updated', {
          conversationId: conv._id,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadStaff: conv.unreadStaff
        });
      }
    }

    res.json({ success: true, data: savedMsg });
  } catch (err) { next(err); }
};

// GET /api/chat/admin/conversations — staff: danh sách conversations
exports.listConversations = async (req, res, next) => {
  try {
    const { status = 'open', page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status !== 'all') filter.status = status;

    const convs = await ChatConversation.find(filter)
      .populate('user', 'name email avatar')
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await ChatConversation.countDocuments(filter);
    res.json({ success: true, data: convs, total });
  } catch (err) { next(err); }
};

// PATCH /api/chat/admin/conversations/:id/status — đóng/mở conversation
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['open', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be open|closed' });
    }
    const conv = await ChatConversation.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!conv) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: conv });
  } catch (err) { next(err); }
};

// PATCH /api/chat/admin/conversations/:id/read — đánh dấu đã đọc
exports.markRead = async (req, res, next) => {
  try {
    const conv = await ChatConversation.findByIdAndUpdate(
      req.params.id,
      { unreadStaff: 0, updatedAt: new Date() },
      { new: true }
    );
    if (!conv) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { unreadStaff: conv.unreadStaff } });
  } catch (err) { next(err); }
};

// GET /api/chat/admin/unread-count — tổng số cuộc chat chưa đọc
exports.unreadCount = async (req, res, next) => {
  try {
    const count = await ChatConversation.countDocuments({ unreadStaff: { $gt: 0 }, status: 'open' });
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
};
