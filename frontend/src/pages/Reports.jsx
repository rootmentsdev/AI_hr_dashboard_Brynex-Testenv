import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Database,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Filter,
  FileSpreadsheet
} from 'lucide-react';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports');
        const json = await res.json();
        if (json.reports) {
          setReports(json.reports);
        }
      } catch (err) {
        console.warn('Could not load reports list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleDownload = (rep) => {
    setDownloadingId(rep.id);
    setTimeout(() => {
      setDownloadingId(null);
      // Trigger download
      if (rep.downloadUrl) {
        window.open(rep.downloadUrl, '_blank');
      } else {
        alert(`Generating export for ${rep.name}...`);
      }
    }, 600);
  };

  const defaultReports = [
    {
      id: 'rep-1',
      name: 'Executive Workforce & Payroll Synthesis (Cross-Correlated)',
      description: 'AI-synthesized strategic audit covering overtime inflation, retail compensation, and roster turnover.',
      format: 'Executive PDF',
      period: 'Sep 2026',
      size: '1.2 MB',
      downloadUrl: '/api/hr/analysis',
      badge: 'AI Synthesis'
    },
    {
      id: 'rep-2',
      name: 'Master Employee Registry (35 Staff Records)',
      description: 'Verified employee master dataset containing roles, branches, departments, and base monthly compensation.',
      format: 'CSV Export',
      period: 'Sep 2026',
      size: '4.2 KB',
      downloadUrl: '/api/hr/files/employees_master.csv/download',
      badge: 'Master Dataset'
    },
    {
      id: 'rep-3',
      name: 'Shift Attendance & Overtime Telemetry (1,050 logs)',
      description: '30-day shift log tracking clock-in/out, actual productive hours, overtime hours, and rest intervals.',
      format: 'CSV Export',
      period: '01-30 Sep 2026',
      size: '88 KB',
      downloadUrl: '/api/hr/files/attendance_and_roster.csv/download',
      badge: 'Shift Logs'
    },
    {
      id: 'rep-4',
      name: 'Business Output, Revenue & Transaction Ledger (270 logs)',
      description: 'Daily branch transactions, revenue generated, footfall, and customer complaints across 3 operating branches.',
      format: 'CSV Export',
      period: '01-30 Sep 2026',
      size: '26 KB',
      downloadUrl: '/api/hr/files/business_output_and_sales.csv/download',
      badge: 'POS Output'
    }
  ];

  const reportList = reports.length > 0 ? reports.map((r, idx) => ({ ...defaultReports[idx], ...r })) : defaultReports;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '4px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
          Reports & Data Export Center
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
          Download verified enterprise datasets, shift telemetry audits, and AI executive briefs generated on demand.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Available Datasets</span>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px', borderRadius: '8px' }}>
              <Database size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            4 Datasets
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
            <CheckCircle2 size={14} />
            <span>Ready for Instant Export</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Total Synchronized Rows</span>
            <div style={{ background: '#ecfdf5', color: '#10b981', padding: '6px', borderRadius: '8px' }}>
              <FileSpreadsheet size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            1,355 Rows
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
            <span>Across HR, POS & Shift logs</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Reporting Period</span>
            <div style={{ background: '#faf5ff', color: '#a855f7', padding: '6px', borderRadius: '8px' }}>
              <Calendar size={16} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '14px 0 4px 0' }}>
            01-30 Sep 2026
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#a855f7', fontWeight: 600 }}>
            <span>Complete Monthly Cycle</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Export Engine</span>
            <div style={{ background: '#fff7ed', color: '#f97316', padding: '6px', borderRadius: '8px' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '14px 0 4px 0' }}>
            Direct CSV / PDF
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
            <span>Zero Processing Delay</span>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
              Enterprise Datasets & Reports Catalog
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Click to download the sanitized enterprise datasets or generate custom AI synthesis reports.
            </p>
          </div>
          <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
            Verified Authenticity
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reportList.map((rep) => (
            <div
              key={rep.id}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: rep.format?.includes('PDF') ? '#fee2e2' : '#ecfdf5',
                    color: rep.format?.includes('PDF') ? '#dc2626' : '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{rep.name}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: '#e2e8f0',
                        color: '#334155'
                      }}
                    >
                      {rep.badge || 'Dataset'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {rep.description} &bull; Period: <strong>{rep.period}</strong> &bull; Size: {rep.size}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDownload(rep)}
                disabled={downloadingId === rep.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Download size={15} />
                <span>{downloadingId === rep.id ? 'Exporting...' : `Download ${rep.format?.split(' ')[0] || 'CSV'}`}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
