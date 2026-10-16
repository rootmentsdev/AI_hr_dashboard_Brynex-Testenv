import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  Plus,
  Link,
  Trash2,
  X,
  Eye,
  Download,
  Sliders,
  Sparkles,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './HrData.css';

export default function HrData() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Modals state
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Admin Custom Rules & Manual Selection Options
  const [adminPrompt, setAdminPrompt] = useState('');
  const [targetAttrition, setTargetAttrition] = useState('5.0');
  const [targetProductivity, setTargetProductivity] = useState('90');
  const [targetDepartment, setTargetDepartment] = useState('All');
  const [focusPriority, setFocusPriority] = useState('All');
  const [calculationMode, setCalculationMode] = useState('hybrid'); // 'hybrid' | 'manual' | 'autonomous'
  const [timeHorizon, setTimeHorizon] = useState('01-30 Sep 2026');

  // File records list
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [syncedEmployees, setSyncedEmployees] = useState([]);

  // Fetch existing uploaded files from backend
  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/hr/files');
      const data = await res.json();
      if (data.status === 'success') {
        setUploadedFiles(data.files);
      }
    } catch (err) {
      console.warn('Could not fetch backend files:', err);
    }
  };

  // Fetch real synced employees from backend
  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/hr/employees');
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        setSyncedEmployees(data.data);
      }
    } catch (err) {
      console.warn('Could not fetch backend employees:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchEmployees();
  }, []);

  const handleUploadFile = async (file) => {
    if (!file) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('adminPrompt', adminPrompt);
    formData.append(
      'customRules',
      JSON.stringify({
        targetAttrition: parseFloat(targetAttrition) || 5.0,
        targetProductivity: parseFloat(targetProductivity) || 90,
        targetDepartment,
        focusPriority,
        calculationMode,
        timeHorizon
      })
    );

    try {
      const res = await fetch('/api/hr/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.status === 'success') {
        await fetchFiles();
        await fetchEmployees();
        if (window.confirm(`File "${file.name}" analyzed by AI!\nWould you like to open the HR Intelligence Dashboard now?`)) {
          navigate('/intelligence/hr');
        }
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading file to server.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUploadFile(files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUploadFile(files[0]);
    }
  };

  const handleAddSheet = async (e) => {
    e.preventDefault();
    if (!sheetUrl.trim()) return;

    try {
      setIsUploading(true);
      let exportUrl = sheetUrl.trim();
      if (exportUrl.includes('/edit')) {
        exportUrl = exportUrl.replace(/\/edit.*$/, '/export?format=csv');
      }
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error('Could not fetch Google Sheet. Please ensure the link is shared as "Anyone with the link can view", or download it as a CSV and drag-and-drop it into the upload box.');
      }
      const text = await response.text();
      const blob = new Blob([text], { type: 'text/csv' });
      const file = new File([blob], 'Google_Sheet_Export.csv', { type: 'text/csv' });
      await handleUploadFile(file);
      setSheetUrl('');
      setShowSheetModal(false);
    } catch (err) {
      alert(err.message || 'Error fetching sheet. Please download it as a CSV and upload it directly.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenFilePreview = async (file) => {
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/hr/files/${file.savedFilename || file.id}/preview`);
      const data = await res.json();
      if (data.status === 'success') {
        setPreviewFile(data.file);
      } else {
        alert(data.message || 'Could not load preview for this file.');
      }
    } catch (err) {
      console.warn('Failed to load preview:', err);
      alert('Error fetching file preview.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDeleteFile = async (e, file) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${file.name}"? This will re-calculate HR dashboard metrics.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/hr/files/${file.savedFilename || file.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (previewFile && (previewFile.id === file.id || previewFile.savedFilename === file.savedFilename)) {
          setPreviewFile(null);
        }
        await fetchFiles();
      } else {
        alert(data.message || 'Error deleting file.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting file from server.');
    }
  };

  return (
    <div className="hr-data-container">
      {/* 1. Header */}
      <div className="hr-data-header">
        <div className="hr-data-header-left">
          <h1>Data</h1>
          <p>Start with spreadsheets. Connect live systems when you are ready.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="hr-admin-rules-btn"
            onClick={() => setShowRulesModal(true)}
            title="Configure analysis parameters"
          >
            <Sliders size={15} />
            <span>AI & Admin Rules</span>
          </button>

          <button
            type="button"
            className="hr-admin-rules-btn"
            style={{ background: '#0f172a', color: '#fff', border: 'none' }}
            onClick={() => navigate('/intelligence/hr')}
            title="View HR Dashboard"
          >
            <span>View HR Dashboard</span>
            <ArrowRight size={14} />
          </button>
        </div>
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
          accept=".csv,.xlsx,.xls,.pdf"
          onChange={handleFileSelect}
        />
        <div className="hr-upload-icon-circle">
          {isUploading ? <Loader2 size={24} className="spin" /> : <UploadCloud size={24} />}
        </div>
        <h3 className="hr-upload-title">
          {isUploading ? 'Scanning & Analyzing with AI...' : 'Drop a CSV, Excel, PDF or paste a Google Sheets link'}
        </h3>
        <p className="hr-upload-subtitle">
          Employees, attendance and branch revenue are the three files the HR Brain needs first.
        </p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
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
          <button
            type="button"
            style={{
              padding: '9px 18px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowSheetModal(true);
            }}
          >
            Connect Google Sheet
          </button>
        </div>
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
                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploadedFiles.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: '13.5px' }}>
                    No files uploaded yet. Drag and drop CSV or Excel datasets above to begin.
                  </td>
                </tr>
              ) : (
                uploadedFiles.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenFilePreview(item)}
                    title="Click to preview file rows & download"
                  >
                    <td className="hr-file-name-cell">
                      <FileSpreadsheet size={16} color="#0ca678" />
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
                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <button
                        type="button"
                        className="hr-table-delete-btn"
                        onClick={(e) => handleDeleteFile(e, item)}
                        title="Delete file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Right Brain Live Roster Section */}
      <div className="hr-uploaded-section" style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h2 className="hr-uploaded-title" style={{ margin: 0 }}>
              Right Brain: Synced Employee Digital Profiles
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Workforce telemetry parsed and correlated dynamically from your uploaded employee master and shift files.
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0ca678', background: '#e6fcf5', padding: '4px 12px', borderRadius: '16px' }}>
            ● {syncedEmployees.length} Live Records Synced
          </span>
        </div>

        <div className="hr-table-wrapper" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <table className="hr-data-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Role Title</th>
                <th>Branch</th>
                <th>Department</th>
                <th>Base Salary</th>
                <th>Overtime (Mo)</th>
                <th>Attendance</th>
                <th>Retention Risk</th>
              </tr>
            </thead>
            <tbody>
              {syncedEmployees.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: '13.5px' }}>
                    No employee records synced. Upload an employee master dataset to populate live profiles.
                  </td>
                </tr>
              ) : (
                syncedEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>{emp.id}</td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{emp.name}</td>
                    <td>{emp.role}</td>
                    <td>{emp.branch}</td>
                    <td>{emp.dept}</td>
                    <td style={{ fontWeight: 500 }}>{emp.salary}</td>
                    <td style={{ color: parseFloat(emp.ot) > 10 ? '#ef4444' : '#64748b', fontWeight: 500 }}>
                      {emp.ot}
                    </td>
                    <td>
                      <span style={{ color: parseInt(emp.att) < 90 ? '#f59e0b' : '#0ca678', fontWeight: 600 }}>
                        {emp.att}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: emp.risk.includes('Critical') ? '#fef2f2' : emp.risk.includes('High') ? '#fff1f2' : emp.risk.includes('Medium') ? '#fffbeb' : '#f0fdf4',
                          color: emp.risk.includes('Critical') ? '#b91c1c' : emp.risk.includes('High') ? '#e11d48' : emp.risk.includes('Medium') ? '#d97706' : '#16a34a'
                        }}
                      >
                        {emp.risk}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="hr-modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="hr-modal-card hr-preview-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hr-modal-header">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={18} color="#0ca678" />
                  <span>{previewFile.name}</span>
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Previewing {previewFile.data?.length || 0} rows of {previewFile.rowsCount || previewFile.data?.length || 0} total records
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={`/api/hr/files/${previewFile.savedFilename || previewFile.name}/download`}
                  className="hr-action-icon-btn"
                  download
                  title="Download raw file"
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  className="hr-action-icon-btn hr-action-danger-btn"
                  onClick={(e) => handleDeleteFile(e, previewFile)}
                  title="Delete file from server"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  onClick={() => setPreviewFile(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="hr-preview-scroll-area">
              <table className="hr-preview-table">
                <thead>
                  <tr>
                    {previewFile.columns?.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewFile.data?.map((row, idx) => (
                    <tr key={idx}>
                      {previewFile.columns?.map((col) => (
                        <td key={col}>{String(row[col] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="hr-modal-actions" style={{ marginTop: '12px' }}>
              <button
                type="button"
                className="hr-action-icon-btn"
                onClick={() => {
                  setPreviewFile(null);
                  navigate('/intelligence/hr');
                }}
                style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 16px' }}
              >
                <span>View in HR Intelligence</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Rules & Prompting Modal */}
      {showRulesModal && (
        <div className="hr-modal-overlay" onClick={() => setShowRulesModal(false)}>
          <div className="hr-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hr-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#0ca678" />
                <span>AI & Admin Analysis Rules</span>
              </h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowRulesModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: '#64748b' }}>
              Set custom parameters for the AI. If left empty, the AI autonomously extracts rules and benchmarks from your uploaded files.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Row 1: Target Attrition & Productivity Baseline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Target Attrition Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="hr-modal-input"
                    value={targetAttrition}
                    onChange={(e) => setTargetAttrition(e.target.value)}
                    placeholder="5.0"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Productivity Baseline (%)
                  </label>
                  <input
                    type="number"
                    className="hr-modal-input"
                    value={targetProductivity}
                    onChange={(e) => setTargetProductivity(e.target.value)}
                    placeholder="90"
                  />
                </div>
              </div>

              {/* Row 2: Manual Department Focus & Attention Priority Filter */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Focus Department / Team
                  </label>
                  <select
                    className="hr-modal-input"
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    style={{ background: '#fff' }}
                  >
                    <option value="All">All Departments (Auto-Detect)</option>
                    <option value="Sales">Sales & Business Development</option>
                    <option value="Retail">Retail & Store Operations</option>
                    <option value="Operations">Operations & Logistics</option>
                    <option value="Engineering">Engineering & Product</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Dashboard Severity Focus
                  </label>
                  <select
                    className="hr-modal-input"
                    value={focusPriority}
                    onChange={(e) => setFocusPriority(e.target.value)}
                    style={{ background: '#fff' }}
                  >
                    <option value="All">All Severity Levels</option>
                    <option value="Critical">Critical Issues Only</option>
                    <option value="Need investigation">Needs Investigation</option>
                    <option value="Opportunity">Opportunities Only</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Calculation Mode & Reporting Period */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Calculation Mode
                  </label>
                  <select
                    className="hr-modal-input"
                    value={calculationMode}
                    onChange={(e) => setCalculationMode(e.target.value)}
                    style={{ background: '#fff' }}
                  >
                    <option value="hybrid">Hybrid (Custom Rules + AI)</option>
                    <option value="manual">Strict Manual Parameters</option>
                    <option value="autonomous">Fully Autonomous AI</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Reporting Date Horizon
                  </label>
                  <input
                    type="text"
                    className="hr-modal-input"
                    value={timeHorizon}
                    onChange={(e) => setTimeHorizon(e.target.value)}
                    placeholder="e.g. 01-30 Sep 2026"
                  />
                </div>
              </div>

              {/* Row 4: Prompting Instructions for AI */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Admin Prompt / Focus Instructions for AI
                </label>
                <textarea
                  className="hr-modal-textarea"
                  rows={2}
                  value={adminPrompt}
                  onChange={(e) => setAdminPrompt(e.target.value)}
                  placeholder="e.g. Focus specifically on frontline retail teams and calculate potential cost savings from schedule restructuring..."
                />
              </div>

              <div className="hr-modal-actions" style={{ marginTop: '6px' }}>
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
                  onClick={() => setShowRulesModal(false)}
                >
                  Save Rules
                </button>
                <button
                  type="button"
                  style={{
                    padding: '8px 16px',
                    background: '#0ca678',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/hr/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          adminPrompt,
                          customRules: {
                            targetAttrition: parseFloat(targetAttrition) || 5.0,
                            targetProductivity: parseFloat(targetProductivity) || 90,
                            targetDepartment,
                            focusPriority,
                            calculationMode,
                            timeHorizon
                          }
                        })
                      });
                      const json = await res.json();
                      setShowRulesModal(false);
                      if (json.status === 'success') {
                        if (window.confirm('Manual parameters applied to HR Dashboard! Would you like to view the dashboard now?')) {
                          navigate('/intelligence/hr');
                        }
                      }
                    } catch (err) {
                      console.error('Failed to apply manual rules:', err);
                      setShowRulesModal(false);
                    }
                  }}
                >
                  Apply & Re-Calculate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
