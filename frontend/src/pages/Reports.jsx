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
      if (rep.downloadUrl) {
        window.open(rep.downloadUrl, '_blank');
      } else {
        alert(`Generating export for ${rep.name}...`);
      }
    }, 600);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#1e293b' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ color: '#0f172a', fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
            Executive Reports & Exports
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Download verified datasets, audit summaries, and executive intelligence documents.
          </p>
        </div>
      </div>

      {/* Reports Table or Empty State */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Available Documents & Ingested Exports
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {reports.length} Reports Available
          </span>
        </div>

        {reports.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <FileSpreadsheet size={36} color="#cbd5e1" style={{ marginBottom: '10px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', margin: '0 0 6px 0' }}>
              No Generated Reports Available
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 auto 16px auto', maxWidth: '440px' }}>
              Upload your workforce, shift, or revenue datasets in Data Management to generate executive audit reports and data downloads.
            </p>
            <a
              href="/data/hr"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#0ca678',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              <span>Upload Datasets</span>
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {reports.map((rep) => {
              const isDl = downloadingId === rep.id;
              return (
                <div
                  key={rep.id}
                  style={{
                    padding: '18px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: '#e6fcf5',
                        color: '#0ca678',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FileSpreadsheet size={18} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                          {rep.name}
                        </h4>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                        Format: {rep.format} • Period: {rep.period} • Size: {rep.size}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(rep)}
                    disabled={isDl}
                    style={{
                      background: '#f8fafc',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: isDl ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={14} />
                    <span>{isDl ? 'Preparing...' : 'Download'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
