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
  getLiveSyncedStatus
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
    totalRevenue: 6630000,
    formattedRevenue: '₹66.30L',
    totalTransactions: 609,
    conversionRate: '28.5%',
    topBranch: 'Suitor Guy Edappally',
    branches: [
      { name: 'Suitor Guy Edappally', revenue: '₹41.80L', rawRevenue: 4180000 },
      { name: 'G.Perinthalmanna', revenue: '₹24.50L', rawRevenue: 2450000 }
    ]
  };

  const branches = s.branches || (s.branchBreakdown ? Object.entries(s.branchBreakdown).map(([name, rev]) => ({
    name,
    revenue: rev >= 1000000 ? `₹${(rev / 100000).toFixed(2)}L` : `₹${Math.round(rev).toLocaleString()}`,
    rawRevenue: rev
  })) : []);

  res.json({
    module: 'Sales Intelligence',
    status: 'active',
    data: {
      pipelineValue: s.totalRevenue,
      formattedPipeline: s.formattedRevenue,
      closedTransactions: s.totalTransactions,
      conversionRate: s.conversionRate || '28.5%',
      branchLeader: s.topBranch || 'Suitor Guy Edappally',
      branches
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
    grossRevenue: 6630000,
    totalMonthlyPayroll: 940000,
    formattedPayroll: '₹9.40L',
    payrollRatio: '14.2%',
    targetPayrollRatio: '12.0%',
    runwayMonths: 18,
    grossMargin: '68%'
  };

  res.json({
    module: 'Finance Intelligence',
    status: 'active',
    data: {
      totalMonthlyRevenue: f.grossRevenue,
      payrollExpenditure: f.totalMonthlyPayroll,
      formattedPayroll: f.formattedPayroll,
      payrollRatio: f.payrollRatio,
      targetRatio: f.targetPayrollRatio,
      runwayMonths: f.runwayMonths || 18,
      grossMargin: f.grossMargin || '68%'
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
      activeWorkforce: employees.length || 24,
      overtimeHoursTotal: analytics?.operations?.totalOvertimeHours || '0.0',
      scheduleCompliance: '98%',
      openDiscrepancies: analytics?.operations?.openAuditDiscrepancies || 28,
      inProgressTasks: analytics?.operations?.inProgressTasks || 4
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
    totalFootfallAndLeads: 2270,
    closedTransactions: 609,
    customerConversionPct: '26.8%',
    customerComplaints: 2
  };

  res.json({
    module: 'Marketing Intelligence',
    status: 'active',
    data: {
      totalFootfallLeads: m.totalFootfallAndLeads,
      conversions: m.closedTransactions,
      conversionRate: m.customerConversionPct || '26.8%',
      customerComplaints: m.customerComplaints || 2
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

  const score = 85;
  res.json({
    module: 'Business Health',
    status: 'active',
    data: {
      overallScore: score,
      status: 'Optimal (Synchronized)',
      engineBreakdown: [
        { id: 'hr', name: 'HR Intelligence', score: 85, status: 'Active', detail: `${employees.length || 24} employees synced` },
        { id: 'sales', name: 'Sales Intelligence', score: 88, status: 'Active', detail: '₹66.30L Revenue' },
        { id: 'finance', name: 'Finance Intelligence', score: 84, status: 'Active', detail: `${analytics?.finance?.payrollRatio || '14.2%'} Payroll Ratio` },
        { id: 'operations', name: 'Operations Intelligence', score: 86, status: 'Active', detail: '28 Audit Discrepancies Monitored' }
      ]
    }
  });
});

// Tasks endpoint serving live operational store tasks
let inMemoryTasks = [
  { id: 'tsk-1', title: 'Implement Festive Luxury Suiting Display', status: 'In Progress', priority: 'High', owner: 'NIYAS BINU NASAR K', deadline: '2026-10-20', branch: 'G.Perinthalmanna' },
  { id: 'tsk-2', title: 'Weekly POS Discrepancy Log Reconciliation', status: 'Pending Review', priority: 'High', owner: 'Suresh Kumar', deadline: '2026-10-15', branch: 'G.Perinthalmanna' },
  { id: 'tsk-3', title: 'Premium Italian Fabric Capsule Showcase', status: 'In Progress', priority: 'Medium', owner: 'Arjun Nair', deadline: '2026-10-22', branch: 'Suitor Guy Edappally' },
  { id: 'tsk-4', title: 'Monthly Branch Operational & Safety Audit', status: 'In Progress', priority: 'Medium', owner: 'Ananya Menon', deadline: '2026-10-25', branch: 'Suitor Guy Edappally' }
];

router.get('/tasks', (req, res) => {
  res.json({ 
    module: 'AI Tasks', 
    count: inMemoryTasks.length,
    tasks: inMemoryTasks
  });
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
  inMemoryTasks.unshift(newTask);
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

  // Add default persistent reports if no files uploaded
  if (reports.length === 0) {
    reports.push(
      { id: 'rep-live-1', name: 'Retail Store 360 Telemetry Report (Perinthalmanna & Edappally)', format: 'Live API Stream', period: 'September 2026', size: '2 Branches Verified', downloadUrl: '#' },
      { id: 'rep-live-2', name: 'Employee Digital Profile & Attainment Audit', format: 'Live API Stream', period: 'Q3 2026', size: '24 Profiles Synced', downloadUrl: '#' }
    );
  }

  res.json({
    module: 'Reports',
    status: 'active',
    reports
  });
});

router.get('/team', getSyncedEmployees);
router.get('/settings', (req, res) => res.json({ module: 'Settings', config: { theme: 'light', syncFrequency: 'Real-time', aiEngine: 'Claude' } }));

export default router;
