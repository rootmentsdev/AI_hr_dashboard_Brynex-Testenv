import { Prompt } from '../models/Prompt.js';

// In-memory fallback if MongoDB connection is pending or disrupted
let inMemoryPrompts = [
  {
    _id: 'mem-1',
    title: 'Prompt 1',
    promptText: 'only show FASHION CONSULTANT data',
    customRules: {
      targetAttrition: 5.0,
      targetProductivity: 90,
      targetDepartment: 'Sales',
      focusPriority: 'All',
      calculationMode: 'hybrid',
      timeHorizon: '01-30 Sep 2026'
    },
    isDefault: false,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mem-2',
    title: 'Prompt 2',
    promptText: 'Focus on high overtime staff (> 10 hrs) and fatigue turnaround risk',
    customRules: {
      targetAttrition: 5.0,
      targetProductivity: 90,
      targetDepartment: 'All',
      focusPriority: 'Critical',
      calculationMode: 'hybrid',
      timeHorizon: '01-30 Sep 2026'
    },
    isDefault: false,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mem-3',
    title: 'Prompt 3',
    promptText: 'Analyze resignation notices, exit patterns and immediate workforce retention risk',
    customRules: {
      targetAttrition: 4.5,
      targetProductivity: 92,
      targetDepartment: 'All',
      focusPriority: 'Critical',
      calculationMode: 'hybrid',
      timeHorizon: '01-30 Sep 2026'
    },
    isDefault: false,
    createdAt: new Date().toISOString()
  }
];

export const getPrompts = async (req, res) => {
  try {
    let prompts = await Prompt.find().sort({ createdAt: 1 }).lean();

    // If database is completely fresh, seed default starter prompts
    if (prompts.length === 0) {
      const seedPrompts = [
        {
          title: 'Prompt 1',
          promptText: 'only show FASHION CONSULTANT data',
          customRules: {
            targetAttrition: 5.0,
            targetProductivity: 90,
            targetDepartment: 'Sales',
            focusPriority: 'All',
            calculationMode: 'hybrid',
            timeHorizon: '01-30 Sep 2026'
          }
        },
        {
          title: 'Prompt 2',
          promptText: 'Focus on high overtime staff (> 10 hrs) and fatigue turnaround risk',
          customRules: {
            targetAttrition: 5.0,
            targetProductivity: 90,
            targetDepartment: 'All',
            focusPriority: 'Critical',
            calculationMode: 'hybrid',
            timeHorizon: '01-30 Sep 2026'
          }
        },
        {
          title: 'Prompt 3',
          promptText: 'Analyze resignation notices, exit patterns and immediate workforce retention risk',
          customRules: {
            targetAttrition: 4.5,
            targetProductivity: 92,
            targetDepartment: 'All',
            focusPriority: 'Critical',
            calculationMode: 'hybrid',
            timeHorizon: '01-30 Sep 2026'
          }
        }
      ];

      prompts = await Prompt.insertMany(seedPrompts);
    }

    return res.json({
      status: 'success',
      prompts
    });
  } catch (error) {
    console.warn('MongoDB getPrompts fallback to memory store:', error.message);
    return res.json({
      status: 'success',
      prompts: inMemoryPrompts,
      offline: true
    });
  }
};

export const createPrompt = async (req, res) => {
  try {
    let { title, promptText, customRules, isDefault } = req.body;

    if (!promptText || !promptText.trim()) {
      return res.status(400).json({ status: 'error', message: 'Prompt text is required.' });
    }

    // Auto-generate title like "Prompt 1", "Prompt 2" if not provided
    if (!title || !title.trim()) {
      try {
        const count = await Prompt.countDocuments();
        title = `Prompt ${count + 1}`;
      } catch {
        title = `Prompt ${inMemoryPrompts.length + 1}`;
      }
    }

    try {
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
    } catch (dbErr) {
      console.warn('MongoDB createPrompt fallback to memory store:', dbErr.message);
      const fallbackPrompt = {
        _id: `mem-${Date.now()}`,
        title: title.trim(),
        promptText: promptText.trim(),
        customRules: customRules || {},
        isDefault: Boolean(isDefault),
        createdAt: new Date().toISOString()
      };
      inMemoryPrompts.push(fallbackPrompt);
      return res.status(201).json({
        status: 'success',
        prompt: fallbackPrompt,
        offline: true
      });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updatePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, promptText, customRules, isDefault } = req.body;

    try {
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

      if (updated) {
        return res.json({ status: 'success', prompt: updated });
      }
    } catch (dbErr) {
      console.warn('MongoDB updatePrompt fallback:', dbErr.message);
    }

    const memIdx = inMemoryPrompts.findIndex((p) => p._id === id);
    if (memIdx !== -1) {
      inMemoryPrompts[memIdx] = {
        ...inMemoryPrompts[memIdx],
        ...(title && { title: title.trim() }),
        ...(promptText && { promptText: promptText.trim() }),
        ...(customRules && { customRules }),
        ...(isDefault !== undefined && { isDefault }),
        updatedAt: new Date().toISOString()
      };
      return res.json({ status: 'success', prompt: inMemoryPrompts[memIdx] });
    }

    return res.status(404).json({ status: 'error', message: 'Prompt not found.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deletePrompt = async (req, res) => {
  try {
    const { id } = req.params;

    try {
      await Prompt.findByIdAndDelete(id);
    } catch (dbErr) {
      console.warn('MongoDB deletePrompt fallback:', dbErr.message);
    }

    inMemoryPrompts = inMemoryPrompts.filter((p) => p._id !== id);

    return res.json({
      status: 'success',
      message: 'Prompt deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
