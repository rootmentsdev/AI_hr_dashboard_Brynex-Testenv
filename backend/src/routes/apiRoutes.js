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
  deleteHrFile
} from '../controllers/hrController.js';

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

// OpenRouter AI Routes
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

// Module placeholder routes
router.get('/hr', (req, res) => res.json({ module: 'HR Intelligence', status: 'ready' }));
router.get('/sales', (req, res) => res.json({ module: 'Sales Intelligence', status: 'ready' }));
router.get('/finance', (req, res) => res.json({ module: 'Finance Intelligence', status: 'ready' }));
router.get('/operations', (req, res) => res.json({ module: 'Operations Intelligence', status: 'ready' }));
router.get('/marketing', (req, res) => res.json({ module: 'Marketing Intelligence', status: 'ready' }));
router.get('/tasks', (req, res) => res.json({ module: 'AI Tasks', count: 12 }));
router.get('/assistant', (req, res) => res.json({ module: 'AI Assistant', status: 'active' }));
router.get('/integrations', (req, res) => res.json({ module: 'Integrations', count: 8 }));
router.get('/reports', (req, res) => res.json({ module: 'Reports', list: [] }));
router.get('/team', (req, res) => res.json({ module: 'Team & Roles', members: [] }));
router.get('/settings', (req, res) => res.json({ module: 'Settings', config: {} }));

export default router;
