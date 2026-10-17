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
  getUploadedFilesStore
} from '../controllers/hrController.js';
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

// Cross-Engine Intelligence routes connected dynamically to ingested analytics
router.get('/sales', (req, res) => {
  const analytics = getCachedEnterpriseAnalytics();
  if (!analytics?.sales) {
    return res.json({
      module: 'Sales Intelligence',
      status: 'no_data',
      data: null,
      message: 'No sales dataset uploaded yet. Upload a sales dataset in Data Management.'
    });
  }

  const s = analytics.sales;
  const branches = Object.entries(s.branchBreakdown || {}).map(([name, rev]) => ({
    name,
    revenue: rev >= 1000000 ? `$${(rev / 1000000).toFixed(2)}M` : `$${Math.round(rev).toLocaleString()}`,
    rawRevenue: rev
  }));

  res.json({
    module: 'Sales Intelligence',
    status: 'active',
    data: {
      pipelineValue: s.totalRevenue,
      formattedPipeline: s.formattedRevenue,
      closedTransactions: s.totalTransactions,
      conversionRate: s.conversionRate || 'N/A',
      branchLeader: s.topBranch,
      branches
    }
  });
});

router.get('/finance', (req, res) => {
  const analytics = getCachedEnterpriseAnalytics();
  if (!analytics?.finance) {
    return res.json({
      module: 'Finance Intelligence',
      status: 'no_data',
      data: null,
      message: 'No payroll or financial dataset uploaded yet.'
    });
  }

  const f = analytics.finance;
  res.json({
    module: 'Finance Intelligence',
    status: 'active',
    data: {
      totalMonthlyRevenue: f.grossRevenue,
      payrollExpenditure: f.totalMonthlyPayroll,
      formattedPayroll: f.formattedPayroll,
      payrollRatio: f.payrollRatio,
      targetRatio: f.targetPayrollRatio,
      runwayMonths: f.runwayMonths || null,
      grossMargin: f.grossMargin || null
    }
  });
});

router.get('/operations', (req, res) => {
  const analytics = getCachedEnterpriseAnalytics();
  const employees = getCachedSyncedEmployees();
  if (!analytics && employees.length === 0) {
    return res.json({
      module: 'Operations Intelligence',
      status: 'no_data',
      data: null,
      message: 'No shift or operations dataset uploaded yet.'
    });
  }

  res.json({
    module: 'Operations Intelligence',
    status: 'active',
    data: {
      activeWorkforce: employees.length,
      overtimeHoursTotal: analytics?.operations?.totalOvertimeHours || '0',
      scheduleCompliance: '100%'
    }
  });
});

router.get('/marketing', (req, res) => {
  const analytics = getCachedEnterpriseAnalytics();
  if (!analytics?.marketing) {
    return res.json({
      module: 'Marketing Intelligence',
      status: 'no_data',
      data: null,
      message: 'No marketing or traffic dataset uploaded yet.'
    });
  }

  const m = analytics.marketing;
  res.json({
    module: 'Marketing Intelligence',
    status: 'active',
    data: {
      totalFootfallLeads: m.totalFootfallAndLeads,
      conversions: m.closedTransactions,
      conversionRate: m.customerConversionPct || 'N/A',
      customerComplaints: m.customerComplaints
    }
  });
});

router.get('/business-health', (req, res) => {
  const analytics = getCachedEnterpriseAnalytics();
  const employees = getCachedSyncedEmployees();

  if (!analytics && employees.length === 0) {
    return res.json({
      module: 'Business Health',
      status: 'no_data',
      data: null,
      message: 'No telemetry ingested yet. Ingest datasets to generate health scorecard.'
    });
  }

  const score = analytics?.healthScore || 85;
  res.json({
    module: 'Business Health',
    status: 'active',
    data: {
      overallScore: score,
      status: score >= 80 ? 'Optimal (Synchronized)' : 'Needs Attention',
      engineBreakdown: [
        { id: 'hr', name: 'HR Intelligence', score: 85, status: 'Active', detail: `${employees.length} employees synced` },
        { id: 'sales', name: 'Sales Intelligence', score: analytics?.sales ? 90 : 50, status: analytics?.sales ? 'Active' : 'Awaiting Data', detail: analytics?.sales ? `${analytics.sales.formattedRevenue} Revenue` : 'No sales telemetry' },
        { id: 'finance', name: 'Finance Intelligence', score: analytics?.finance ? 85 : 50, status: analytics?.finance ? 'Active' : 'Awaiting Data', detail: analytics?.finance ? `${analytics.finance.payrollRatio} Payroll Ratio` : 'No finance telemetry' }
      ]
    }
  });
});

router.get('/tasks', (req, res) => {
  res.json({ 
    module: 'AI Tasks', 
    count: 0,
    tasks: []
  });
});

router.get('/assistant', (req, res) => res.json({ module: 'AI Assistant', status: 'active' }));
router.get('/integrations', (req, res) => res.json({ module: 'Integrations', count: 0 }));

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
    status: files.length > 0 ? 'active' : 'no_data',
    reports
  });
});

router.get('/team', getSyncedEmployees);
router.get('/settings', (req, res) => res.json({ module: 'Settings', config: { theme: 'light', syncFrequency: 'Real-time', aiEngine: 'Claude' } }));

export default router;
