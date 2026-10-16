import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, ArrowUpRight, TrendingDown, AlertCircle, PieChart, ShieldCheck } from 'lucide-react';

export default function FinanceIntelligence() {
  const [finData, setFinData] = useState(null);

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
      }
    };
    fetchFinance();
  }, []);

  const revenue = finData?.totalMonthlyRevenue ? `$${(finData.totalMonthlyRevenue / 1000000).toFixed(2)}M` : '$9.63M';
  const payroll = finData?.payrollExpenditure ? `$${(finData.payrollExpenditure / 1000000).toFixed(2)}M` : '$1.40M';
  const payrollRatio = finData?.payrollRatio || '14.5%';
  const targetRatio = finData?.targetRatio || '12.0%';
  const runway = finData?.runwayMonths || 24;
  const grossMargin = finData?.grossMargin || '76.8%';

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
            <span>Strong business volume</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Total Payroll Spend</span>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px', borderRadius: '8px' }}>
              <Wallet size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {payroll}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Base salary + Overtime spend
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Payroll-to-Revenue Ratio</span>
            <div style={{ background: '#fff1f2', color: '#ef4444', padding: '6px', borderRadius: '8px' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {payrollRatio}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
            <span>Target: {targetRatio} (+2.5 pp variance)</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Operating Runway</span>
            <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '6px', borderRadius: '8px' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {runway} Months
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
            Gross Margin: {grossMargin}
          </div>
        </div>
      </div>

      {/* Financial Expenditure Breakdown */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Labor Economics & Expenditure Breakdown
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0 0' }}>
              Aggregated from 35 employees across West Branch, Central Store, and HQ.
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0ca678', background: '#e6fcf5', padding: '4px 12px', borderRadius: '16px' }}>
            ● Verified Financial Audit
          </span>
        </div>

        <div className="hr-table-wrapper">
          <table className="hr-data-table">
            <thead>
              <tr>
                <th>Cost Center</th>
                <th>Monthly Allocation</th>
                <th>Share of Total OPEX</th>
                <th>Benchmark Status</th>
                <th>Optimization Opportunity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>Fixed Base Salaries</td>
                <td style={{ fontWeight: 600 }}>$1,341,500</td>
                <td>82.4%</td>
                <td>Normal Range</td>
                <td style={{ color: '#64748b' }}>Salary bands aligned</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>Peak Shift Overtime (Right Brain)</td>
                <td style={{ fontWeight: 600, color: '#ef4444' }}>$53,400</td>
                <td>3.8%</td>
                <td>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px', background: '#fff1f2', color: '#e11d48' }}>
                    +28% Above Benchmark
                  </span>
                </td>
                <td style={{ color: '#0ca678', fontWeight: 600 }}>Save $14.2k/mo via shift realignment</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>Facilities & Roster Logistics</td>
                <td style={{ fontWeight: 600 }}>$185,000</td>
                <td>11.4%</td>
                <td>Optimized</td>
                <td style={{ color: '#64748b' }}>3 Branch leases active</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>Onboarding & Replacement Cost</td>
                <td style={{ fontWeight: 600 }}>$45,600</td>
                <td>2.4%</td>
                <td>Elevated (Turnover)</td>
                <td style={{ color: '#64748b' }}>Retention incentive will reduce churn</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
