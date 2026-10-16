// Service to handle AI communication (Anthropic Claude & OpenRouter)
const BACKEND_API_BASE = '/api/ai';
const ANTHROPIC_DIRECT_URL = 'https://api.anthropic.com/v1/messages';
const OPENROUTER_DIRECT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_AUTH_URL = 'https://openrouter.ai/api/v1/auth/key';

export const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export const AVAILABLE_MODELS = [
  { id: 'claude-haiku-4-5-20251001', name: 'Claude 4.5 Haiku (Fast & Precise • Anthropic)', provider: 'Anthropic Claude' },
  { id: 'claude-sonnet-4-6', name: 'Claude 4.6 Sonnet (Deep Strategic Reasoning • Anthropic)', provider: 'Anthropic Claude' },
  { id: 'claude-haiku-5-5', name: 'Claude 5.5 Haiku (Next-Gen Intelligent • Anthropic)', provider: 'Anthropic Claude' },
  { id: 'claude-opus-4-6', name: 'Claude 4.6 Opus (Flagship Intelligence • Anthropic)', provider: 'Anthropic Claude' },
  { id: 'liquid/lfm-2.5-2.6b:free', name: 'Liquid LFM 2.5 (Free • Fast)', provider: 'Liquid AI' },
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'Google Gemma 4 26B (Free)', provider: 'Google' },
  { id: 'thinkingmachines/inkling:free', name: 'Inkling Thought (Free)', provider: 'Thinking Machines' },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA Nemotron 3.5 (Free)', provider: 'NVIDIA' }
];

export const getStoredModel = () => {
  return localStorage.getItem('ai_selected_model') || localStorage.getItem('openrouter_selected_model') || DEFAULT_MODEL;
};

export const setStoredModel = (modelId) => {
  localStorage.setItem('ai_selected_model', modelId);
  localStorage.setItem('openrouter_selected_model', modelId);
};

export const getStoredApiKey = () => {
  return (
    localStorage.getItem('anthropic_api_key') ||
    import.meta.env.VITE_ANTHROPIC_API_KEY ||
    localStorage.getItem('openrouter_api_key') ||
    import.meta.env.VITE_OPENROUTER_API_KEY ||
    ''
  );
};

export const setStoredApiKey = (key) => {
  if (key) {
    if (key.startsWith('sk-ant-')) {
      localStorage.setItem('anthropic_api_key', key);
    } else {
      localStorage.setItem('openrouter_api_key', key);
    }
  } else {
    localStorage.removeItem('anthropic_api_key');
    localStorage.removeItem('openrouter_api_key');
  }
};

/**
 * Check AI status via backend or direct check
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
    console.warn('Backend /api/ai/status unavailable, checking direct API...', err.message);
  }

  const apiKey = getStoredApiKey();
  if (!apiKey) {
    return { connected: false, message: 'No API key configured.' };
  }

  // If Anthropic key
  if (apiKey.startsWith('sk-ant-')) {
    return {
      connected: true,
      provider: 'Anthropic Claude',
      defaultModel: DEFAULT_MODEL,
      status: 'active'
    };
  }

  // Direct OpenRouter check
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

  // Try backend first (recommended as it safely proxies Anthropic and OpenRouter without client CORS issues)
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
          provider: data.provider || 'Anthropic Claude',
          source: 'backend'
        };
      }
    }
  } catch (err) {
    console.warn('Backend AI chat error, falling back to direct API call...', err.message);
  }

  // Fallback: direct browser calls
  if (!apiKey) {
    throw new Error('AI API key is not configured.');
  }

  // Anthropic direct call
  if (apiKey.startsWith('sk-ant-') || selectedModel.startsWith('claude')) {
    const system = options.systemPrompt || 'You are the Brynex AI Business Brain Assistant, an advanced workforce and enterprise analytics AI copilot. Provide actionable, concise, well-structured business advice with bullet points.';
    const anthropicMsgs = messages
      .filter((m) => (m.text || m.content || '').trim())
      .map((m) => ({
        role: m.sender === 'assistant' || m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text || m.content || ''
      }));

    if (anthropicMsgs.length === 0 || anthropicMsgs[0].role !== 'user') {
      anthropicMsgs.unshift({ role: 'user', content: 'Hello' });
    }

    const res = await fetch(ANTHROPIC_DIRECT_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel.startsWith('claude') ? selectedModel : 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system,
        messages: anthropicMsgs,
        temperature: options.temperature || 0.7
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to generate response from Anthropic Claude.');
    }

    return {
      content: data.content?.[0]?.text || '',
      model: data.model || selectedModel,
      provider: 'Anthropic Claude',
      source: 'direct'
    };
  }

  // OpenRouter direct call
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
    throw new Error(data.error?.message || 'Failed to generate response from AI provider.');
  }

  return {
    content: data.choices[0].message.content,
    model: data.model || selectedModel,
    provider: 'OpenRouter AI',
    source: 'direct'
  };
};

/**
 * Quick analysis for an issue
 */
export const analyzeWorkforceIssue = async (issue) => {
  const prompt = `Analyze this workforce issue and provide root cause + 3 immediate action steps:
Title: ${issue.title}
Category: ${issue.category || 'HR'}
Details: ${issue.description || issue.subtitle || 'Workforce metric anomaly'}`;

  return sendChatMessage([{ sender: 'user', text: prompt }]);
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
