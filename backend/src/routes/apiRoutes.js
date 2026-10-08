import express from 'express';
import { getDashboardSummary, getHealthCheck } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/health', getHealthCheck);
router.get('/summary', getDashboardSummary);

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
