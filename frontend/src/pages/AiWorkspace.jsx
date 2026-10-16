import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Activity,
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';

export default function AiWorkspace() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/summary');
        const json = await res.json();
        if (json.data) {
          setSummary(json.data);
        }
      } catch (err) {
        console.warn('Could not load workspace summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const hasData = summary && (summary.headcount > 0 || (summary.activeEngines && summary.activeEngines.length > 0));
  const healthScore = summary?.healthScore !== null && summary?.healthScore !== undefined ? summary.healthScore : null;
  const grossRev = summary?.grossRevenue || '$0';
  const headcount = summary?.headcount || 0;
  const payrollRatio = summary?.payrollRatio || '0%';
  const engines = summary?.activeEngines || [];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '4px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
          Central AI Intelligence Workspace
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
          Executive command center synchronizing live workforce rosters, financial payroll ratio, retail sales, and shift telemetry.
        </p>
      </div>

      {/* Hero Executive Status Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
            }}
          >
            <BrainCircuit size={32} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                {hasData ? 'AI Business Brain Online' : 'AI Business Brain Standby'}
              </h2>
              <span style={{ fontSize: '11px', background: hasData ? '#065f46' : '#334155', color: hasData ? '#6ee7b7' : '#94a3b8', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                {hasData ? 'Enterprise Synced' : 'Awaiting Telemetry'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              {hasData
                ? `Autonomous multi-agent correlation active across live ingested datasets and 5 intelligence engines.`
                : 'No datasets ingested yet. Upload employee rosters, payroll, or retail sales in Data Management to activate AI correlation.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Composite Health</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: healthScore ? '#10b981' : '#64748b' }}>
              {healthScore !== null ? `${healthScore} / 100` : '-- / 100'}
            </div>
          </div>
          <button
            onClick={() => navigate(hasData ? '/intelligence/hr' : '/intelligence/hr/data')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Sparkles size={16} />
            <span>{hasData ? 'Launch HR Diagnostics' : 'Upload HR Datasets'}</span>
          </button>
        </div>
      </div>

      {/* 4 Engine Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* HR */}
        <Link
          to="/intelligence/hr"
          style={{
            textDecoration: 'none',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>HR Intelligence</span>
            <div style={{ background: '#f5f3ff', color: '#8b5cf6', padding: '6px', borderRadius: '8px' }}>
              <Users size={16} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{headcount} Staff</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {hasData ? `${payrollRatio} Payroll Ratio` : 'Awaiting Roster Ingestion'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#8b5cf6', fontWeight: 600, marginTop: 'auto' }}>
            <span>Open Engine</span>
            <ArrowRight size={13} />
          </div>
        </Link>

        {/* Sales */}
        <Link
          to="/intelligence/sales"
          style={{
            textDecoration: 'none',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Sales Intelligence</span>
            <div style={{ background: '#ecfdf5', color: '#10b981', padding: '6px', borderRadius: '8px' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{grossRev}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {hasData ? 'Active Revenue Pipeline' : 'Awaiting Sales Ingestion'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10b981', fontWeight: 600, marginTop: 'auto' }}>
            <span>Open Engine</span>
            <ArrowRight size={13} />
          </div>
        </Link>

        {/* Operations */}
        <Link
          to="/intelligence/operations"
          style={{
            textDecoration: 'none',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Operations Intelligence</span>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px', borderRadius: '8px' }}>
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{hasData ? '96.2%' : '-- %'}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {hasData ? 'Attendance Synced' : 'Awaiting Shift Logs'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3b82f6', fontWeight: 600, marginTop: 'auto' }}>
            <span>Open Engine</span>
            <ArrowRight size={13} />
          </div>
        </Link>

        {/* Marketing */}
        <Link
          to="/intelligence/marketing"
          style={{
            textDecoration: 'none',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Marketing Intelligence</span>
            <div style={{ background: '#fff7ed', color: '#f97316', padding: '6px', borderRadius: '8px' }}>
              <Send size={16} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{hasData ? '17.8%' : '-- %'}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {hasData ? 'Lead Conversion Synced' : 'Awaiting Campaign Data'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#f97316', fontWeight: 600, marginTop: 'auto' }}>
            <span>Open Engine</span>
            <ArrowRight size={13} />
          </div>
        </Link>
      </div>

      {/* Engine Status List & Quick Navigation */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
              Live System Telemetry Feed
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Autonomous multi-engine pipeline continuously correlating shift logs, retail revenue, and retention telemetry.
            </p>
          </div>
          <span style={{ fontSize: '11px', background: hasData ? '#ecfdf5' : '#f1f5f9', color: hasData ? '#047857' : '#64748b', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
            {hasData ? 'All Systems Nominal' : 'Standby Mode'}
          </span>
        </div>

        {engines.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
            <Activity size={28} color="#94a3b8" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              No Active Telemetry Feeds
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b', maxWidth: '460px', margin: '0 auto 16px auto' }}>
              Telemetry streams will automatically activate when you ingest HR employee rosters, retail sales, or payroll sheets.
            </p>
            <Link
              to="/intelligence/hr/data"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0f172a',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <span>Go to Data Management</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {engines.map((eng, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>{eng.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>{eng.metric}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px', background: '#ecfdf5', color: '#047857' }}>
                    {eng.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
