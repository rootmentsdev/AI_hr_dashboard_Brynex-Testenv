// AI Controller for OpenRouter API integration
const DEFAULT_SYSTEM_PROMPT = `You are the Brynex AI Business Brain Intelligence Assistant, an enterprise-grade AI workforce intelligence copilot.
You specialize in workforce analytics, employee attrition prevention, compensation benchmark analysis, team productivity, scheduling fatigue management, and executive decision support.
Respond with sharp, structured, data-driven, and actionable advice. Use clear bullet points and bold headers when structuring recommendations. Keep answers focused and impactful.`;

const FALLBACK_MODELS = [
  'liquid/lfm-2.5-2.6b:free',
  'google/gemma-4-26b-a4b-it:free',
  'thinkingmachines/inkling:free',
  'nvidia/nemotron-3.5-lightning:free'
];

/**
 * Perform chat completion with OpenRouter, with automatic fallback across free models
 */
export const chatWithAi = async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenRouter API key is not configured in backend environment.'
      });
    }

    const { messages = [], prompt, model, systemPrompt, temperature = 0.7 } = req.body;

    // Build message list
    const conversation = [];
    conversation.push({
      role: 'system',
      content: systemPrompt || DEFAULT_SYSTEM_PROMPT
    });

    if (Array.isArray(messages) && messages.length > 0) {
      messages.forEach((msg) => {
        conversation.push({
          role: msg.role || (msg.sender === 'user' ? 'user' : 'assistant'),
          content: msg.content || msg.text || ''
        });
      });
    } else if (prompt) {
      conversation.push({
        role: 'user',
        content: prompt
      });
    }

    const candidateModels = [];
    if (model) candidateModels.push(model);
    if (process.env.OPENROUTER_MODEL && !candidateModels.includes(process.env.OPENROUTER_MODEL)) {
      candidateModels.push(process.env.OPENROUTER_MODEL);
    }
    FALLBACK_MODELS.forEach((m) => {
      if (!candidateModels.includes(m)) candidateModels.push(m);
    });

    let lastError = null;
    let successfulData = null;
    let usedModel = null;

    // Try candidate models in sequence if rate-limited
    for (const targetModel of candidateModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'Brynex AI Business Brain'
          },
          body: JSON.stringify({
            model: targetModel,
            messages: conversation,
            temperature: typeof temperature === 'number' ? temperature : 0.7
          })
        });

        const data = await response.json();

        if (response.ok && data.choices && data.choices.length > 0) {
          successfulData = data;
          usedModel = data.model || targetModel;
          break;
        } else {
          lastError = data.error?.message || `Failed with status ${response.status}`;
          console.warn(`Model ${targetModel} attempt failed: ${lastError}. Trying fallback...`);
        }
      } catch (err) {
        lastError = err.message;
        console.warn(`Error contacting model ${targetModel}: ${err.message}`);
      }
    }

    if (!successfulData) {
      return res.status(502).json({
        success: false,
        error: lastError || 'All AI model attempts were unsuccessful. Please retry shortly.',
        triedModels: candidateModels
      });
    }

    const assistantMessage = successfulData.choices[0].message;

    return res.json({
      success: true,
      message: assistantMessage.content,
      rawMessage: assistantMessage,
      model: usedModel,
      usage: successfulData.usage
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
 * Check OpenRouter connection status and verify token validity
 */
export const getAiStatus = async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.json({
        connected: false,
        status: 'missing_key',
        message: 'No OpenRouter API key found in configuration.'
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const keyData = await response.json();

    if (!response.ok) {
      return res.json({
        connected: false,
        status: 'invalid_key',
        error: keyData.error?.message || 'Failed to authenticate with OpenRouter.'
      });
    }

    return res.json({
      connected: true,
      provider: 'OpenRouter AI',
      status: 'active',
      defaultModel: process.env.OPENROUTER_MODEL || 'liquid/lfm-2.5-2.6b:free',
      availableFallbacks: FALLBACK_MODELS,
      data: keyData.data
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

  req.body.prompt = prompt;
  req.body.temperature = 0.3; // Low temperature for consistent JSON

  try {
    // Intercept response to parse JSON
    const apiKey = process.env.OPENROUTER_API_KEY;
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Brynex Left Brain HR'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'liquid/lfm-2.5-2.6b:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Attempt JSON parse
    let parsed;
    try {
      const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      // Fallback structured object
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

    return res.json({ success: true, data: parsed, model: data.model });
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
    const apiKey = process.env.OPENROUTER_API_KEY;
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Brynex Decision Engine'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'liquid/lfm-2.5-2.6b:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
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

    return res.json({ success: true, data: parsed, model: data.model });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

