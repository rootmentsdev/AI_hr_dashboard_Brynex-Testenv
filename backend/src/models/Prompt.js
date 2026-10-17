import mongoose from 'mongoose';

const promptSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    promptText: {
      type: String,
      required: true,
      trim: true
    },
    customRules: {
      targetAttrition: { type: Number, default: 5.0 },
      targetProductivity: { type: Number, default: 90 },
      targetDepartment: { type: String, default: 'All' },
      focusPriority: { type: String, default: 'All' },
      calculationMode: { type: String, default: 'hybrid' },
      timeHorizon: { type: String, default: '01-30 Sep 2026' }
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const Prompt = mongoose.model('Prompt', promptSchema);
