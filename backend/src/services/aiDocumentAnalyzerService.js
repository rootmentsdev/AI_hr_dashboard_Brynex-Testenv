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
    
    // Look for potential outliers (e.g. exit notices, overtime, low rest, high spend, zero revenue, zero footfall)
    const anomalyRows = [];
    rows.forEach((r) => {
      const str = JSON.stringify(r).toLowerCase();
      const dailyRev = r.daily_revenue !== undefined ? parseFloat(r.daily_revenue) : (r.revenue !== undefined ? parseFloat(r.revenue) : null);
      const footfall = r.footfall_or_leads !== undefined ? parseFloat(r.footfall_or_leads) : (r.footfall !== undefined ? parseFloat(r.footfall) : null);

      if (
        str.includes('exit') ||
        str.includes('resigned') ||
        str.includes('notice') ||
        (r.rest_interval_hours && parseFloat(r.rest_interval_hours) < 10) ||
        (r.overtime_hours && parseFloat(r.overtime_hours) > 2) ||
        dailyRev === 0 ||
        footfall === 0
      ) {
        if (anomalyRows.length < 8 && !sampleRows.includes(r)) {
          anomalyRows.push(r);
        }
      }
    });

    return {
      fileName: file.name,
      fileScope: file.holds || 'Dataset',
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
  const filesListStr = files.map((f, i) => `Dataset ${i + 1}: "${f.name}" (${f.holds || 'Connected Dataset'}) - ${f.parsedRows?.length || 0} rows`).join('\n');
  const minIssues = files.length > 1 ? Math.max(3, files.length * 2) : 2;
  const maxIssues = files.length > 1 ? Math.min(6, files.length * 3) : 3;

  const multiDatasetDirective = files.length > 1 ? `
CRITICAL MULTI-DATASET COVERAGE DIRECTIVE (MANDATORY):
There are ${files.length} distinct datasets currently connected:
${filesListStr}

The executive user requires that ALL connected datasets be analyzed simultaneously in the HR Intelligence Dashboard:
- You MUST analyze and generate attention items covering EVERY connected dataset:
  * For File 1 ("${files[0].name}"): Generate at least 1-2 distinct attention items with evidence from its actual rows/columns.
  * For File 2 ("${files[1].name}"): Generate at least 1-2 distinct attention items with evidence from its actual rows/columns.
  ${files.length > 2 ? `* For remaining connected files: Generate dedicated attention items for each file.` : ''}
- Also include a cross-dataset correlation issue linking the datasets together (e.g. how shift scheduling, attendance, or rest fatigue in one file directly impacts store sales revenue or transaction bottlenecks in the other).
- TOTAL ATTENTION ITEMS: Generate between ${minIssues} and ${maxIssues} items total.
- Under NO circumstances should you only analyze one file and omit the other. Every single uploaded file MUST have clear representation in the generated attention items.
- In each attention item's "description", explicitly cite which dataset the signal came from (e.g., "From sales telemetry in ${files[0].name}..." or "From shift roster records in ${files[1].name}...").
` : `
Analyze the connected dataset "${files[0]?.name}" and generate between 2 and 3 distinct, high-impact Management Attention items based on its real data.
`;

  const prompt = `You are the Chief AI Workforce & Management Intelligence Brain for Brynex One AI.
You are analyzing actual uploaded enterprise datasets to support executive management decisions.

CONNECTED DATASETS (${files.length} active files):
${filesListStr}

DATASET TELEMETRY EXTRACTED FROM UPLOADED FILES:
${JSON.stringify(telemetry, null, 2)}

${matchingRecordsSample.length > 0 ? `SPECIFIC RECORDS MATCHING USER FOCUS PROMPT:
${JSON.stringify(matchingRecordsSample, null, 2)}
` : ''}

USER CUSTOM INSTRUCTIONS / PROMPT:
${adminPrompt ? `"${adminPrompt}"` : 'Analyze the datasets comprehensively across workforce availability, shifts, retention, sales productivity, and operational risks.'}

${adminPrompt && adminPrompt.trim() ? `CRITICAL PROMPT FOCUS DIRECTIVE:
The user has provided a custom instruction / prompt: "${adminPrompt}".
- You MUST tailor your ENTIRE analysis, attention items, issues, root causes, evidence, and recommendations strictly to align with this prompt.
- If the prompt specifies a role (e.g. "FASHION CONSULTANT"), department, branch, or criteria, evaluate records matching that instruction.
- The "kpiMetrics" (especially "monitored", "issues", "productivity") and "attentionSummary" must directly reflect this target group.
- Citing specific names, roles, branches, salaries, and metrics from the actual records matching this prompt is mandatory.
` : ''}

CUSTOM BENCHMARKS / RULES:
- Target Attrition: ${(customRules && customRules.targetAttrition) || 5.0}%
- Target Productivity: ${(customRules && customRules.targetProductivity) || 90}%
- Department Scope: ${(customRules && customRules.targetDepartment) || 'All'}

TASK:
1. Examine the actual row data, columns, numeric values, anomalies, and records from ALL uploaded datasets:
${filesListStr}

2. Follow the multi-dataset coverage directive:
${multiDatasetDirective}

3. Keep all fields strictly concise and compact (1-2 sentences per description, 1-2 evidence records, 1 possibleCause, and 2 concise decisionOptions per issue). Never generate run-on essays.
4. Compute an overall composite HR Health Score (0 to 100) based strictly on the findings in the data.

OUTPUT REQUIREMENT:
Respond ONLY with a single valid, parseable JSON object matching this exact schema (no markdown formatting, no commentary before or after the JSON):
{
  "healthScore": 82,
  "healthStatus": "Healthy",
  "reportingPeriod": "Date range detected from data (e.g. 01-30 Sep 2026)",
  "attentionSummary": "1-2 sentence high-level executive summary of key management signals found across ALL connected files",
  "kpiMetrics": [
    { "id": "issues", "title": "Issues Detected", "value": "${minIssues}", "trend": "Active risks detected", "trendPositive": false, "colorClass": "hr-kpi-icon-purple" },
    { "id": "decisions", "title": "Awaited Decisions", "value": "${minIssues}", "trend": "Requires executive review", "trendPositive": true, "colorClass": "hr-kpi-icon-red" },
    { "id": "monitored", "title": "Records Monitored", "value": "${totalHeadcountOrRows}", "trend": "Live telemetry parsed across ${files.length} datasets", "trendPositive": true, "colorClass": "hr-kpi-icon-green" },
    { "id": "opportunities", "title": "Opportunities", "value": "2", "trend": "Optimization levers", "trendPositive": true, "colorClass": "hr-kpi-icon-orange" },
    { "id": "productivity", "title": "Avg. Productivity", "value": "88%", "trend": "+2% vs target", "trendPositive": true, "colorClass": "hr-kpi-icon-blue" }
  ],
  "attentionItems": [
    {
      "id": "issue-1",
      "category": "Critical",
      "priority": "High Priority",
      "status": "Needs investigation",
      "title": "Concise issue headline from data",
      "sourceFile": "${files[0].name}",
      "description": "Executive description referencing actual numbers and the specific file name",
      "branch": "Branch from file or All Branches",
      "department": "Department affected or Operations",
      "topic": "Domain topic (e.g. Store Revenue & Sales, Shift Scheduling, Employee Retention)",
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

  let parsedAnalysis = null;
  try {
    parsedAnalysis = JSON.parse(cleanJsonText);
  } catch (parseErr) {
    // Attempt auto-recovery if truncated near the end of attentionItems array
    const lastItemIdx = cleanJsonText.lastIndexOf('},\n    {');
    if (lastItemIdx !== -1) {
      try {
        const repaired = cleanJsonText.substring(0, lastItemIdx + 1) + '\n  ]\n}';
        parsedAnalysis = JSON.parse(repaired);
      } catch (_) {
        throw parseErr;
      }
    } else {
      throw parseErr;
    }
  }

  parsedAnalysis.analyzedAt = new Date().toISOString();
  parsedAnalysis.totalRecords = totalHeadcountOrRows;
  parsedAnalysis.fileNames = files.map((f) => f.name);
  parsedAnalysis.connectedFilesCount = files.length;
  parsedAnalysis.adminPromptApplied = adminPrompt || 'Autonomous Analysis';

  return parsedAnalysis;
};
