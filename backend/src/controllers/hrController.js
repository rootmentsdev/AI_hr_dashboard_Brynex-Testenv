import path from 'path';
import fs from 'fs';
import { parseUploadedFile } from '../services/fileParserService.js';
import { analyzeMultiFileHrData, identifyFileScope } from '../services/multiFileCorrelatorService.js';
import { runClaudeDocumentAnalysis } from '../services/aiDocumentAnalyzerService.js';

// In-memory stores (strictly populated by actual file uploads)
let uploadedFilesStore = [];
let latestAnalysis = null;
let allSyncedEmployees = [];
let cachedSyncedEmployees = [];
let cachedEnterpriseAnalytics = null;
let activeAdminPrompt = '';
let activeCustomRules = null;
let isAiAnalyzingGlobal = false;

const REGISTRY_PATH = path.join(process.cwd(), 'uploads', 'files_registry.json');

const persistFilesRegistry = () => {
  try {
    const dataToSave = {
      files: uploadedFilesStore.map((f) => ({
        id: f.id,
        name: f.name,
        savedFilename: f.savedFilename,
        holds: f.holds,
        period: f.period,
        status: f.status,
        uploadedAt: f.uploadedAt
      })),
      activeAdminPrompt,
      activeCustomRules
    };
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist file registry:', err.message);
  }
};

/**
 * Filter employees list based on prompt keywords and custom rules
 */
export const filterEmployeesByPrompt = (employees = [], prompt = '', customRules = null) => {
  if (!employees || employees.length === 0) return [];
  let filtered = [...employees];

  // 1. Department filter from customRules
  if (customRules?.targetDepartment && customRules.targetDepartment !== 'All') {
    const dTarget = customRules.targetDepartment.toLowerCase();
    filtered = filtered.filter((e) => (e.dept || '').toLowerCase().includes(dTarget));
  }

  // 2. Keyword/phrase filter from prompt
  const p = (prompt || '').trim().toLowerCase();
  if (p && !p.includes('no prompt') && !p.includes('all data') && !p.includes('show all')) {
    // Check specific conditions: overtime
    if (p.includes('overtime') || p.includes(' ot ')) {
      const otMatch = filtered.filter((e) => {
        const val = parseFloat(String(e.ot).replace(/[^0-9.]/g, '')) || 0;
        return val > 0;
      });
      if (otMatch.length > 0) return otMatch;
    }

    // Check specific conditions: notice / resignation / exit
    if (p.includes('notice') || p.includes('resigned') || p.includes('exit') || p.includes('attrition')) {
      const exitMatch = filtered.filter((e) => {
        const r = (e.risk || '').toLowerCase();
        return r.includes('critical') || r.includes('high') || r.includes('notice') || r.includes('exit');
      });
      if (exitMatch.length > 0) return exitMatch;
    }

    // Strip filler phrases to isolate core target (e.g. "only show FASHION CONSULTANT data" -> "fashion consultant")
    const cleaned = p
      .replace(/\bonly show\b/gi, '')
      .replace(/\bshow\b/gi, '')
      .replace(/\bfocus on\b/gi, '')
      .replace(/\bfilter by\b/gi, '')
      .replace(/\bdata\b/gi, '')
      .replace(/\bemployees?\b/gi, '')
      .replace(/\bstaff\b/gi, '')
      .replace(/\bprofiles?\b/gi, '')
      .replace(/\bplease\b/gi, '')
      .replace(/\ball\b/gi, '')
      .trim();

    if (cleaned.length > 0) {
      // Direct substring match on role, dept, branch, name, or id
      const exactMatch = filtered.filter((e) => {
        const role = (e.role || '').toLowerCase();
        const dept = (e.dept || '').toLowerCase();
        const branch = (e.branch || '').toLowerCase();
        const name = (e.name || '').toLowerCase();
        const id = (e.id || '').toLowerCase();
        return (
          role.includes(cleaned) ||
          dept.includes(cleaned) ||
          branch.includes(cleaned) ||
          name.includes(cleaned) ||
          id.includes(cleaned)
        );
      });

      if (exactMatch.length > 0) {
        return exactMatch;
      }

      // Word-by-word token matching for multi-word queries
      const tokens = cleaned.split(/\s+/).filter((t) => t.length > 2);
      if (tokens.length > 0) {
        const tokenMatch = filtered.filter((e) => {
          const hay = `${e.role} ${e.dept} ${e.branch} ${e.name} ${e.id}`.toLowerCase();
          return tokens.some((t) => hay.includes(t));
        });
        if (tokenMatch.length > 0) {
          return tokenMatch;
        }
      }
    }
  }

  return filtered;
};

/**
 * Recompute employee profiles and enterprise analytics dynamically from uploaded files
 */
const recomputeAnalytics = async (prompt = activeAdminPrompt, rules = activeCustomRules) => {
  activeAdminPrompt = prompt || '';
  activeCustomRules = rules || null;

  if (uploadedFilesStore.length === 0) {
    latestAnalysis = null;
    allSyncedEmployees = [];
    cachedSyncedEmployees = [];
    cachedEnterpriseAnalytics = null;
    return;
  }

  const empFile = uploadedFilesStore.find((f) => 
    f.name.toLowerCase().includes('employee') || 
    f.name.toLowerCase().includes('staff') ||
    f.holds?.includes('People')
  );

  const attFile = uploadedFilesStore.find((f) => 
    f.name.toLowerCase().includes('attend') || 
    f.name.toLowerCase().includes('roster') || 
    f.name.toLowerCase().includes('shift') ||
    f.holds?.includes('Attendance')
  );

  const salesFile = uploadedFilesStore.find((f) => 
    f.name.toLowerCase().includes('sale') || 
    f.name.toLowerCase().includes('revenue') || 
    f.name.toLowerCase().includes('business') ||
    f.holds?.includes('Revenue')
  );

  // 1. Correlate Employees with Attendance if available
  if (empFile) {
    const attMap = {};
    if (attFile && attFile.parsedRows) {
      attFile.parsedRows.forEach((r) => {
        const id = r.employee_id || r.id || r.emp_id;
        if (!id) return;
        if (!attMap[id]) {
          attMap[id] = { totalHours: 0, otHours: 0, records: 0, restIntervals: [] };
        }
        const ot = parseFloat(r.overtime_hours || r.ot) || 0;
        const prod = parseFloat(r.actual_productive_hours || r.hours) || 0;
        const rest = parseFloat(r.rest_interval_hours || r.rest) || 0;
        attMap[id].otHours += ot;
        attMap[id].totalHours += prod;
        attMap[id].records += 1;
        if (rest > 0) attMap[id].restIntervals.push(rest);
      });
    }

    allSyncedEmployees = (empFile.parsedRows || []).map((e) => {
      const id = e.employee_id || e.id || e.emp_id || 'EMP';
      const stat = attMap[id] || { otHours: 0, totalHours: 0, records: 0, restIntervals: [] };
      const avgRest = stat.restIntervals.length ? (stat.restIntervals.reduce((a, b) => a + b, 0) / stat.restIntervals.length) : 12;
      const baseSal = parseFloat(e.base_salary_monthly || e.salary || e.pay) || 0;
      const hourlyRate = baseSal > 0 ? (baseSal / 160) : 0;
      const otCost = Math.round(stat.otHours * hourlyRate * 1.5);
      const attPct = stat.records > 0 ? Math.min(100, Math.round((stat.records / 30) * 100)) : 100;

      let risk = 'Low (Stable)';
      const statusLower = (e.status || '').toLowerCase();
      if (statusLower.includes('notice') || statusLower.includes('exit') || statusLower.includes('resigned')) {
        risk = 'Critical (Exiting / Notice)';
      } else if (stat.otHours > 15 && avgRest < 10) {
        risk = 'High (Scheduling Fatigue)';
      } else if (attPct < 85) {
        risk = 'Medium (Attendance Variance)';
      }

      return {
        id,
        name: e.full_name || e.name || 'Unnamed Employee',
        role: (e.role_id || e.role || e.designation || 'Staff').replace('ROLE-', '').replace(/-/g, ' '),
        branch: e.branch || e.location || 'HQ',
        dept: e.department || e.dept || 'Operations',
        salary: baseSal > 0 ? `$${baseSal.toLocaleString()}` : 'N/A',
        ot: stat.otHours > 0 ? `${stat.otHours.toFixed(1)} hrs ($${otCost.toLocaleString()})` : '0 hrs',
        att: `${attPct}%`,
        risk
      };
    });

    // Apply prompt & rule filtering to cached synced employees
    cachedSyncedEmployees = filterEmployeesByPrompt(allSyncedEmployees, activeAdminPrompt, activeCustomRules);
  } else {
    allSyncedEmployees = [];
    cachedSyncedEmployees = [];
  }

  // 2. Correlate Business Sales
  if (salesFile && salesFile.parsedRows) {
    let totalRev = 0;
    let totalTx = 0;
    let totalFootfall = 0;
    let totalComplaints = 0;
    const branchRev = {};
    const branchTx = {};

    salesFile.parsedRows.forEach((r) => {
      const rev = parseFloat(r.daily_revenue || r.revenue || r.amount) || 0;
      const tx = parseInt(r.transactions_count || r.transactions) || 0;
      const ff = parseInt(r.footfall_or_leads || r.footfall || r.leads) || 0;
      const comp = parseInt(r.customer_complaints_count || r.complaints) || 0;
      const b = r.branch || 'Main Branch';

      totalRev += rev;
      totalTx += tx;
      totalFootfall += ff;
      totalComplaints += comp;
      branchRev[b] = (branchRev[b] || 0) + rev;
      branchTx[b] = (branchTx[b] || 0) + tx;
    });

    const activeEmpList = cachedSyncedEmployees.length > 0 ? cachedSyncedEmployees : allSyncedEmployees;
    const totalPayroll = activeEmpList.reduce((sum, e) => {
      const num = parseFloat(String(e.salary).replace(/[$,]/g, '')) || 0;
      return sum + num;
    }, 0);

    const payrollRatio = totalRev > 0 && totalPayroll > 0 ? ((totalPayroll / totalRev) * 100).toFixed(1) : null;
    const sortedBranches = Object.entries(branchRev).sort((a, b) => b[1] - a[1]);

    cachedEnterpriseAnalytics = {
      sales: {
        totalRevenue: Math.round(totalRev),
        formattedRevenue: totalRev >= 1000000 ? `$${(totalRev / 1000000).toFixed(2)}M` : `$${Math.round(totalRev).toLocaleString()}`,
        totalTransactions: totalTx,
        conversionRate: totalFootfall > 0 ? ((totalTx / totalFootfall) * 100).toFixed(1) + '%' : null,
        branchBreakdown: branchRev,
        topBranch: sortedBranches[0]?.[0] || 'Main'
      },
      finance: {
        totalMonthlyPayroll: totalPayroll,
        formattedPayroll: totalPayroll >= 1000000 ? `$${(totalPayroll / 1000000).toFixed(2)}M` : `$${Math.round(totalPayroll).toLocaleString()}`,
        grossRevenue: Math.round(totalRev),
        payrollRatio: payrollRatio ? `${payrollRatio}%` : 'N/A',
        targetPayrollRatio: '12.0%'
      },
      operations: {
        activeHeadcount: cachedSyncedEmployees.length,
        totalHeadcount: allSyncedEmployees.length,
        totalOvertimeHours: attFile ? (attFile.parsedRows || []).reduce((sum, r) => sum + (parseFloat(r.overtime_hours || r.ot) || 0), 0).toFixed(1) : '0'
      },
      marketing: {
        totalFootfallAndLeads: totalFootfall,
        closedTransactions: totalTx,
        customerConversionPct: totalFootfall > 0 ? ((totalTx / totalFootfall) * 100).toFixed(1) + '%' : null,
        customerComplaints: totalComplaints
      }
    };
  } else {
    cachedEnterpriseAnalytics = null;
  }
};

const hydrateFilesFromDisk = async () => {
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.files)) {
        activeAdminPrompt = parsed.activeAdminPrompt || '';
        activeCustomRules = parsed.activeCustomRules || null;

        const restored = [];
        for (const meta of parsed.files) {
          const filePath = path.join(process.cwd(), 'uploads', meta.savedFilename);
          if (fs.existsSync(filePath)) {
            const parsedRows = await parseUploadedFile(filePath, meta.name);
            restored.push({
              ...meta,
              downloadUrl: `/api/hr/files/${meta.savedFilename}/download`,
              rows: parsedRows.length,
              parsedRows
            });
          }
        }

        if (restored.length > 0) {
          uploadedFilesStore = restored;
          await recomputeAnalytics(activeAdminPrompt, activeCustomRules);
          latestAnalysis = await analyzeMultiFileHrData({
            files: uploadedFilesStore,
            customRules: activeCustomRules,
            adminPrompt: activeAdminPrompt
          });
          console.log(`[Hydration] Successfully hydrated ${restored.length} connected files and computed initial analysis.`);
        }
      }
    }
  } catch (err) {
    console.warn('Failed to hydrate files from disk:', err.message);
  }
};

hydrateFilesFromDisk();

export const uploadHrFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
    }

    const { filename, originalname, path: filePath } = req.file;
    const adminPrompt = req.body.adminPrompt || '';
    let customRules = null;
    if (req.body.customRules) {
      try {
        customRules = typeof req.body.customRules === 'string' ? JSON.parse(req.body.customRules) : req.body.customRules;
      } catch (err) {
        console.warn('Invalid custom rules format, falling back to default:', err.message);
      }
    }

    activeAdminPrompt = adminPrompt;
    activeCustomRules = customRules;

    // 1. Parse file content into tabular rows
    const parsedRows = await parseUploadedFile(filePath, originalname);

    // 2. Identify file scope
    const detectedHolds = identifyFileScope(originalname, parsedRows);

    // 3. Save to uploaded records store
    const newFileRecord = {
      id: `f_${Date.now()}`,
      name: originalname,
      savedFilename: filename,
      downloadUrl: `/api/hr/files/${filename}/download`,
      holds: detectedHolds,
      rows: parsedRows.length,
      period: 'Current Upload',
      status: 'All rows valid',
      uploadedAt: new Date().toISOString(),
      parsedRows
    };

    uploadedFilesStore.unshift(newFileRecord);
    persistFilesRegistry();

    // 4. Recompute cross-correlated analytics with prompt and rules
    await recomputeAnalytics(activeAdminPrompt, activeCustomRules);

    // 5. Compute instant mathematical correlation analysis so latestAnalysis is ready immediately (<10ms)
    latestAnalysis = await analyzeMultiFileHrData({
      files: uploadedFilesStore,
      customRules: activeCustomRules,
      adminPrompt: activeAdminPrompt
    });

    isAiAnalyzingGlobal = true;

    // 6. Return response to the frontend IMMEDIATELY so the upload modal closes in <100ms!
    res.json({
      status: 'success',
      message: `File "${originalname}" connected successfully across ${uploadedFilesStore.length} datasets. Claude AI intelligence synthesis running in background.`,
      file: newFileRecord,
      analysis: latestAnalysis,
      isAiAnalyzing: true,
      activePrompt: activeAdminPrompt,
      employeesCount: cachedSyncedEmployees.length,
      totalEmployeesCount: allSyncedEmployees.length
    });

    // 7. Perform deep Claude AI synthesis in the background
    runClaudeDocumentAnalysis({
      files: uploadedFilesStore,
      customRules: activeCustomRules,
      adminPrompt: activeAdminPrompt
    }).then((dynamicAnalysis) => {
      if (dynamicAnalysis && dynamicAnalysis.attentionItems) {
        latestAnalysis = dynamicAnalysis;
      }
    }).catch((aiErr) => {
      console.warn('Claude dynamic analysis background fallback:', aiErr.message);
    }).finally(() => {
      isAiAnalyzingGlobal = false;
    });

    return;
  } catch (error) {
    console.error('File upload & analysis error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Error processing file.'
    });
  }
};

export const getUploadedFiles = (req, res) => {
  res.json({
    status: 'success',
    files: uploadedFilesStore.map((f) => ({
      id: f.id,
      name: f.name,
      holds: f.holds,
      rows: f.rows,
      period: f.period,
      status: f.status,
      savedFilename: f.savedFilename,
      downloadUrl: f.savedFilename ? `/api/hr/files/${f.savedFilename}/download` : null,
      uploadedAt: f.uploadedAt,
      columns: f.parsedRows && f.parsedRows.length > 0 ? Object.keys(f.parsedRows[0]) : [],
      data: f.parsedRows || []
    }))
  });
};

export const getFilePreview = (req, res) => {
  const { id } = req.params;
  const file = uploadedFilesStore.find((f) => f.id === id || f.savedFilename === id);
  if (!file) {
    return res.status(404).json({ status: 'error', message: 'File not found.' });
  }

  res.json({
    status: 'success',
    file: {
      id: file.id,
      name: file.name,
      holds: file.holds,
      rowsCount: file.rows,
      columns: file.parsedRows.length > 0 ? Object.keys(file.parsedRows[0]) : [],
      data: file.parsedRows,
      downloadUrl: file.savedFilename ? `/api/hr/files/${file.savedFilename}/download` : null
    }
  });
};

export const downloadRawFile = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads', filename);

  if (fs.existsSync(filePath)) {
    return res.download(filePath);
  }

  const file = uploadedFilesStore.find((f) => f.savedFilename === filename || f.name === filename);
  if (file && file.parsedRows && file.parsedRows.length > 0) {
    const keys = Object.keys(file.parsedRows[0]);
    const csvContent = [
      keys.join(','),
      ...file.parsedRows.map((r) => keys.map((k) => `"${r[k] || ''}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${file.name || 'export.csv'}"`);
    return res.send(csvContent);
  }

  return res.status(404).json({ status: 'error', message: 'File does not exist on server.' });
};

export const deleteHrFile = async (req, res) => {
  try {
    const { id } = req.params;
    const fileIndex = uploadedFilesStore.findIndex((f) => f.id === id || f.savedFilename === id);
    if (fileIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'File not found.' });
    }

    const removedFile = uploadedFilesStore[fileIndex];

    if (removedFile.savedFilename) {
      const filePath = path.join(process.cwd(), 'uploads', removedFile.savedFilename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.warn('Could not remove file from disk:', err.message);
        }
      }
    }

    uploadedFilesStore.splice(fileIndex, 1);
    persistFilesRegistry();

    if (uploadedFilesStore.length > 0) {
      await recomputeAnalytics(activeAdminPrompt, activeCustomRules);
      // Immediately purge deleted file data from latestAnalysis using mathematical correlator
      latestAnalysis = await analyzeMultiFileHrData({
        files: uploadedFilesStore,
        customRules: activeCustomRules,
        adminPrompt: activeAdminPrompt
      });

      isAiAnalyzingGlobal = true;

      // Send immediate response so frontend UI updates instantaneously (<50ms)
      res.json({
        status: 'success',
        message: `File "${removedFile.name}" deleted successfully.`,
        remainingFilesCount: uploadedFilesStore.length,
        analysis: latestAnalysis,
        isAiAnalyzing: true
      });

      // Run deep Claude AI synthesis in the background to refine analysis without blocking UI
      runClaudeDocumentAnalysis({
        files: uploadedFilesStore,
        customRules: activeCustomRules,
        adminPrompt: activeAdminPrompt
      }).then((aiResult) => {
        if (aiResult && aiResult.attentionItems) {
          latestAnalysis = aiResult;
        }
      }).catch((aiErr) => {
        console.warn('Claude dynamic analysis background update on delete:', aiErr.message);
      }).finally(() => {
        isAiAnalyzingGlobal = false;
      });
      return;
    } else {
      isAiAnalyzingGlobal = false;
      latestAnalysis = null;
      allSyncedEmployees = [];
      cachedSyncedEmployees = [];
      cachedEnterpriseAnalytics = null;

      return res.json({
        status: 'success',
        message: `File "${removedFile.name}" deleted successfully. All datasets cleared.`,
        remainingFilesCount: 0,
        analysis: null
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getLatestHrAnalysis = (req, res) => {
  res.json({
    status: 'success',
    data: latestAnalysis,
    isAiAnalyzing: isAiAnalyzingGlobal,
    activePrompt: activeAdminPrompt,
    customRules: activeCustomRules,
    employeesCount: cachedSyncedEmployees.length,
    totalEmployeesCount: allSyncedEmployees.length
  });
};

export const runCustomAiAnalysis = async (req, res) => {
  try {
    const { adminPrompt = '', customRules = null } = req.body;
    activeAdminPrompt = adminPrompt;
    activeCustomRules = customRules;

    if (uploadedFilesStore.length === 0) {
      return res.json({
        status: 'success',
        data: null,
        message: 'No uploaded datasets available to analyze.'
      });
    }

    await recomputeAnalytics(activeAdminPrompt, activeCustomRules);

    latestAnalysis = await analyzeMultiFileHrData({
      files: uploadedFilesStore,
      customRules: activeCustomRules,
      adminPrompt: activeAdminPrompt
    });

    isAiAnalyzingGlobal = true;

    res.json({
      status: 'success',
      data: latestAnalysis,
      isAiAnalyzing: true,
      activePrompt: activeAdminPrompt,
      customRules: activeCustomRules,
      employeesCount: cachedSyncedEmployees.length,
      totalEmployeesCount: allSyncedEmployees.length
    });

    runClaudeDocumentAnalysis({
      files: uploadedFilesStore,
      customRules: activeCustomRules,
      adminPrompt: activeAdminPrompt
    }).then((dynamicAnalysis) => {
      if (dynamicAnalysis && dynamicAnalysis.attentionItems) {
        latestAnalysis = dynamicAnalysis;
      }
    }).catch((aiErr) => {
      console.warn('Claude dynamic analysis fallback to mathematical correlator:', aiErr.message);
    }).finally(() => {
      isAiAnalyzingGlobal = false;
    });

    return;
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getSyncedEmployees = (req, res) => {
  const { all, prompt } = req.query;
  const p = prompt !== undefined ? prompt : activeAdminPrompt;
  const list = all === 'true'
    ? allSyncedEmployees
    : filterEmployeesByPrompt(allSyncedEmployees, p, activeCustomRules);

  res.json({
    status: 'success',
    count: list.length,
    totalCount: allSyncedEmployees.length,
    activePrompt: activeAdminPrompt,
    customRules: activeCustomRules,
    data: list,
    allEmployees: allSyncedEmployees
  });
};

export const getEnterpriseAnalytics = (req, res) => {
  res.json({
    status: 'success',
    data: cachedEnterpriseAnalytics
  });
};

export const getCachedEnterpriseAnalytics = () => cachedEnterpriseAnalytics;
export const getCachedSyncedEmployees = () => cachedSyncedEmployees;
export const getAllSyncedEmployees = () => allSyncedEmployees;
export const getCachedLatestAnalysis = () => latestAnalysis;
export const getUploadedFilesStore = () => uploadedFilesStore;
export const getActiveAdminPrompt = () => activeAdminPrompt;
export const getActiveCustomRules = () => activeCustomRules;
