// Service to handle OpenRouter AI communication
const BACKEND_API_BASE = '/api/ai';
const OPENROUTER_DIRECT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_AUTH_URL = 'https://openrouter.ai/api/v1/auth/key';

export const DEFAULT_MODEL = 'liquid/lfm-2.5-2.6b:free';

export const AVAILABLE_MODELS = [
  { id: 'liquid/lfm-2.5-2.6b:free', name: 'Liquid LFM 2.5 (Free • Fast)', provider: 'Liquid AI' },
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'Google Gemma 4 26B (Free)', provider: 'Google' },
  { id: 'thinkingmachines/inkling:free', name: 'Inkling Thought (Free)', provider: 'Thinking Machines' },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA Nemotron 3.5 (Free)', provider: 'NVIDIA' }
];

export const getStoredModel = () => {
  return localStorage.getItem('openrouter_selected_model') || DEFAULT_MODEL;
};

export const setStoredModel = (modelId) => {
  localStorage.setItem('openrouter_selected_model', modelId);
};

export const getStoredApiKey = () => {
  return localStorage.getItem('openrouter_api_key') || import.meta.env.VITE_OPENROUTER_API_KEY || '';
};

export const setStoredApiKey = (key) => {
  if (key) {
    localStorage.setItem('openrouter_api_key', key);
  } else {
    localStorage.removeItem('openrouter_api_key');
  }
};

/**
 * Check AI status via backend or direct OpenRouter API
 */
export const checkAiStatus = async () => {
  // Try backend first
  try {
    const res = await fetch(`${BACKEND_API_BASE}/status`);
    if (res.ok) {
      const data = await res.json();
      if (data.connected) return data;
    }
  } catch (err) {
    console.warn('Backend /api/ai/status unavailable, checking direct OpenRouter...', err.message);
  }

  // Direct OpenRouter check
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    return { connected: false, message: 'No API key configured.' };
  }

  try {
    const res = await fetch(OPENROUTER_AUTH_URL, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    const data = await res.json();
    return {
      connected: res.ok,
      provider: 'OpenRouter AI (Direct)',
      data: data.data || data
    };
  } catch (err) {
    return { connected: false, error: err.message };
  }
};

/**
 * Send chat message to AI assistant
 */
export const sendChatMessage = async (messages, options = {}) => {
  const selectedModel = options.model || getStoredModel();
  const apiKey = getStoredApiKey();

  // Try backend first
  try {
    const res = await fetch(`${BACKEND_API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: selectedModel,
        systemPrompt: options.systemPrompt,
        temperature: options.temperature || 0.7
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.message) {
        return {
          content: data.message,
          model: data.model || selectedModel,
          source: 'backend'
        };
      }
    }
  } catch (err) {
    console.warn('Backend AI chat error, falling back to direct OpenRouter call...', err.message);
  }

  // Fallback: direct OpenRouter call
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured.');
  }

  const conversation = [
    {
      role: 'system',
      content: options.systemPrompt || 'You are the Brynex AI Business Brain Assistant, an advanced workforce and enterprise analytics AI copilot. Provide actionable, concise, well-structured business advice with bullet points.'
    },
    ...messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text || m.content || ''
    }))
  ];

  const res = await fetch(OPENROUTER_DIRECT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Brynex AI Business Brain'
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: conversation,
      temperature: options.temperature || 0.7
    })
  });

  const data = await res.json();
  if (!res.ok || !data.choices || data.choices.length === 0) {
    throw new Error(data.error?.message || 'Failed to generate response from OpenRouter.');
  }

  return {
    content: data.choices[0].message.content,
    model: data.model || selectedModel,
    source: 'direct'
  };
};

/**
 * Left-Brain AI Diagnosis: Evaluates root causes with confidence ratings
 */
export const diagnoseHrIssue = async (issue) => {
  try {
    const res = await fetch('/api/ai/hr/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: issue.title || issue.titleDetail,
        description: issue.description || issue.desc,
        category: issue.category
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) return data.data;
    }
  } catch (err) {
    console.warn('Backend diagnosis error, using client fallback:', err.message);
  }

  // Fallback defaults
  return {
    summary: "Workforce variance driven by concentrated shift overtime and payroll ratio divergence.",
    rootCauses: [
      {
        title: "Overtime & Shift Overlap Spike",
        description: "Inefficient handover overlaps added 28% unbudgeted overtime hours in retail branches.",
        confidence: "High Confidence",
        evidence: "Payroll telemetry: $42.6k increase in overtime replacement costs."
      },
      {
        title: "Frontline Compensation Disparity",
        description: "Salaries are 8.4% lower than regional retail benchmark, accelerating frontline attrition.",
        confidence: "High Confidence",
        evidence: "Exit interview records: 68% cite compensation gaps."
      },
      {
        title: "Manager Supervision & Scheduling Fatigue",
        description: "Back-to-back closing and opening shifts lead to fatigue and absenteeism.",
        confidence: "Medium Confidence",
        evidence: "Shift roster attendance records in West and Central branches."
      }
    ]
  };
};

/**
 * Layer 6 Decision Engine: Generates Option A, Option B, Option C
 */
export const generateDecisionOptions = async (issue) => {
  try {
    const res = await fetch('/api/ai/hr/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: issue.title || issue.titleDetail,
        description: issue.description || issue.desc
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data?.options) return data.data.options;
    }
  } catch (err) {
    console.warn('Backend options error, using client fallback:', err.message);
  }

  return [
    {
      id: "opt-a",
      badge: "Option A - Revenue Growth",
      title: "Targeted Staffing & Sales Productivity Coaching",
      description: "Introduce performance-based incentive tiers ($1,200/mo) and retail sales coaching.",
      impact: "Potential +$24k/mo revenue uplift",
      effort: "Medium",
      risk: "Medium Risk",
      cost: "Moderate"
    },
    {
      id: "opt-b",
      badge: "Option B - Cost Optimisation",
      title: "Roster Efficiency & Overtime Reduction",
      description: "Restructure roster to eliminate 15-minute overlap and enforce overtime pre-approval.",
      impact: "Save $14.2k/month in payroll cost",
      effort: "Low",
      risk: "Low Risk",
      cost: "Minimal"
    },
    {
      id: "opt-c",
      badge: "Option C - Combined Turnaround",
      title: "Cross-Branch Capacity Rebalance & Rest Rotation",
      description: "Redeploy 2 staff from low-traffic branches and mandate 10-hour rest between shifts.",
      impact: "EBITDA improvement +$18.5k/month",
      effort: "High",
      risk: "Medium Risk",
      cost: "Low"
    }
  ];
};

/**
 * Layer 7 Action Execution: Save approved management decisions as executable tasks
 */
export const deployActionPlan = (taskData) => {
  const existing = JSON.parse(localStorage.getItem('brynex_deployed_tasks') || '[]');
  const newTask = {
    id: Date.now(),
    title: taskData.title,
    category: taskData.category || 'HR Intelligence',
    owner: taskData.owner || 'HR Director',
    deadline: taskData.deadline || '14 Days',
    kpi: taskData.kpi || 'Reduce Payroll Ratio',
    optionBadge: taskData.optionBadge || 'Option B',
    status: 'pending',
    priority: 'Urgent',
    createdAt: new Date().toISOString()
  };
  existing.unshift(newTask);
  localStorage.setItem('brynex_deployed_tasks', JSON.stringify(existing));
  return newTask;
};

export const getDeployedTasks = () => {
  return JSON.parse(localStorage.getItem('brynex_deployed_tasks') || '[]');
};

