import React from 'react';

export default function TeamRoles() {
  return (
    <div>
      <div className="page-header">
        <h1>Team & Roles</h1>
        <p>User access controls, permissions, and collaborative team workspaces.</p>
      </div>

      <div className="placeholder-card">
        <h3>Team Access Control</h3>
        <p>Manage team members, assign granular permissions, and configure RBAC policies.</p>
        <div className="placeholder-grid">
          <div className="metric-card">
            <div className="metric-card-title">Total Members</div>
            <div className="metric-card-value">28</div>
            <span className="status-tag">Active</span>
          </div>
          <div className="metric-card">
            <div className="metric-card-title">Defined Roles</div>
            <div className="metric-card-value">5 Roles</div>
            <span className="status-tag">Configured</span>
          </div>
          <div className="metric-card">
            <div className="metric-card-title">Pending Invitations</div>
            <div className="metric-card-value">3</div>
            <span className="status-tag">Awaiting Sign-in</span>
          </div>
        </div>
      </div>
    </div>
  );
}
