import React from 'react';

export default function Settings() {
  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Global system preferences, API credentials, and application configuration.</p>
      </div>

      <div className="placeholder-card">
        <h3>System Preferences</h3>
        <p>Configure model temperature, API keys, webhook endpoints, and branding.</p>
        <div className="placeholder-grid">
          <div className="metric-card">
            <div className="metric-card-title">Environment</div>
            <div className="metric-card-value">Development</div>
            <span className="status-tag">v1.0.0</span>
          </div>
          <div className="metric-card">
            <div className="metric-card-title">Backend API</div>
            <div className="metric-card-value">Connected</div>
            <span className="status-tag">:5000</span>
          </div>
          <div className="metric-card">
            <div className="metric-card-title">Database</div>
            <div className="metric-card-value">MongoDB</div>
            <span className="status-tag">MERN Stack</span>
          </div>
        </div>
      </div>
    </div>
  );
}
