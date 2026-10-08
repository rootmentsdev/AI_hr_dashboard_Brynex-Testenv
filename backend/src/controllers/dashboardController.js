export const getDashboardSummary = (req, res) => {
  res.json({
    status: 'success',
    data: {
      healthScore: 94,
      activeEngines: ['HR', 'Sales', 'Finance', 'Operations', 'Marketing'],
      pendingTasks: 12,
      lastUpdated: new Date().toISOString()
    }
  });
};

export const getHealthCheck = (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
};
