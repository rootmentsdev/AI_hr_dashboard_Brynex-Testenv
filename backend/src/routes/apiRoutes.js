import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDashboardSummary, getHealthCheck } from '../controllers/dashboardController.js';
import { chatWithAi, getAiStatus, analyzeWorkforce, diagnoseHrIssue, generateDecisionOptions } from '../controllers/aiController.js';
import {
  uploadHrFile,
  getUploadedFiles,
  getFilePreview,
  downloadRawFile,
  getLatestHrAnalysis,
  runCustomAiAnalysis,
  deleteHrFile,
  getSyncedEmployees,
  getEnterpriseAnalytics,
  getCachedEnterpriseAnalytics,
  getCachedSyncedEmployees,
  getUploadedFilesStore,
  recomputeAnalytics
} from '../controllers/hrController.js';
import {
  fetchStoreOverview,
  fetchEmployeeOverview,
  fetchAllStoresOverview,
  fetchAllEmployeesOverview,
  syncStoresAndEmployees,
  getLiveSyncedStatus,
  fetchStaffPerformanceReport,
  getAllStaffPerformanceRecords
} from '../services/externalIntegrationService.js';
import {
  getPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt
} from '../controllers/promptController.js';
import {
  getConversations,
  getConversationById,
  createConversation,
  saveConversationMessages,
  updateConversationTitle,
  deleteConversation
} from '../controllers/chatController.js';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// System Health & Overview
router.get('/health', getHealthCheck);
router.get('/summary', getDashboardSummary);

// AI Intelligence Routes (Claude & OpenRouter)
router.post('/ai/chat', chatWithAi);
router.get('/ai/status', getAiStatus);
router.post('/ai/analyze', analyzeWorkforce);
router.post('/ai/hr/diagnose', diagnoseHrIssue);
router.post('/ai/hr/options', generateDecisionOptions);

// HR Intelligence Ingestion & AI Analysis Routes
router.post('/hr/upload', upload.single('file'), uploadHrFile);
router.get('/hr/files', getUploadedFiles);
router.get('/hr/files/:id/preview', getFilePreview);
router.get('/hr/files/:filename/download', downloadRawFile);
router.delete('/hr/files/:id', deleteHrFile);
router.get('/hr/analysis', getLatestHrAnalysis);
router.post('/hr/analyze', runCustomAiAnalysis);
router.get('/hr/employees', getSyncedEmployees);
router.get('/analytics/enterprise', getEnterpriseAnalytics);

// Saved Prompts Routes (MongoDB Atlas)
router.get('/prompts', getPrompts);
router.post('/prompts', createPrompt);
router.put('/prompts/:id', updatePrompt);
router.delete('/prompts/:id', deletePrompt);

// AI Conversation History Routes (MongoDB Atlas - ChatGPT / Claude style)
router.get('/ai/conversations', getConversations);
router.get('/ai/conversations/:id', getConversationById);
router.post('/ai/conversations', createConversation);
router.post('/ai/conversations/:id/messages', saveConversationMessages);
router.put('/ai/conversations/:id', updateConversationTitle);
router.delete('/ai/conversations/:id', deleteConversation);

// External Retail LMS Integration APIs (Employee 360 & Store 360)
router.get('/external/employee-overview', async (req, res) => {
  try {
    const { empId, userId, email } = req.query;
    const result = await fetchEmployeeOverview({ empId, userId, email });
    res.json({
      success: true,
      source: result.source,
      data: result.data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/external/store-overview', async (req, res) => {
  try {
    const { locCode, storeName, branchId } = req.query;
    const result = await fetchStoreOverview({ locCode, storeName, branchId });
    res.json({
      success: true,
      source: result.source,
      data: result.data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/external/stores', async (req, res) => {
  try {
    const stores = await fetchAllStoresOverview();
    res.json({ success: true, count: stores.length, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Rootments Live Rental API: Staff Performance & Store Achieved Sales Report
router.get('/external/staff-performance', async (req, res) => {
  try {
    const { refresh, empCode, store } = req.query;
    const records = await fetchStaffPerformanceReport({ forceRefresh: refresh === 'true' });

    let filtered = records;
    if (empCode) {
      const q = String(empCode).trim().toLowerCase();
      filtered = filtered.filter(r => (r.empCode || '').toLowerCase().includes(q));
    }
    if (store) {
      const q = String(store).trim().toLowerCase();
      filtered = filtered.filter(r => (r.bookingBy || '').toLowerCase().includes(q));
    }

    // Compute Executive Performance Analytics
    const totalAchievedSales = records.reduce((sum, r) => sum + (Number(r.totalValue) || 0), 0);
    const totalGrossCreatedValue = records.reduce((sum, r) => sum + (Number(r.createdValue) || 0), 0);
    const totalFulfilledBills = records.reduce((sum, r) => sum + (Number(r.total_Number_Of_Bill) || 0), 0);
    const totalCanceledBills = records.reduce((sum, r) => sum + (Number(r.canceled_Number_Of_Bill) || 0), 0);
    const totalCanceledValue = records.reduce((sum, r) => sum + (Number(r.canceledValue) || 0), 0);
    const networkCancellationRate = totalGrossCreatedValue > 0
      ? ((totalCanceledValue / totalGrossCreatedValue) * 100).toFixed(1) + '%'
      : '0%';

    // Top 5 Staff Revenue Generators
    const topStaff = records
      .filter(r => r.empCode && !r.empCode.startsWith('ZR') && !r.empCode.startsWith('DS'))
      .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
      .slice(0, 5)
      .map(s => ({
        name: s.bookingBy?.trim(),
        empCode: s.empCode?.trim(),
        achievedSales: s.totalValue,
        formattedSales: s.totalValue >= 100000 ? `₹${(s.totalValue / 100000).toFixed(2)}L` : `₹${s.totalValue.toLocaleString()}`,
        billsCount: s.total_Number_Of_Bill,
        cancellationRate: s.createdValue > 0 ? ((s.canceledValue / s.createdValue) * 100).toFixed(1) + '%' : '0%'
      }));

    // Store Achieved Sales Breakdown
    const storeBreakdown = records
      .filter(r => !r.empCode || r.empCode.startsWith('ZR') || r.empCode.startsWith('DS') || r.bookingBy?.toUpperCase().includes('SG') || r.bookingBy?.toUpperCase().includes('ZORUCCI'))
      .map(st => ({
        storeName: st.bookingBy?.trim(),
        code: st.empCode,
        achievedSales: st.totalValue,
        formattedSales: st.totalValue >= 100000 ? `₹${(st.totalValue / 100000).toFixed(2)}L` : `₹${st.totalValue.toLocaleString()}`,
        fulfilledBills: st.total_Number_Of_Bill,
        canceledBills: st.canceled_Number_Of_Bill,
        cancellationRate: st.createdValue > 0 ? ((st.canceledValue / st.createdValue) * 100).toFixed(1) + '%' : '0%'
      }))
      .sort((a, b) => b.achievedSales - a.achievedSales);

    res.json({
      success: true,
      source: 'https://rentalapi.rootments.live/api/Reports/GetPerformanceStaffReportWithCancel',
      count: filtered.length,
      totalRecords: records.length,
      summary: {
        totalAchievedSales,
        formattedTotalSales: totalAchievedSales >= 10000000 ? `₹${(totalAchievedSales / 10000000).toFixed(2)} Cr` : `₹${(totalAchievedSales / 100000).toFixed(2)}L`,
        totalFulfilledBills,
        totalCanceledBills,
        totalCanceledValue,
        formattedCanceledValue: totalCanceledValue >= 10000000 ? `₹${(totalCanceledValue / 10000000).toFixed(2)} Cr` : `₹${(totalCanceledValue / 100000).toFixed(2)}L`,
        networkCancellationRate,
        topStaff,
        storeBreakdown
      },
      data: filtered
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/external/sync-stores', async (req, res) => {
  try {
    const { storeCodes } = req.body;
    if (!storeCodes) {
      return res.status(400).json({ success: false, error: 'storeCodes is required (array or string of store codes)' });
    }
    const report = await syncStoresAndEmployees(storeCodes);
    await recomputeAnalytics();
    res.json({
      success: true,
      message: `Successfully synchronized ${report.totalStoresSynced} stores and ${report.totalEmployeesSynced} employee profiles from live LMS API.`,
      report
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/external/sync-status', (req, res) => {
  res.json({ success: true, ...getLiveSyncedStatus() });
});

router.get('/external/employees', async (req, res) => {
  try {
    const employees = await fetchAllEmployeesOverview();
    res.json({ success: true, count: employees.length, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cross-Engine Intelligence routes connected dynamically to ingested analytics
router.get('/sales', async (req, res) => {
  let analytics = getCachedEnterpriseAnalytics();
  if (!analytics?.sales) {
    await recomputeAnalytics();
    analytics = getCachedEnterpriseAnalytics();
  }

  const s = analytics?.sales || {
    totalRevenue: 0,
    formattedRevenue: '₹0.00L',
    totalTransactions: 0,
    conversionRate: '0.0%',
    topBranch: 'N/A',
    branches: []
  };

  res.json({
    module: 'Sales Intelligence',
    status: 'active',
    data: {
      pipelineValue: s.totalRevenue || 0,
      formattedPipeline: s.formattedRevenue || '₹0.00L',
      closedTransactions: s.totalTransactions || 0,
      conversionRate: s.conversionRate || '0.0%',
      branchLeader: s.topBranch || 'N/A',
      branches: s.branches || []
    }
  });
});

router.get('/finance', async (req, res) => {
  let analytics = getCachedEnterpriseAnalytics();
  if (!analytics?.finance) {
    await recomputeAnalytics();
    analytics = getCachedEnterpriseAnalytics();
  }

  const f = analytics?.finance || {
    grossRevenue: 0,
    totalMonthlyPayroll: 0,
    formattedPayroll: '₹0.00L',
    payrollRatio: '0.0%',
    targetPayrollRatio: '12.0%',
    runwayMonths: null,
    grossMargin: null
  };

  res.json({
    module: 'Finance Intelligence',
    status: 'active',
    data: {
      totalMonthlyRevenue: f.grossRevenue || 0,
      payrollExpenditure: f.totalMonthlyPayroll || 0,
      formattedPayroll: f.formattedPayroll || '₹0.00L',
      payrollRatio: f.payrollRatio || '0.0%',
      targetRatio: f.targetPayrollRatio || '12.0%',
      runwayMonths: f.runwayMonths ?? null,
      grossMargin: f.grossMargin ?? null
    }
  });
});

router.get('/operations', async (req, res) => {
  let analytics = getCachedEnterpriseAnalytics();
  let employees = getCachedSyncedEmployees();
  if (!analytics || employees.length === 0) {
    await recomputeAnalytics();
    analytics = getCachedEnterpriseAnalytics();
    employees = getCachedSyncedEmployees();
  }

  res.json({
    module: 'Operations Intelligence',
    status: 'active',
    data: {
      activeWorkforce: employees.length || 0,
      overtimeHoursTotal: analytics?.operations?.totalOvertimeHours || '0.0',
      scheduleCompliance: analytics?.operations?.scheduleCompliance ?? null,
      openDiscrepancies: analytics?.operations?.openAuditDiscrepancies || 0,
      inProgressTasks: analytics?.operations?.inProgressTasks || 0
    }
  });
});

router.get('/marketing', async (req, res) => {
  let analytics = getCachedEnterpriseAnalytics();
  if (!analytics?.marketing) {
    await recomputeAnalytics();
    analytics = getCachedEnterpriseAnalytics();
  }

  const m = analytics?.marketing || {
    totalFootfallAndLeads: 0,
    closedTransactions: 0,
    customerConversionPct: '0.0%',
    customerComplaints: 0
  };

  res.json({
    module: 'Marketing Intelligence',
    status: 'active',
    data: {
      totalFootfallLeads: m.totalFootfallAndLeads || 0,
      conversions: m.closedTransactions || 0,
      conversionRate: m.customerConversionPct || '0.0%',
      customerComplaints: m.customerComplaints || 0
    }
  });
});

router.get('/business-health', async (req, res) => {
  let analytics = getCachedEnterpriseAnalytics();
  let employees = getCachedSyncedEmployees();

  if (!analytics || employees.length === 0) {
    await recomputeAnalytics();
    analytics = getCachedEnterpriseAnalytics();
    employees = getCachedSyncedEmployees();
  }

  const latestAnalysis = getCachedLatestAnalysis();
  const rawScore = parseInt(latestAnalysis?.healthScore);
  const score = isNaN(rawScore) ? (analytics?.healthScore ?? null) : rawScore;
  const status = score === null ? 'Awaiting Telemetry' : (latestAnalysis?.healthStatus || (score >= 80 ? 'Optimal (Synchronized)' : 'Needs Attention'));

  res.json({
    module: 'Business Health',
    status: 'active',
    data: {
      overallScore: score,
      status,
      engineBreakdown: [
        { id: 'hr', name: 'HR Intelligence', score: score, status: score !== null ? 'Active' : 'Awaiting Data', detail: `${employees.length} employees synced` },
        { id: 'sales', name: 'Sales Intelligence', score: analytics?.sales ? score : null, status: analytics?.sales ? 'Active' : 'Awaiting Data', detail: `${analytics?.sales?.formattedRevenue || '₹0.00L'} Revenue` },
        { id: 'finance', name: 'Finance Intelligence', score: analytics?.finance ? score : null, status: analytics?.finance ? 'Active' : 'Awaiting Data', detail: `${analytics?.finance?.payrollRatio || '0.0%'} Payroll Ratio` },
        { id: 'operations', name: 'Operations Intelligence', score: analytics?.operations ? score : null, status: analytics?.operations ? 'Active' : 'Awaiting Data', detail: `${analytics?.operations?.openAuditDiscrepancies || 0} Audit Discrepancies Monitored` }
      ]
    }
  });
});

// Tasks endpoint serving live operational store tasks from LMS + user deployed tasks
let deployedUserTasks = [];

router.get('/tasks', async (req, res) => {
  try {
    const stores = await fetchAllStoresOverview();
    const lmsTasks = [];
    stores.forEach((s) => {
      const branchName = s.summary?.workingBranch || s.branch?.workingBranch || 'Store Network';
      (s.operations?.storeTasks || []).forEach((t) => {
        lmsTasks.push({
          id: t.taskCode || t._id || `tsk-${Math.random()}`,
          title: t.description || t.title || t.adminTitle || 'Store Operational Task',
          status: t.status === 'COMPLETED' ? 'Completed' : (t.status === 'IN PROGRESS' ? 'In Progress' : (t.status || 'In Progress')),
          priority: t.priority || 'Medium',
          owner: t.assignedToLabel || t.assignedByName || 'Store Admin',
          deadline: t.endDate || t.dueDate || 'Ongoing',
          branch: t.storeName || branchName,
          category: t.category || 'Operations'
        });
      });
    });

    const combined = [...deployedUserTasks, ...lmsTasks];
    res.json({ 
      module: 'AI Tasks', 
      count: combined.length,
      tasks: combined
    });
  } catch (err) {
    res.json({ module: 'AI Tasks', count: deployedUserTasks.length, tasks: deployedUserTasks });
  }
});

router.post('/tasks', (req, res) => {
  const { title, owner, deadline, kpi, priority, branch } = req.body;
  const newTask = {
    id: `tsk-${Date.now()}`,
    title: title || 'Executive Action Plan',
    owner: owner || 'Operations Lead',
    deadline: deadline || '14 Days',
    kpi: kpi || 'Optimize Operational KPI',
    priority: priority || 'High',
    branch: branch || 'Store Network',
    status: 'In Progress',
    createdAt: new Date().toISOString()
  };
  deployedUserTasks.unshift(newTask);
  res.json({ status: 'success', task: newTask });
});

router.get('/assistant', (req, res) => res.json({ module: 'AI Assistant', status: 'active' }));
router.get('/integrations', (req, res) => res.json({ module: 'Integrations', count: 4, status: 'connected' }));

router.get('/reports', (req, res) => {
  const files = getUploadedFilesStore();
  const reports = files.map((f, idx) => ({
    id: `rep-${idx + 1}`,
    name: `${f.name} (Ingested Registry)`,
    format: 'CSV / Excel',
    period: f.period || 'Current Period',
    size: `${f.rows} records`,
    downloadUrl: f.downloadUrl || `/api/hr/files/${f.id}/preview`
  }));

  res.json({
    module: 'Reports',
    status: 'active',
    reports
  });
});

router.get('/team', getSyncedEmployees);
router.get('/settings', (req, res) => res.json({ module: 'Settings', config: { theme: 'light', syncFrequency: 'Real-time', aiEngine: 'Claude' } }));

export default router;
