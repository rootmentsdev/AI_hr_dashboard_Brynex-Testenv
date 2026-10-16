import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  Building2,
  Calendar,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';

export default function OperationsIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOps = async () => {
      try {
        const res = await fetch('/api/operations');
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.warn('Could not load operations data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOps();
  }, []);

  if (!loading && !data) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="page-header" style={{ marginBottom: '4px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
            Operations & Shift Intelligence
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Shift roster compliance, rest interval monitoring, and operational workload distribution.
          </p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '60px 40px', textAlign: 'center' }}>
          <Clock size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
            No Operational Telemetry Ingested
          </h3>
          <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '480px', margin: '0 auto 18px auto', lineHeight: 1.5 }}>
            Upload your shift roster or attendance timesheet CSV file in Data Management to monitor overtime, rest intervals, and shift adherence.
          </p>
          <Link
            to="/intelligence/hr/data"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0ca678',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            <span>Go to Data Management</span>
          </Link>
        </div>
      </div>
    );
  }

  const activeWorkforce = data?.activeWorkforce || 0;
  const overtimeHours = data?.overtimeHoursTotal || '0';
  const compliance = data?.scheduleCompliance || '100%';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '4px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
          Operations & Shift Intelligence
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
          Shift roster compliance, rest interval monitoring, and operational workload distribution.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Active Workforce Tracked</span>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px', borderRadius: '8px' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {activeWorkforce} Staff
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Ingested employee profiles
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Overtime Logged</span>
            <div style={{ background: '#fff1f2', color: '#ef4444', padding: '6px', borderRadius: '8px' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {overtimeHours} hrs
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Total cumulative hours
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Schedule Compliance</span>
            <div style={{ background: '#ecfdf5', color: '#10b981', padding: '6px', borderRadius: '8px' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {compliance}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Roster adherence score
          </div>
        </div>
      </div>
    </div>
  );
}
