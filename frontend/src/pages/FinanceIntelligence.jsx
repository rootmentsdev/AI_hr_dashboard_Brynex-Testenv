import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, DollarSign, ArrowUpRight, TrendingDown, AlertCircle, PieChart, ShieldCheck } from 'lucide-react';

export default function FinanceIntelligence() {
  const [finData, setFinData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const res = await fetch('/api/finance');
        const json = await res.json();
        if (json.data) {
          setFinData(json.data);
        }
      } catch (err) {
        console.warn('Could not load finance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, []);

  if (!loading && !finData) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="page-header" style={{ marginBottom: '4px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
            Finance Intelligence Engine
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Cash flow tracking, payroll-to-revenue ratio, and enterprise budget optimization.
          </p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '60px 40px', textAlign: 'center' }}>
          <Wallet size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
            No Financial Telemetry Ingested
          </h3>
          <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '480px', margin: '0 auto 18px auto', lineHeight: 1.5 }}>
            Upload your payroll, employee salary, or business revenue CSV files in Data Management. The engine will calculate your payroll-to-revenue ratio and cost centers dynamically.
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

  const revenue = finData?.totalMonthlyRevenue ? (finData.totalMonthlyRevenue >= 1000000 ? `$${(finData.totalMonthlyRevenue / 1000000).toFixed(2)}M` : `$${Math.round(finData.totalMonthlyRevenue).toLocaleString()}`) : 'N/A';
  const payroll = finData?.payrollExpenditure ? (finData.payrollExpenditure >= 1000000 ? `$${(finData.payrollExpenditure / 1000000).toFixed(2)}M` : `$${Math.round(finData.payrollExpenditure).toLocaleString()}`) : 'N/A';
  const payrollRatio = finData?.payrollRatio || 'N/A';
  const targetRatio = finData?.targetRatio || '12.0%';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '4px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
          Finance Intelligence Engine
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
          Cash flow tracking, payroll-to-revenue ratio, and enterprise budget optimization.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Gross Monthly Revenue</span>
            <div style={{ background: '#ecfdf5', color: '#10b981', padding: '6px', borderRadius: '8px' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {revenue}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
            <ArrowUpRight size={14} />
            <span>Ingested Sales Telemetry</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Monthly Payroll Expenditure</span>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px', borderRadius: '8px' }}>
              <Wallet size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {payroll}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
            <span>Total salaries & compensation</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Payroll-to-Revenue Ratio</span>
            <div style={{ background: '#fffbeb', color: '#f59e0b', padding: '6px', borderRadius: '8px' }}>
              <PieChart size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {payrollRatio}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
            <span>Target benchmark: {targetRatio}</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Operating Efficiency</span>
            <div style={{ background: '#fdf2f8', color: '#ec4899', padding: '6px', borderRadius: '8px' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            Active
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#0ca678', fontWeight: 600 }}>
            <span>Telemetry verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
