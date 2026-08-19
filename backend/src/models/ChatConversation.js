const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['customer', 'staff'], required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const chatConversationSchema = new mongoose.Schema({
  // Linked user if logged in
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // For guests: browser-generated session id
  guestId: { type: String, default: null },
  guestName: { type: String, default: 'Khách hàng' },
  // Status: open | closed
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  // Staff member assigned to this conversation
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Unread count for staff side
  unreadStaff: { type: Number, default: 0 },
  // Unread count for customer side
  unreadCustomer: { type: Number, default: 0 },
  messages: [messageSchema],
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

chatConversationSchema.index({ user: 1 });
chatConversationSchema.index({ guestId: 1 });
chatConversationSchema.index({ status: 1, lastMessageAt: -1 });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
