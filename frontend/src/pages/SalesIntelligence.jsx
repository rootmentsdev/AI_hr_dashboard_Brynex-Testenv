import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Store, ArrowUpRight, BarChart3, Users } from 'lucide-react';

export default function SalesIntelligence() {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await fetch('/api/sales');
        const json = await res.json();
        if (json.data) {
          setSalesData(json.data);
        }
      } catch (err) {
        console.warn('Could not load sales data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  if (!loading && !salesData) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="page-header" style={{ marginBottom: '4px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
            Sales Intelligence Engine
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Real revenue telemetry, transaction velocity, and branch performance parsed from business output records.
          </p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '60px 40px', textAlign: 'center' }}>
          <Store size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
            No Sales Telemetry Ingested
          </h3>
          <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '480px', margin: '0 auto 18px auto', lineHeight: 1.5 }}>
            Upload your sales ledger or branch output CSV file in Data Management to view live revenue, transactions, and branch breakdowns.
          </p>
          <a
            href="/data/hr"
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
          </a>
        </div>
      </div>
    );
  }

  const pipelineVal = salesData?.formattedPipeline || 'N/A';
  const closedTx = salesData?.closedTransactions || 0;
  const branchLeader = salesData?.branchLeader || 'N/A';
  const conversionRate = salesData?.conversionRate || 'N/A';
  const branches = salesData?.branches || [];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '4px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
          Sales Intelligence Engine
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
          Real revenue telemetry, transaction velocity, and branch performance parsed from business output records.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Total Gross Revenue</span>
            <div style={{ background: '#ecfdf5', color: '#10b981', padding: '6px', borderRadius: '8px' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {pipelineVal}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
            <ArrowUpRight size={14} />
            <span>Ingested Sales Dataset</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Closed Transactions</span>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px', borderRadius: '8px' }}>
              <ShoppingBag size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {closedTx.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Completed customer transactions
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Conversion Rate</span>
            <div style={{ background: '#fffbeb', color: '#f59e0b', padding: '6px', borderRadius: '8px' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {conversionRate}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Lead-to-deal conversion
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Top Branch Volume</span>
            <div style={{ background: '#fdf2f8', color: '#ec4899', padding: '6px', borderRadius: '8px' }}>
              <Store size={16} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {branchLeader}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Leading commercial hub
          </div>
        </div>
      </div>

      {/* Dynamic Branch Sales Table */}
      {branches.length > 0 && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Branch Performance & Revenue Contribution
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0ca678', background: '#e6fcf5', padding: '4px 12px', borderRadius: '16px' }}>
              ● Live Ingested Telemetry
            </span>
          </div>

          <div className="hr-table-wrapper">
            <table className="hr-data-table">
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th>Gross Revenue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{b.name}</td>
                    <td style={{ fontWeight: 600 }}>{b.revenue}</td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px', background: '#ecfdf5', color: '#16a34a' }}>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
