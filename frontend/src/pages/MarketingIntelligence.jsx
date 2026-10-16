import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Users,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  Target,
  BarChart2,
  AlertCircle,
  Building,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export default function MarketingIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketing = async () => {
      try {
        const res = await fetch('/api/marketing');
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.warn('Could not load marketing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketing();
  }, []);

  if (!loading && !data) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="page-header" style={{ marginBottom: '4px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
            Marketing Intelligence Engine
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Footfall attribution, lead-to-deal conversion telemetry, and customer satisfaction metrics.
          </p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '60px 40px', textAlign: 'center' }}>
          <Target size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
            No Marketing Telemetry Ingested
          </h3>
          <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '480px', margin: '0 auto 18px auto', lineHeight: 1.5 }}>
            Upload your leads, footfall traffic, or retail POS output CSV file in Data Management to monitor deal conversion rates and customer satisfaction.
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

  const totalFootfall = data?.totalFootfallLeads || 0;
  const conversions = data?.conversions || 0;
  const conversionRate = data?.conversionRate || 'N/A';
  const complaints = data?.customerComplaints || 0;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '4px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
          Marketing Intelligence Engine
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
          Footfall attribution, lead-to-deal conversion telemetry, and customer satisfaction metrics.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Footfall & Inquiries</span>
            <div style={{ background: '#ecfdf5', color: '#10b981', padding: '6px', borderRadius: '8px' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {totalFootfall.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Total visitor volume
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Closed Conversions</span>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px', borderRadius: '8px' }}>
              <ShoppingBag size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {conversions.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Completed transactions
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Conversion Ratio</span>
            <div style={{ background: '#fffbeb', color: '#f59e0b', padding: '6px', borderRadius: '8px' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {conversionRate}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Deal conversion rate
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Customer Complaints</span>
            <div style={{ background: '#fff1f2', color: '#ef4444', padding: '6px', borderRadius: '8px' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {complaints}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Logged issue reports
          </div>
        </div>
      </div>
    </div>
  );
}
