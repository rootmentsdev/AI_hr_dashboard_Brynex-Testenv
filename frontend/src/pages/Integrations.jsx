import React from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  Database,
  Building,
  Users,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function Integrations() {
  const integrationsList = [
    {
      id: 'openrouter',
      name: 'OpenRouter AI Engine',
      category: 'AI / LLM Gateway',
      status: 'Connected',
      desc: 'Multi-model reasoning infrastructure routing inference to Liquid LFM 2.5, Google Gemma, and Nemotron.',
      active: true,
      highlight: true
    },
    {
      id: 'hrms',
      name: 'Workforce HRMS Core',
      category: 'Human Resources',
      status: 'Connected',
      desc: 'Employee rosters, tenure dates, attrition metrics, and org charts synchronized.',
      active: true,
      highlight: false
    },
    {
      id: 'finance',
      name: 'Enterprise Finance & Payroll',
      category: 'Finance & Compensation',
      status: 'Connected',
      desc: 'Shift overtime costs, departmental wage budgets, and compensation benchmark telemetry.',
      active: true,
      highlight: false
    },
    {
      id: 'crm',
      name: 'Salesforce & Retail POS',
      category: 'Revenue & Sales',
      status: 'Connected',
      desc: 'Branch retail performance and sales productivity pipelines.',
      active: true,
      highlight: false
    },
    {
      id: 'slack',
      name: 'Slack / Teams Alerts',
      category: 'Communication',
      status: 'Ready to sync',
      desc: 'Instant notifications when critical workforce retention anomalies are detected.',
      active: false,
      highlight: false
    },
    {
      id: 'bamboohr',
      name: 'BambooHR / Workday',
      category: 'HR Management',
      status: 'Ready to sync',
      desc: 'Performance review ratings and exit interview notes sync.',
      active: false,
      highlight: false
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#1e293b' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#0f172a', fontSize: '24px', fontWeight: 600 }}>System Integrations & AI Pipelines</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Real-time telemetry pipelines feeding AI Business Brain and OpenRouter reasoning models.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {integrationsList.map((item) => (
          <div
            key={item.id}
            style={{
              background: '#ffffff',
              border: item.highlight ? '1.5px solid #0ca678' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: item.highlight ? '0 4px 14px rgba(12, 166, 120, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: item.highlight ? '#e6fcf5' : '#f8fafc',
                      color: item.highlight ? '#0ca678' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {item.id === 'openrouter' ? <BrainCircuit size={20} /> : <Database size={18} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      {item.name}
                    </h3>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{item.category}</span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: item.active ? '#e6fcf5' : '#f1f5f9',
                    color: item.active ? '#0ca678' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {item.active && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0ca678' }}></span>}
                  {item.status}
                </span>
              </div>

              <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                {item.desc}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              {item.highlight ? (
                <Link
                  to="/assistant"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0ca678',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Launch AI Assistant</span>
                  <ArrowRight size={13} />
                </Link>
              ) : (
                <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Telemetry: 100% synced</span>
              )}

              {item.highlight && (
                <Link
                  to="/settings"
                  style={{
                    fontSize: '11.5px',
                    color: '#64748b',
                    textDecoration: 'underline'
                  }}
                >
                  Configure Token
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
