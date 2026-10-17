import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  model: {
    type: String,
    default: 'Claude 4.5 Haiku'
  },
  bullets: [{ type: String }],
  title: { type: String },
  isError: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'New Conversation'
    },
    messages: [messageSchema],
    model: {
      type: String,
      default: 'claude-haiku-4-5-20251001'
    },
    connectedFilesCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
