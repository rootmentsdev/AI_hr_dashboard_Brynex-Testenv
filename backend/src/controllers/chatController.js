import { ChatSession } from '../models/ChatSession.js';

// Helper to generate a clean title from the user query
const generateTitle = (text = '') => {
  const clean = text.replace(/^[#\-*•>\s]+/, '').trim();
  if (!clean) return 'New Conversation';
  if (clean.length <= 40) return clean;
  return clean.substring(0, 38).trim() + '...';
};

/**
 * Get all conversations list (sorted by latest activity)
 */
export const getConversations = async (req, res) => {
  try {
    const sessions = await ChatSession.find({}, {
      title: 1,
      createdAt: 1,
      updatedAt: 1,
      model: 1,
      messages: { $slice: -1 }
    })
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = sessions.map((s) => ({
      id: s._id,
      _id: s._id,
      title: s.title || 'Conversation',
      updatedAt: s.updatedAt,
      createdAt: s.createdAt,
      model: s.model,
      lastMessageSnippet: s.messages?.[0]?.text?.substring(0, 60) || ''
    }));

    return res.json({
      status: 'success',
      conversations: formatted
    });
  } catch (err) {
    console.error('MongoDB getConversations error:', err.message);
    return res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

/**
 * Get single conversation with full message trajectory
 */
export const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await ChatSession.findById(id).lean();

    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Conversation not found.' });
    }

    return res.json({
      status: 'success',
      conversation: {
        id: session._id,
        _id: session._id,
        title: session.title,
        messages: session.messages || [],
        model: session.model,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    });
  } catch (err) {
    console.error('MongoDB getConversationById error:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/**
 * Create a new conversation session
 */
export const createConversation = async (req, res) => {
  try {
    const { title, messages = [], model = 'claude-haiku-4-5-20251001', connectedFilesCount = 0 } = req.body;

    let derivedTitle = title;
    if (!derivedTitle || derivedTitle === 'New Conversation' || derivedTitle === 'New Chat') {
      const firstUserMsg = messages.find((m) => m.sender === 'user');
      derivedTitle = firstUserMsg ? generateTitle(firstUserMsg.text) : 'New Conversation';
    }

    const newSession = await ChatSession.create({
      title: derivedTitle,
      messages,
      model,
      connectedFilesCount
    });

    return res.status(201).json({
      status: 'success',
      conversation: {
        id: newSession._id,
        _id: newSession._id,
        title: newSession.title,
        messages: newSession.messages,
        model: newSession.model,
        createdAt: newSession.createdAt,
        updatedAt: newSession.updatedAt
      }
    });
  } catch (err) {
    console.error('MongoDB createConversation error:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/**
 * Append messages or update conversation trajectory
 */
export const saveConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { messages = [], model, title } = req.body;

    let updateFields = {
      messages,
      updatedAt: new Date()
    };

    if (model) updateFields.model = model;

    // Auto-update title if it's currently generic
    if (title) {
      updateFields.title = title;
    } else {
      const session = await ChatSession.findById(id);
      if (session && (session.title === 'New Conversation' || session.title === 'New Chat')) {
        const firstUser = messages.find((m) => m.sender === 'user');
        if (firstUser) {
          updateFields.title = generateTitle(firstUser.text);
        }
      }
    }

    const updated = await ChatSession.findByIdAndUpdate(id, updateFields, { new: true }).lean();

    if (updated) {
      return res.json({
        status: 'success',
        conversation: {
          id: updated._id,
          _id: updated._id,
          title: updated.title,
          messages: updated.messages,
          model: updated.model,
          updatedAt: updated.updatedAt
        }
      });
    }

    return res.status(404).json({ status: 'error', message: 'Conversation not found.' });
  } catch (err) {
    console.error('MongoDB saveConversationMessages error:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/**
 * Rename conversation title
 */
export const updateConversationTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ status: 'error', message: 'Title cannot be empty.' });
    }

    const updated = await ChatSession.findByIdAndUpdate(
      id,
      { title: title.trim(), updatedAt: new Date() },
      { new: true }
    ).lean();

    if (updated) {
      return res.json({ status: 'success', conversation: updated });
    }

    return res.status(404).json({ status: 'error', message: 'Conversation not found.' });
  } catch (err) {
    console.error('MongoDB updateConversationTitle error:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ChatSession.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Conversation not found.' });
    }

    return res.json({
      status: 'success',
      message: 'Conversation deleted successfully.'
    });
  } catch (err) {
    console.error('MongoDB deleteConversation error:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
