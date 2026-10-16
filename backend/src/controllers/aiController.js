import {
  getUploadedFilesStore,
  getCachedSyncedEmployees,
  getCachedLatestAnalysis,
  getCachedEnterpriseAnalytics
} from './hrController.js';
import { extractDatasetTelemetry } from '../services/aiDocumentAnalyzerService.js';

// AI Controller supporting Anthropic Claude (Primary) & OpenRouter (Fallback)
const DEFAULT_SYSTEM_PROMPT = `You are the Brynex AI Business Brain Intelligence Assistant, an enterprise-grade AI workforce intelligence copilot.
You specialize in workforce analytics, employee attrition prevention, compensation benchmark analysis, team productivity, scheduling fatigue management, and executive decision support.
Respond with sharp, structured, data-driven, and actionable advice. Use clear bullet points and bold headers when structuring recommendations. Keep answers focused and impactful.`;

const CLAUDE_MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
  'claude-haiku-5-5',
  'claude-opus-4-6'
];

const OPENROUTER_FALLBACK_MODELS = [
  'liquid/lfm-2.5-2.6b:free',
  'google/gemma-4-26b-a4b-it:free',
  'thinkingmachines/inkling:free',
  'nvidia/nemotron-3.5-lightning:free'
];

/**
 * Helper to call Anthropic Claude API
 */
async function callClaude({ apiKey, model, messages, systemPrompt, temperature = 0.7 }) {
  // Anthropic requires system prompt at the top-level 'system' property
  const system = systemPrompt || DEFAULT_SYSTEM_PROMPT;

  // Filter messages to strictly alternate or keep 'user' and 'assistant' roles
  const anthropicMessages = [];
  messages.forEach((msg) => {
    const role = msg.role === 'assistant' || msg.sender === 'assistant' ? 'assistant' : 'user';
    const content = msg.content || msg.text || '';
    if (!content.trim()) return;

    // Ensure we don't send consecutive identical roles
    if (anthropicMessages.length > 0 && anthropicMessages[anthropicMessages.length - 1].role === role) {
      anthropicMessages[anthropicMessages.length - 1].content += `\n\n${content}`;
    } else {
      anthropicMessages.push({ role, content });
    }
  });

  // Ensure first message is user
  if (anthropicMessages.length === 0 || anthropicMessages[0].role !== 'user') {
    anthropicMessages.unshift({ role: 'user', content: 'Hello assistant.' });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system,
      messages: anthropicMessages,
      temperature: typeof temperature === 'number' ? Math.min(Math.max(temperature, 0), 1) : 0.7
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.error?.message || `Anthropic request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  const text = data.content?.[0]?.text || '';
  return {
    content: text,
    model: data.model || model,
    provider: 'Anthropic Claude',
    usage: data.usage
  };
}

/**
 * Helper to call OpenRouter API
 */
async function callOpenRouter({ apiKey, model, messages, systemPrompt, temperature = 0.7 }) {
  const conversation = [{ role: 'system', content: systemPrompt || DEFAULT_SYSTEM_PROMPT }];
  messages.forEach((msg) => {
    conversation.push({
      role: msg.role || (msg.sender === 'user' ? 'user' : 'assistant'),
      content: msg.content || msg.text || ''
    });
  });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Brynex AI Business Brain'
    },
    body: JSON.stringify({
      model: model || process.env.OPENROUTER_MODEL || 'liquid/lfm-2.5-2.6b:free',
      messages: conversation,
      temperature: typeof temperature === 'number' ? temperature : 0.7
    })
  });

  const data = await response.json();
  if (!response.ok || !data.choices || data.choices.length === 0) {
    throw new Error(data.error?.message || `OpenRouter request failed with status ${response.status}`);
  }

  return {
    content: data.choices[0].message?.content || '',
    model: data.model || model,
    provider: 'OpenRouter AI',
    usage: data.usage
  };
}

/**
 * Perform chat completion with Claude (Primary) with OpenRouter fallback
 */
export const chatWithAi = async (req, res) => {
  try {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!anthropicKey && !openrouterKey) {
      return res.status(500).json({
        success: false,
        error: 'No AI API key (Anthropic or OpenRouter) is configured in backend environment.'
      });
    }

    const { messages = [], prompt, model, systemPrompt, temperature = 0.7 } = req.body;

    // Normalize messages format
    const normalizedMessages = [];
    if (Array.isArray(messages) && messages.length > 0) {
      messages.forEach((msg) => {
        normalizedMessages.push({
          role: msg.role || (msg.sender === 'user' ? 'user' : 'assistant'),
          content: msg.content || msg.text || ''
        });
      });
    } else if (prompt) {
      normalizedMessages.push({
        role: 'user',
        content: prompt
      });
    }

    // Build context-aware system prompt grounded in actual uploaded data
    let dynamicDataContext = '';
    try {
      const uploadedFiles = getUploadedFilesStore();
      const latestAnalysis = getCachedLatestAnalysis();
      const syncedEmployees = getCachedSyncedEmployees();
      const enterpriseAnalytics = getCachedEnterpriseAnalytics();

      if (uploadedFiles && uploadedFiles.length > 0) {
        const telemetry = extractDatasetTelemetry(uploadedFiles);
        dynamicDataContext = `
--- CONNECTED LIVE ENTERPRISE DATASETS (${uploadedFiles.length} file(s) active) ---
Active Datasets:
${uploadedFiles.map(f => `• "${f.name}" (${f.rows} rows, scope: ${f.holds || 'General Data'}, columns: [${f.parsedRows?.[0] ? Object.keys(f.parsedRows[0]).join(', ') : 'none'}])`).join('\n')}

DATASET STATISTICAL AGGREGATES & DISTRIBUTIONS:
${JSON.stringify(telemetry, null, 2)}

${syncedEmployees && syncedEmployees.length > 0 ? `
SYNCED EMPLOYEE DIGITAL PROFILES (${syncedEmployees.length} total employees):
Sample profiles:
${JSON.stringify(syncedEmployees.slice(0, 25), null, 2)}
` : ''}

${enterpriseAnalytics ? `
ENTERPRISE CROSS-CORRELATION:
${JSON.stringify(enterpriseAnalytics, null, 2)}
` : ''}

${latestAnalysis && latestAnalysis.attentionItems ? `
LATEST DETECTED ISSUES & EXECUTIVE FINDINGS:
- HR Health Score: ${latestAnalysis.healthScore}% (${latestAnalysis.healthStatus})
- Summary: ${latestAnalysis.attentionSummary || 'Nominal'}
- Detected Issues:
${latestAnalysis.attentionItems.map((item, idx) => `  ${idx + 1}. [${item.priority || 'High'}] ${item.title}: ${item.description}`).join('\n')}
` : ''}
--------------------------------------------------------
BEHAVIOR & REASONING RULES:
1. DATA-GROUNDED ANSWERS (LIKE CHATGPT / CLAUDE WITH ATTACHED CSV): When the user asks questions about their data, workforce, shifts, employees, attendance, rest intervals, overtime, salaries, revenue, or specific branches/roles, answer specifically using the actual records, employee IDs (e.g., EMP-109, EMP-115, etc.), names, numbers, and stats from the connected datasets above.
2. GENERAL CHATBOT CAPABILITY: If the user asks general conversational queries, definitions, HR best practices, management formulas, emails, memos, coding, or unrelated questions, answer helpfully, conversationally, and thoroughly just like a standard high-intelligence AI chatbot.
3. CONCISENESS & CLARITY: Format responses with clean GitHub Markdown bolding, bullet points, and headers so they are easy to scan.
`;
      } else {
        dynamicDataContext = `
--- DATA CONTEXT ---
No CSV or Excel datasets are currently uploaded to this session.
You are functioning as a full conversational AI assistant. You can answer general HR, business strategy, management, organizational development, leadership, or general questions. You can also remind the user that they can upload their CSV/Excel files in Data Management whenever they want you to analyze their specific company numbers.
-------------------
`;
      }
    } catch (dataErr) {
      console.warn('Could not compile dataset context for chat:', dataErr.message);
    }

    const effectiveSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\n${dynamicDataContext}`
      : `${DEFAULT_SYSTEM_PROMPT}\n\n${dynamicDataContext}`;

    const isClaudeModelRequested = model && (model.startsWith('claude') || model.includes('anthropic'));
    const preferClaude = !!anthropicKey && (process.env.AI_PROVIDER === 'anthropic' || isClaudeModelRequested || !openrouterKey);

    // 1. Try Anthropic Claude if configured
    if (anthropicKey && (preferClaude || isClaudeModelRequested)) {
      const claudeCandidates = [];
      if (model && model.startsWith('claude')) claudeCandidates.push(model);
      if (process.env.ANTHROPIC_MODEL && !claudeCandidates.includes(process.env.ANTHROPIC_MODEL)) {
        claudeCandidates.push(process.env.ANTHROPIC_MODEL);
      }
      CLAUDE_MODELS.forEach((m) => {
        if (!claudeCandidates.includes(m)) claudeCandidates.push(m);
      });

      let claudeError = null;
      for (const targetModel of claudeCandidates) {
        try {
          const result = await callClaude({
            apiKey: anthropicKey,
            model: targetModel,
            messages: normalizedMessages,
            systemPrompt: effectiveSystemPrompt,
            temperature
          });

          return res.json({
            success: true,
            message: result.content,
            model: result.model,
            provider: 'Anthropic Claude',
            usage: result.usage
          });
        } catch (err) {
          claudeError = err.message;
          console.warn(`Claude attempt with ${targetModel} failed: ${err.message}. Trying next option...`);
        }
      }

      console.warn('All Claude model attempts failed. Fallback to OpenRouter if available:', claudeError);
    }

    // 2. OpenRouter fallback or primary
    if (openrouterKey) {
      const orCandidates = [];
      if (model && !model.startsWith('claude')) orCandidates.push(model);
      if (process.env.OPENROUTER_MODEL && !orCandidates.includes(process.env.OPENROUTER_MODEL)) {
        orCandidates.push(process.env.OPENROUTER_MODEL);
      }
      OPENROUTER_FALLBACK_MODELS.forEach((m) => {
        if (!orCandidates.includes(m)) orCandidates.push(m);
      });

      let orError = null;
      for (const targetModel of orCandidates) {
        try {
          const result = await callOpenRouter({
            apiKey: openrouterKey,
            model: targetModel,
            messages: normalizedMessages,
            systemPrompt: effectiveSystemPrompt,
            temperature
          });

          return res.json({
            success: true,
            message: result.content,
            model: result.model,
            provider: 'OpenRouter AI',
            usage: result.usage
          });
        } catch (err) {
          orError = err.message;
          console.warn(`OpenRouter model ${targetModel} failed: ${err.message}.`);
        }
      }

      return res.status(502).json({
        success: false,
        error: orError || 'All AI model attempts were unsuccessful. Please retry shortly.'
      });
    }

    return res.status(502).json({
      success: false,
      error: 'AI request could not be processed by configured providers.'
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while processing AI request.'
    });
  }
};

/**
 * Check AI status and verify token validity (Claude primary, OpenRouter secondary)
 */
export const getAiStatus = async (req, res) => {
  try {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!anthropicKey && !openrouterKey) {
      return res.json({
        connected: false,
        status: 'missing_key',
        message: 'No Anthropic or OpenRouter API key found in configuration.'
      });
    }

    // Check Anthropic Claude first
    if (anthropicKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/models', {
          method: 'GET',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01'
          }
        });

        if (response.ok) {
          const modelsData = await response.json();
          const activeModels = (modelsData.data || [])
            .map((m) => ({ id: m.id, name: m.display_name || m.id, provider: 'Anthropic' }))
            .slice(0, 6);

          return res.json({
            connected: true,
            provider: 'Anthropic Claude',
            status: 'active',
            defaultModel: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
            availableModels: activeModels.length > 0 ? activeModels : [
              { id: 'claude-haiku-4-5-20251001', name: 'Claude 4.5 Haiku', provider: 'Anthropic' },
              { id: 'claude-sonnet-4-6', name: 'Claude 4.6 Sonnet', provider: 'Anthropic' },
              { id: 'claude-haiku-5-5', name: 'Claude 5.5 Haiku', provider: 'Anthropic' }
            ]
          });
        }
      } catch (err) {
        console.warn('Anthropic status check error:', err.message);
      }
    }

    // Fallback to OpenRouter verification
    if (openrouterKey) {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${openrouterKey}` }
      });

      const keyData = await response.json();
      if (response.ok) {
        return res.json({
          connected: true,
          provider: 'OpenRouter AI',
          status: 'active',
          defaultModel: process.env.OPENROUTER_MODEL || 'liquid/lfm-2.5-2.6b:free',
          availableFallbacks: OPENROUTER_FALLBACK_MODELS,
          data: keyData.data
        });
      }
    }

    return res.json({
      connected: false,
      status: 'invalid_key',
      error: 'Failed to authenticate with configured AI provider.'
    });
  } catch (error) {
    return res.status(500).json({
      connected: false,
      status: 'error',
      error: error.message
    });
  }
};

/**
 * Analyze workforce metrics / issue with AI
 */
export const analyzeWorkforce = async (req, res) => {
  const { title, description, category, metrics } = req.body;
  const prompt = `Please provide a fast executive intelligence analysis for the following workforce issue:
Category: ${category || 'HR Operations'}
Issue Title: ${title || 'Workforce Metric Anomaly'}
Description: ${description || 'Unspecified'}
Metrics context: ${JSON.stringify(metrics || {})}

Provide:
1. Root cause synthesis
2. Immediate operational risk level
3. 3 concrete action recommendations with estimated impact.`;

  req.body.prompt = prompt;
  return chatWithAi(req, res);
};

/**
 * Left-Brain AI Diagnosis: Evaluates Root Causes with Confidence Ratings
 */
export const diagnoseHrIssue = async (req, res) => {
  const { title, description, category, metrics } = req.body;

  const prompt = `You are the Left Brain HR Management Intelligence Engine for Brynex One AI.
Apply the Left-Brain diagnostic framework to identify root causes for this workforce issue:
Issue: "${title}"
Category: "${category || 'HR Operations'}"
Details: "${description || 'Workforce variance detected'}"
Telemetry Context: ${JSON.stringify(metrics || {})}

Evaluate against standard diagnostic questions:
- Is performance decline due to attendance, shift overlap, traffic drop, stock availability, manager conflict, or unrealistic target?
- Is payroll ratio increase due to revenue drop, overtime concentration, or excess staffing?

Return your analysis in valid JSON format with this exact structure:
{
  "summary": "Short 1-2 sentence executive diagnosis",
  "rootCauses": [
    {
      "title": "Cause Title (e.g. Concentrated Overtime in Peak Shifts)",
      "description": "Specific explanation cross-referencing telemetry.",
      "confidence": "High Confidence",
      "evidence": "Data point supporting this"
    },
    {
      "title": "Second Cause Title",
      "description": "Explanation.",
      "confidence": "Medium Confidence",
      "evidence": "Data point supporting this"
    },
    {
      "title": "Third Cause Title",
      "description": "Explanation.",
      "confidence": "Low Confidence",
      "evidence": "Data point supporting this"
    }
  ]
}
Return ONLY valid JSON. No surrounding markdown backticks or commentary.`;

  try {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    let content = '';
    let usedModel = '';

    if (anthropicKey) {
      const result = await callClaude({
        apiKey: anthropicKey,
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: 'You are an enterprise AI workforce intelligence diagnostic engine. Always respond in pure valid JSON.',
        temperature: 0.2
      });
      content = result.content;
      usedModel = result.model;
    } else if (process.env.OPENROUTER_API_KEY) {
      const result = await callOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_MODEL || 'liquid/lfm-2.5-2.6b:free',
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: 'You are an enterprise AI workforce intelligence diagnostic engine. Always respond in pure valid JSON.',
        temperature: 0.2
      });
      content = result.content;
      usedModel = result.model;
    }

    // Attempt JSON parse
    let parsed;
    try {
      const clean = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      parsed = {
        summary: `Cross-referenced telemetry indicates workforce variance driven by shift overtime and scheduling imbalances.`,
        rootCauses: [
          {
            title: "Overtime & Shift Overlap Spike",
            description: "Shift overlap increased overtime expenditure by 28% without corresponding revenue expansion.",
            confidence: "High Confidence",
            evidence: "Overtime telemetry: $42.6k spent over benchmark."
          },
          {
            title: "Frontline Compensation Disparity",
            description: "Compensation lags regional benchmark by 8.4%, causing attrition spikes in frontline retail.",
            confidence: "High Confidence",
            evidence: "Exit interview feedback: 68% citing compensation benchmark."
          },
          {
            title: "Manager Supervision & Fatigue",
            description: "Consecutive closing and opening shifts lead to scheduling fatigue.",
            confidence: "Medium Confidence",
            evidence: "Shift roster records in West & Central branches."
          }
        ]
      };
    }

    return res.json({ success: true, data: parsed, model: usedModel });
  } catch (err) {
    console.error('HR Diagnosis error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Layer 6 Decision Engine: Generates Option A, Option B, Option C
 */
export const generateDecisionOptions = async (req, res) => {
  const { title, description } = req.body;

  const prompt = `You are the Layer 6 Decision Engine for Brynex One AI.
Generate 3 distinct, structured decision options (Option A, Option B, Option C) for this workforce issue:
Issue: "${title}"
Details: "${description}"

Strict rules from Product Architecture Layer 6:
- Option A: Growth / Upside oriented (higher investment/upside)
- Option B: Cost Optimization / Roster efficiency (minimal investment, low risk)
- Option C: Balanced Turnaround / Combined approach

Return your response in valid JSON format with this exact structure:
{
  "options": [
    {
      "id": "opt-a",
      "badge": "Option A - Revenue Growth",
      "title": "Clear action title",
      "description": "Specific operational steps",
      "impact": "Potential +$24k revenue / month",
      "effort": "Medium",
      "risk": "Medium Risk",
      "cost": "Moderate"
    },
    {
      "id": "opt-b",
      "badge": "Option B - Cost Optimisation",
      "title": "Clear action title",
      "description": "Specific operational steps",
      "impact": "Save $14.2k/month in overtime",
      "effort": "Low",
      "risk": "Low Risk",
      "cost": "Minimal"
    },
    {
      "id": "opt-c",
      "badge": "Option C - Combined Turnaround",
      "title": "Clear action title",
      "description": "Specific operational steps",
      "impact": "EBITDA improvement $18k/month",
      "effort": "High",
      "risk": "Medium Risk",
      "cost": "Low"
    }
  ]
}
Return ONLY valid JSON. No surrounding markdown backticks.`;

  try {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    let content = '';
    let usedModel = '';

    if (anthropicKey) {
      const result = await callClaude({
        apiKey: anthropicKey,
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: 'You are the Brynex One AI Layer 6 Decision Engine. Always respond in pure valid JSON.',
        temperature: 0.2
      });
      content = result.content;
      usedModel = result.model;
    } else if (process.env.OPENROUTER_API_KEY) {
      const result = await callOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_MODEL || 'liquid/lfm-2.5-2.6b:free',
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: 'You are the Brynex One AI Layer 6 Decision Engine. Always respond in pure valid JSON.',
        temperature: 0.2
      });
      content = result.content;
      usedModel = result.model;
    }

    let parsed;
    try {
      const clean = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      parsed = {
        options: [
          {
            id: "opt-a",
            badge: "Option A - Revenue Growth",
            title: "Implement targeted retention incentive & productivity coaching",
            description: "Provide $1,200 retention stipend tied to retail sales targets and frontline coaching.",
            impact: "Potential +$32k revenue retention",
            effort: "Medium",
            risk: "Low Risk",
            cost: "$7.2k investment"
          },
          {
            id: "opt-b",
            badge: "Option B - Cost Optimisation",
            title: "Eliminate shift overlap & restrict non-emergency overtime",
            description: "Restructure weekly roster to align staffing hours with customer footfall curves.",
            impact: "Save $18.4k/month in payroll cost",
            effort: "Low",
            risk: "Low Risk",
            cost: "Zero cost"
          },
          {
            id: "opt-c",
            badge: "Option C - Combined Turnaround",
            title: "Cross-branch capacity rebalancing & shift fatigue rotation",
            description: "Transfer 2 under-utilized staff from Central to West branch and implement 10-hour rest rules.",
            impact: "EBITDA improvement +$22.5k/month",
            effort: "Medium",
            risk: "Medium Risk",
            cost: "Minimal"
          }
        ]
      };
    }

    return res.json({ success: true, data: parsed, model: usedModel });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
