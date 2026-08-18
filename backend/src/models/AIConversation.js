const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user','assistant','system'], default: 'user' },
  text: { type: String },
  attachments: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

const aiConversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String },
  messages: [messageSchema],
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AIConversation', aiConversationSchema);
