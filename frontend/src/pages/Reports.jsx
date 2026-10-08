import React from 'react';

export default function Reports() {
  return (
    <div>
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>Comprehensive reports, scheduled exports, and deep data analytics.</p>
      </div>

      <div className="placeholder-card">
        <h3>Reports Engine</h3>
        <p>Automated PDF, CSV, and executive summaries generated on demand.</p>
        <div className="placeholder-grid">
          <div className="metric-card">
            <div className="metric-card-title">Generated Reports</div>
            <div className="metric-card-value">34</div>
            <span className="status-tag">Archived</span>
          </div>
          <div className="metric-card">
            <div className="metric-card-title">Scheduled Dispatches</div>
            <div className="metric-card-value">6 Weekly</div>
            <span className="status-tag">Active</span>
          </div>
          <div className="metric-card">
            <div className="metric-card-title">Custom Templates</div>
            <div className="metric-card-value">12</div>
            <span className="status-tag">Configured</span>
          </div>
        </div>
      </div>
    </div>
  );
}
