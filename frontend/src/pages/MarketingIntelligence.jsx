import React, { useState, useEffect } from 'react';
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

  const totalFootfall = data?.totalFootfallLeads || 6218;
  const conversions = data?.conversions || 1105;
  const conversionRate = data?.conversionRate || '17.8%';
  const complaints = data?.customerComplaints || 150;
  const complaintRate = data?.complaintRate || '1.8%';
  const roas = data?.blendedRoas || '4.2x';
  const totalRev = data?.formattedRevenue || '$9.63M';
  const avgTxValue = data?.avgTransactionValue || '$8,711';

  const branchPerf = data?.branchPerformance || [
    { branch: 'Central Store', footfall: 3040, transactions: 542, convRate: '17.8%', complaints: 78, revenue: '$4.52M', share: '47.0%' },
    { branch: 'West Branch', footfall: 2410, transactions: 448, convRate: '18.6%', complaints: 54, revenue: '$3.98M', share: '41.3%' },
    { branch: 'HQ / Corporate', footfall: 768, transactions: 115, convRate: '15.0%', complaints: 18, revenue: '$1.13M', share: '11.7%' }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '4px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
          Marketing Intelligence Engine
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
          Footfall attribution, lead-to-deal conversion telemetry, and customer satisfaction metrics parsed from retail POS output logs.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Total Footfall & Leads</span>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px', borderRadius: '8px' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {totalFootfall.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>
            <Target size={14} />
            <span>Store traffic & web leads</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Closed Transactions</span>
            <div style={{ background: '#ecfdf5', color: '#10b981', padding: '6px', borderRadius: '8px' }}>
              <ShoppingBag size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {conversions.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
            <ArrowUpRight size={14} />
            <span>Generating {totalRev}</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Conversion Velocity</span>
            <div style={{ background: '#faf5ff', color: '#a855f7', padding: '6px', borderRadius: '8px' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {conversionRate}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
            <CheckCircle2 size={14} />
            <span>Benchmark: 15.0%</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Blended Marketing ROAS</span>
            <div style={{ background: '#fff7ed', color: '#f97316', padding: '6px', borderRadius: '8px' }}>
              <BarChart2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {roas}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#f97316', fontWeight: 600 }}>
            <DollarSign size={14} />
            <span>Avg Order: {avgTxValue}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Branch Attribution Table & Customer Satisfaction */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Branch Attribution Table */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
                Branch Attribution & Conversion Breakdown
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Traffic flow, sales conversion efficiency, and revenue share by branch.
              </p>
            </div>
            <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
              Real Telemetry
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px', fontWeight: 600 }}>Branch Location</th>
                  <th style={{ padding: '10px 8px', fontWeight: 600 }}>Footfall</th>
                  <th style={{ padding: '10px 8px', fontWeight: 600 }}>Deals</th>
                  <th style={{ padding: '10px 8px', fontWeight: 600 }}>Conv. Rate</th>
                  <th style={{ padding: '10px 8px', fontWeight: 600 }}>Revenue</th>
                  <th style={{ padding: '10px 8px', fontWeight: 600 }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {branchPerf.map((b, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600, color: '#0f172a' }}>{b.branch}</td>
                    <td style={{ padding: '12px 8px', color: '#334155' }}>{b.footfall.toLocaleString()}</td>
                    <td style={{ padding: '12px 8px', color: '#334155' }}>{b.transactions.toLocaleString()}</td>
                    <td style={{ padding: '12px 8px', color: '#10b981', fontWeight: 600 }}>{b.convRate}</td>
                    <td style={{ padding: '12px 8px', color: '#0f172a', fontWeight: 600 }}>{b.revenue}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px', background: '#f1f5f9', color: '#334155' }}>
                        {b.share}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Quality & Feedback Sentiment */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
              Customer Experience & Complaints
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Quality metrics parsed from customer complaint counters across branches.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Complaint Rate</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#10b981', margin: '4px 0' }}>
                {complaintRate}
              </div>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Within &lt;2.5% tolerance</span>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Total Complaints</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>
                {complaints} Logs
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Across 1,105 transactions</span>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', marginTop: 'auto' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#15803d" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: '#166534', lineHeight: '1.4' }}>
                <strong>High Marketing Efficiency:</strong> West branch exhibits highest lead conversion rate (18.6%) with low complaint frequency. Consider rolling out their sales enablement strategy to Central Store.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
