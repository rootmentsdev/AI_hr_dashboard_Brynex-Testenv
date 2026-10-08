import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1 style={{ fontSize: '48px', color: '#00a876', marginBottom: '16px' }}>404</h1>
      <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '12px' }}>Page Not Found</h2>
      <p style={{ color: '#9ca3af', marginBottom: '24px' }}>The requested page is not configured yet.</p>
      <Link 
        to="/workspace" 
        style={{ 
          display: 'inline-block', 
          background: '#00a876', 
          color: '#fff', 
          padding: '10px 20px', 
          borderRadius: '8px', 
          fontWeight: '600' 
        }}
      >
        Return to Workspace
      </Link>
    </div>
  );
}
