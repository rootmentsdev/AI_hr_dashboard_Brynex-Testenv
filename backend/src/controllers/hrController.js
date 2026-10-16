import path from 'path';
import fs from 'fs';
import { parseUploadedFile } from '../services/fileParserService.js';
import { analyzeMultiFileHrData, identifyFileScope } from '../services/multiFileCorrelatorService.js';
import { runClaudeDocumentAnalysis } from '../services/aiDocumentAnalyzerService.js';

// Clean in-memory stores (strictly populated by actual file uploads)
let uploadedFilesStore = [];
let latestAnalysis = null;
let cachedSyncedEmployees = [];
let cachedEnterpriseAnalytics = null;

/**
 * Recompute employee profiles and enterprise analytics dynamically from uploaded files
 */
const recomputeAnalytics = async () => {
  if (uploadedFilesStore.length === 0) {
    latestAnalysis = null;
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

    cachedSyncedEmployees = (empFile.parsedRows || []).map((e) => {
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

    const totalPayroll = cachedSyncedEmployees.reduce((sum, e) => {
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
        totalOvertimeHours: attFile ? (attFile.parsedRows || []).reduce((sum, r) => sum + (parseFloat(r.overtime_hours || r.ot) || 0), 0).toFixed(1) : '0'
      },
      marketing: {
        totalFootfallAndLeads: totalFootfall,
        closedTransactions: totalTx,
        customerConversionPct: totalFootfall > 0 ? ((totalTx / totalFootfall) * 100).toFixed(1) + '%' : null,
        customerComplaints: totalComplaints
      }
    };
  }
};

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

    // 4. Recompute cross-correlated analytics
    await recomputeAnalytics();

    // 5. Perform Multi-File Correlated AI Analysis using Claude
    let dynamicAnalysis = null;
    try {
      dynamicAnalysis = await runClaudeDocumentAnalysis({
        files: uploadedFilesStore,
        customRules,
        adminPrompt
      });
    } catch (aiErr) {
      console.warn('Claude dynamic analysis fallback to mathematical correlator:', aiErr.message);
      dynamicAnalysis = await analyzeMultiFileHrData({
        files: uploadedFilesStore,
        customRules,
        adminPrompt
      });
    }

    latestAnalysis = dynamicAnalysis;

    return res.json({
      status: 'success',
      message: `File "${originalname}" analyzed dynamically by Claude AI across ${uploadedFilesStore.length} connected datasets.`,
      file: newFileRecord,
      analysis: dynamicAnalysis
    });
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
      uploadedAt: f.uploadedAt
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

    if (uploadedFilesStore.length > 0) {
      await recomputeAnalytics();
      latestAnalysis = await analyzeMultiFileHrData({
        files: uploadedFilesStore
      });
    } else {
      latestAnalysis = null;
      cachedSyncedEmployees = [];
      cachedEnterpriseAnalytics = null;
    }

    res.json({
      status: 'success',
      message: `File "${removedFile.name}" deleted successfully.`,
      remainingFilesCount: uploadedFilesStore.length,
      analysis: latestAnalysis
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getLatestHrAnalysis = (req, res) => {
  res.json({
    status: 'success',
    data: latestAnalysis
  });
};

export const runCustomAiAnalysis = async (req, res) => {
  try {
    const { adminPrompt, customRules } = req.body;

    if (uploadedFilesStore.length === 0) {
      return res.json({
        status: 'success',
        data: null,
        message: 'No uploaded datasets available to analyze.'
      });
    }

    let dynamicAnalysis = null;
    try {
      dynamicAnalysis = await runClaudeDocumentAnalysis({
        files: uploadedFilesStore,
        customRules,
        adminPrompt
      });
    } catch (aiErr) {
      console.warn('Claude dynamic analysis fallback to mathematical correlator:', aiErr.message);
      dynamicAnalysis = await analyzeMultiFileHrData({
        files: uploadedFilesStore,
        customRules,
        adminPrompt
      });
    }

    latestAnalysis = dynamicAnalysis;

    res.json({
      status: 'success',
      data: dynamicAnalysis
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getSyncedEmployees = (req, res) => {
  res.json({
    status: 'success',
    count: cachedSyncedEmployees.length,
    data: cachedSyncedEmployees
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
export const getUploadedFilesStore = () => uploadedFilesStore;
