/**
 * Pure Dynamic AI Document Analyzer Service:
 * Ingests any uploaded file(s) (CSV, Excel, etc.), summarizes the real telemetry,
 * and calls Anthropic Claude AI to dynamically synthesize Management Attention items,
 * evidence, Left-Brain root causes, decision options, and remedies.
 * Zero hardcoded text, zero mock datasets.
 */

// Helper to extract a statistical profile and representative rows from tabular data
export const extractDatasetTelemetry = (files = []) => {
  if (!files || files.length === 0) return null;

  return files.map((file) => {
    const rows = file.parsedRows || [];
    const totalRows = rows.length;
    if (totalRows === 0) {
      return {
        fileName: file.name,
        totalRows: 0,
        columns: [],
        summary: 'Empty dataset'
      };
    }

    const columns = Object.keys(rows[0] || {});
    const numericStats = {};
    const categoricalCounts = {};

    // Analyze first 200 rows for fast statistical distribution
    const sampleLimit = Math.min(rows.length, 250);
    for (let i = 0; i < sampleLimit; i++) {
      const row = rows[i];
      for (const col of columns) {
        const val = row[col];
        const num = parseFloat(val);
        if (!isNaN(num) && typeof val !== 'boolean') {
          if (!numericStats[col]) {
            numericStats[col] = { count: 0, sum: 0, min: num, max: num };
          }
          numericStats[col].count += 1;
          numericStats[col].sum += num;
          if (num < numericStats[col].min) numericStats[col].min = num;
          if (num > numericStats[col].max) numericStats[col].max = num;
        } else if (val && typeof val === 'string' && val.length < 35) {
          if (!categoricalCounts[col]) categoricalCounts[col] = {};
          categoricalCounts[col][val] = (categoricalCounts[col][val] || 0) + 1;
        }
      }
    }

    // Compute averages
    const numericSummary = {};
    for (const [col, stat] of Object.entries(numericStats)) {
      if (stat.count > 0) {
        numericSummary[col] = {
          average: (stat.sum / stat.count).toFixed(2),
          min: stat.min,
          max: stat.max,
          total: stat.sum.toFixed(1)
        };
      }
    }

    // Top categorical values
    const categoricalSummary = {};
    for (const [col, counts] of Object.entries(categoricalCounts)) {
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (sorted.length > 0 && sorted.length < 15) {
        categoricalSummary[col] = sorted.map(([k, v]) => `${k} (${v})`).join(', ');
      }
    }

    // Select representative rows: first 5 rows + outlier rows
    const sampleRows = rows.slice(0, 6);
    
    // Look for potential outliers (e.g. exit notices, overtime, low rest, high spend)
    const anomalyRows = [];
    rows.forEach((r) => {
      const str = JSON.stringify(r).toLowerCase();
      if (
        str.includes('exit') ||
        str.includes('resigned') ||
        str.includes('notice') ||
        (r.rest_interval_hours && parseFloat(r.rest_interval_hours) < 10) ||
        (r.overtime_hours && parseFloat(r.overtime_hours) > 2)
      ) {
        if (anomalyRows.length < 8 && !sampleRows.includes(r)) {
          anomalyRows.push(r);
        }
      }
    });

    return {
      fileName: file.name,
      totalRows,
      columns,
      numericSummary,
      categoricalSummary,
      sampleRows,
      anomalyRows
    };
  });
};

/**
 * Call Anthropic Claude API to perform live executive analysis on the uploaded data
 */
export const runClaudeDocumentAnalysis = async ({ files, adminPrompt = '', customRules = null }) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured in backend environment.');
  }

  const telemetry = extractDatasetTelemetry(files);
  if (!telemetry || telemetry.length === 0) {
    return null;
  }

  // Also extract prompt-matching rows across files if a prompt is given
  let matchingRecordsSample = [];
  if (adminPrompt && adminPrompt.trim()) {
    const pClean = adminPrompt.toLowerCase()
      .replace(/only show|show|focus on|filter by|data|employees?|staff|please|all/gi, '')
      .trim();
    if (pClean.length > 2) {
      files.forEach(f => {
        (f.parsedRows || []).forEach(r => {
          const str = JSON.stringify(r).toLowerCase();
          if (str.includes(pClean) && matchingRecordsSample.length < 25) {
            matchingRecordsSample.push(r);
          }
        });
      });
    }
  }

  const totalHeadcountOrRows = files.reduce((sum, f) => sum + (f.parsedRows?.length || 0), 0);

  const prompt = `You are the Chief AI Workforce & Management Intelligence Brain for Brynex One AI.
You are analyzing actual uploaded enterprise datasets to support executive management decisions.

DATASET TELEMETRY EXTRACTED FROM UPLOADED FILES:
${JSON.stringify(telemetry, null, 2)}

${matchingRecordsSample.length > 0 ? `SPECIFIC RECORDS MATCHING USER FOCUS PROMPT:
${JSON.stringify(matchingRecordsSample, null, 2)}
` : ''}

USER CUSTOM INSTRUCTIONS / PROMPT:
${adminPrompt ? `"${adminPrompt}"` : 'Analyze the dataset comprehensively across workforce availability, shifts, retention, productivity, and organizational risks.'}

${adminPrompt && adminPrompt.trim() ? `CRITICAL PROMPT FOCUS DIRECTIVE:
The user has provided a custom instruction / prompt: "${adminPrompt}".
- You MUST tailor your ENTIRE analysis, attention items, issues, root causes, evidence, and recommendations strictly to align with this prompt.
- If the prompt specifies a role (e.g. "FASHION CONSULTANT"), department, branch, or criteria, only evaluate records matching that instruction.
- The "kpiMetrics" (especially "monitored", "issues", "productivity") and "attentionSummary" must directly reflect this target group.
- Citing specific names, roles, branches, salaries, and metrics from the actual records matching this prompt is mandatory.
` : ''}

CUSTOM BENCHMARKS / RULES:
- Target Attrition: ${(customRules && customRules.targetAttrition) || 5.0}%
- Target Productivity: ${(customRules && customRules.targetProductivity) || 90}%
- Department Scope: ${(customRules && customRules.targetDepartment) || 'All'}

TASK:
1. Examine the actual row data, columns, numeric values, anomalies, and records from the files above.
2. Identify between 2 and 3 distinct, high-impact Management Attention items that require executive attention (strictly adhering to any user prompt provided).
3. Keep descriptions concise and impactful (1-2 sentences). For each issue, provide concrete evidence records using actual values/names/IDs from the dataset, Left-Brain diagnostic root causes with confidence ratings, and strategic countermeasures (Option A Recommended, Option B).
4. Compute an overall composite HR Health Score (0 to 100) based strictly on the findings in the data.

OUTPUT REQUIREMENT:
Respond ONLY with a single valid, parseable JSON object matching this exact schema (no markdown formatting, no commentary before or after the JSON):
{
  "healthScore": 82,
  "healthStatus": "Healthy",
  "reportingPeriod": "Date range detected from data (e.g. 01-30 Sep 2026)",
  "attentionSummary": "1-2 sentence high-level executive summary of key management signals found in the files",
  "kpiMetrics": [
    { "id": "issues", "title": "Issues Detected", "value": "2", "trend": "Active risks detected", "trendPositive": false, "colorClass": "hr-kpi-icon-purple" },
    { "id": "decisions", "title": "Awaited Decisions", "value": "2", "trend": "Requires executive review", "trendPositive": true, "colorClass": "hr-kpi-icon-red" },
    { "id": "monitored", "title": "Records Monitored", "value": "${totalHeadcountOrRows}", "trend": "Live telemetry parsed", "trendPositive": true, "colorClass": "hr-kpi-icon-green" },
    { "id": "opportunities", "title": "Opportunities", "value": "1", "trend": "Optimization levers", "trendPositive": true, "colorClass": "hr-kpi-icon-orange" },
    { "id": "productivity", "title": "Avg. Productivity", "value": "88%", "trend": "+2% vs target", "trendPositive": true, "colorClass": "hr-kpi-icon-blue" }
  ],
  "attentionItems": [
    {
      "id": "issue-1",
      "category": "Critical",
      "priority": "High Priority",
      "status": "Needs investigation",
      "title": "Concise issue headline from data",
      "description": "Executive description referencing actual numbers from the file",
      "branch": "Branch from file or All Branches",
      "department": "Department affected or Operations",
      "topic": "Employee Retention & Attrition",
      "dateRange": "Period from data",
      "confidence": "91%",
      "whatsHappening": "Detailed explanation of what the telemetry in this file reveals",
      "metrics": [
        { "label": "Metric 1", "val": "Value 1", "note": "Note 1", "hasDownArrow": false },
        { "label": "Metric 2", "val": "Value 2", "note": "Note 2", "hasDownArrow": true },
        { "label": "Metric 3", "val": "Value 3", "note": "Note 3", "hasDownArrow": false },
        { "label": "Metric 4", "val": "Value 4", "note": "Note 4", "hasDownArrow": false }
      ],
      "evidence": [
        { "title": "Evidence Title", "desc": "Specific data record or pattern found", "record": "Record pill" },
        { "title": "Evidence Title 2", "desc": "Specific data record or pattern found", "record": "Record pill" }
      ],
      "possibleCauses": [
        {
          "title": "Cause Headline",
          "description": "Left-brain explanation of why this occurred based on data correlation",
          "confidence": "High Confidence (88%)",
          "evidence": "Concrete evidence string"
        }
      ],
      "decisionOptions": [
        {
          "id": "opt-1-1",
          "badge": "Option A (Recommended)",
          "title": "Remedy title",
          "description": "Actionable countermeasure description",
          "impact": "Quantifiable expected outcome"
        },
        {
          "id": "opt-1-2",
          "badge": "Option B",
          "title": "Alternative remedy title",
          "description": "Actionable countermeasure description",
          "impact": "Quantifiable expected outcome"
        }
      ]
    }
  ]
}`;

  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    })
  });

  const rawJson = await response.json();
  if (!response.ok) {
    throw new Error(rawJson.error?.message || `Claude API error: ${response.status}`);
  }

  const rawText = rawJson.content?.[0]?.text || '';
  
  // Extract JSON payload safely
  let cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleanJsonText.indexOf('{');
  const lastBrace = cleanJsonText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanJsonText = cleanJsonText.substring(firstBrace, lastBrace + 1);
  }

  const parsedAnalysis = JSON.parse(cleanJsonText);

  parsedAnalysis.analyzedAt = new Date().toISOString();
  parsedAnalysis.totalRecords = totalHeadcountOrRows;
  parsedAnalysis.fileNames = files.map((f) => f.name);
  parsedAnalysis.connectedFilesCount = files.length;
  parsedAnalysis.adminPromptApplied = adminPrompt || 'Autonomous Analysis';

  return parsedAnalysis;
};
