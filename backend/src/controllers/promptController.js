import { Prompt } from '../models/Prompt.js';

export const getPrompts = async (req, res) => {
  try {
    const prompts = await Prompt.find().sort({ createdAt: 1 }).lean();
    return res.json({
      status: 'success',
      prompts: prompts || []
    });
  } catch (error) {
    console.error('MongoDB getPrompts error:', error.message);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const createPrompt = async (req, res) => {
  try {
    let { title, promptText, customRules, isDefault } = req.body;

    if (!promptText || !promptText.trim()) {
      return res.status(400).json({ status: 'error', message: 'Prompt text is required.' });
    }

    if (!title || !title.trim()) {
      const count = await Prompt.countDocuments();
      title = `Prompt ${count + 1}`;
    }

    const newPrompt = await Prompt.create({
      title: title.trim(),
      promptText: promptText.trim(),
      customRules: customRules || {},
      isDefault: Boolean(isDefault)
    });

    return res.status(201).json({
      status: 'success',
      prompt: newPrompt
    });
  } catch (error) {
    console.error('MongoDB createPrompt error:', error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updatePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, promptText, customRules, isDefault } = req.body;

    const updated = await Prompt.findByIdAndUpdate(
      id,
      {
        ...(title && { title: title.trim() }),
        ...(promptText && { promptText: promptText.trim() }),
        ...(customRules && { customRules }),
        ...(isDefault !== undefined && { isDefault })
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Prompt not found.' });
    }

    return res.json({ status: 'success', prompt: updated });
  } catch (error) {
    console.error('MongoDB updatePrompt error:', error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deletePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Prompt.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Prompt not found.' });
    }

    return res.json({
      status: 'success',
      message: 'Prompt deleted successfully.'
    });
  } catch (error) {
    console.error('MongoDB deletePrompt error:', error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
