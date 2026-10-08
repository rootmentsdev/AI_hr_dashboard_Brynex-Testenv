import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  Plus,
  Link,
  Trash2,
  X
} from 'lucide-react';
import './HrData.css';

export default function HrData() {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');

  const [uploadedFiles, setUploadedFiles] = useState([
    {
      id: 1,
      name: 'employee.csv',
      holds: 'People, roles, teams, salaries, join dates',
      rows: 32,
      period: 'Current',
      status: 'All rows valid'
    },
    {
      id: 2,
      name: 'employee.csv',
      holds: 'People, roles, teams, salaries, join dates',
      rows: 32,
      period: 'Current',
      status: 'All rows valid'
    },
    {
      id: 3,
      name: 'employee.csv',
      holds: 'People, roles, teams, salaries, join dates',
      rows: 32,
      period: 'Current',
      status: 'All rows valid'
    },
    {
      id: 4,
      name: 'employee.csv',
      holds: 'People, roles, teams, salaries, join dates',
      rows: 32,
      period: 'Current',
      status: 'All rows valid'
    }
  ]);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const newEntry = {
          id: Date.now() + Math.random(),
          name: file.name,
          holds: 'People, roles, teams, salaries, join dates',
          rows: Math.floor(Math.random() * 50) + 15,
          period: 'Current',
          status: 'All rows valid'
        };
        setUploadedFiles((prev) => [newEntry, ...prev]);
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const newEntry = {
          id: Date.now() + Math.random(),
          name: file.name,
          holds: 'People, roles, teams, salaries, join dates',
          rows: Math.floor(Math.random() * 50) + 20,
          period: 'Current',
          status: 'All rows valid'
        };
        setUploadedFiles((prev) => [newEntry, ...prev]);
      });
    }
  };

  const handleAddSheet = (e) => {
    e.preventDefault();
    if (!sheetUrl.trim()) return;
    const newEntry = {
      id: Date.now(),
      name: 'Google_Sheet_HR_Sync.csv',
      holds: 'Connected live spreadsheet, roles, salaries',
      rows: 48,
      period: 'Real-time',
      status: 'All rows valid'
    };
    setUploadedFiles((prev) => [newEntry, ...prev]);
    setSheetUrl('');
    setShowSheetModal(false);
  };

  return (
    <div className="hr-data-container">
      {/* 1. Header */}
      <div className="hr-data-header">
        <h1>Data</h1>
        <p>Start with spreadsheets. Connect live systems when you are ready.</p>
      </div>

      {/* 2. Upload Dropzone */}
      <div
        className={`hr-upload-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".csv,.xlsx,.xls"
          multiple
          onChange={handleFileSelect}
        />
        <div className="hr-upload-icon-circle">
          <UploadCloud size={24} />
        </div>
        <h3 className="hr-upload-title">Drop a CSV or paste a Google Sheets link</h3>
        <p className="hr-upload-subtitle">
          Employees, attendance and branch revenue are the three files the HR Brain needs first.
        </p>
        <button
          type="button"
          className="hr-choose-file-btn"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Choose a file
        </button>
      </div>

      {/* 3. Uploaded files Section */}
      <div className="hr-uploaded-section">
        <h2 className="hr-uploaded-title">Uploaded files</h2>

        <div className="hr-table-wrapper">
          <table className="hr-data-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Holds</th>
                <th>Rows</th>
                <th>Period</th>
                <th>Checks</th>
              </tr>
            </thead>
            <tbody>
              {uploadedFiles.map((item) => (
                <tr key={item.id}>
                  <td className="hr-file-name-cell">
                    <span>{item.name}</span>
                  </td>
                  <td className="hr-holds-cell">{item.holds}</td>
                  <td className="hr-rows-cell">{item.rows}</td>
                  <td className="hr-period-cell">{item.period}</td>
                  <td>
                    <span className="hr-check-badge">
                      <CheckCircle2 size={12} />
                      <span>{item.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Sheets Modal */}
      {showSheetModal && (
        <div className="hr-modal-overlay" onClick={() => setShowSheetModal(false)}>
          <div className="hr-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hr-modal-header">
              <h3>Connect Google Sheet</h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowSheetModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Paste the public or shared Google Sheets link to sync live workforce records.
            </p>
            <form onSubmit={handleAddSheet} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="url"
                className="hr-modal-input"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                required
              />
              <div className="hr-modal-actions">
                <button
                  type="button"
                  style={{
                    padding: '8px 16px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                  onClick={() => setShowSheetModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    background: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Connect & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
