import { getCachedEnterpriseAnalytics, getCachedSyncedEmployees } from './hrController.js';

export const getDashboardSummary = (req, res) => {
  const analytics = getCachedEnterpriseAnalytics();
  const employees = getCachedSyncedEmployees();

  if (!analytics && employees.length === 0) {
    return res.json({
      status: 'success',
      data: {
        healthScore: null,
        healthStatus: 'Awaiting Telemetry (No Data Ingested)',
        activeEngines: [],
        headcount: 0,
        grossRevenue: '$0',
        payrollRatio: '0%',
        pendingTasks: 0,
        lastUpdated: new Date().toISOString()
      }
    });
  }

  const salesRev = analytics?.sales?.formattedRevenue || '$0';
  const payrollRatio = analytics?.finance?.payrollRatio || '0%';
  const headcount = employees.length;
  const healthScore = analytics?.healthScore || 85;

  res.json({
    status: 'success',
    data: {
      healthScore,
      healthStatus: healthScore >= 80 ? 'Optimal (Synchronized)' : 'Needs Attention',
      activeEngines: [
        { name: 'HR Intelligence', status: 'Active', metric: `${headcount} Staff Synced` },
        { name: 'Sales Intelligence', status: analytics?.sales ? 'Active' : 'Awaiting Data', metric: `${salesRev} Revenue` },
        { name: 'Finance Intelligence', status: analytics?.finance ? 'Active' : 'Awaiting Data', metric: `${payrollRatio} Payroll Ratio` },
        { name: 'Operations Intelligence', status: analytics?.operations ? 'Active' : 'Awaiting Data', metric: `${analytics?.operations?.totalOvertimeHours || 0} OT Hours` }
      ],
      headcount,
      grossRevenue: salesRev,
      payrollRatio,
      pendingTasks: 0,
      lastUpdated: new Date().toISOString()
    }
  });
};

export const getHealthCheck = (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
};
