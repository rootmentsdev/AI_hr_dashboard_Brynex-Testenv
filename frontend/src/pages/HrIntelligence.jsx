import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import botLogo from '../assets/bot-logo.png';
import bannerImg from '../assets/banner-illustration.png';
import {
  Settings,
  Calendar,
  Download,
  TrendingUp,
  ArrowUpRight,
  ArrowDown,
  AlertTriangle,
  FileText,
  Clock,
  User,
  Activity,
  Building2,
  ShieldAlert,
  Target,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Search,
  Filter,
  Users,
  Network,
  AppWindow,
  UserCheck,
  BarChart2,
  ClipboardList,
  Wallet,
  AlertCircle,
  Info,
  X,
  Send,
  Play,
  RotateCw,
  Cpu,
  BrainCircuit,
  Check,
  UploadCloud
} from 'lucide-react';
import {
  diagnoseHrIssue,
  generateDecisionOptions,
  deployActionPlan
} from '../services/aiService';
import './HrIntelligence.css';

export default function HrIntelligence() {
  const navigate = useNavigate();
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('Overview');
  const [dateRange, setDateRange] = useState('Current Ingested Period');
  const [aiQuery, setAiQuery] = useState('');

  // Small floating chat screen state
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Hello! I am your Brynex AI Workforce Intelligence Copilot powered by Claude. Ask me about your workforce metrics, shift rosters, or labor expenditure.'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Live dynamic analysis state from uploaded file
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch('/api/hr/analysis');
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          setLiveAnalysis(json.data);
          if (json.data.reportingPeriod) {
            setDateRange(json.data.reportingPeriod);
          }
          if (json.data.attentionItems && json.data.attentionItems.length > 0) {
            setSelectedIssueId(json.data.attentionItems[0].id);
          }
        }
      } catch (err) {
        console.warn('Could not load live HR analysis:', err);
      } finally {
        setIsLoadingAnalysis(false);
      }
    };
    fetchAnalysis();
  }, []);

  // Left-Brain Dynamic AI Diagnosis State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [rootCauses, setRootCauses] = useState([]);

  // Layer 6 Decision Engine Options State
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [decisionOptions, setDecisionOptions] = useState([]);

  // Layer 7 Action Execution State
  const [actionOwner, setActionOwner] = useState('HR Director');
  const [actionDeadline, setActionDeadline] = useState('14 Days (Recommended)');
  const [actionKpi, setActionKpi] = useState('Optimize Schedule & Retention');
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);

  const resolvedAttentionItems = liveAnalysis?.attentionItems || [];
  const resolvedKpiMetrics = liveAnalysis?.kpiMetrics || [
    { id: 'issues', title: 'Issues Detected', value: '0', trend: 'Awaiting Telemetry', trendPositive: true, colorClass: 'hr-kpi-icon-purple', icon: <Network size={14} /> },
    { id: 'decisions', title: 'Awaited Decisions', value: '0', trend: 'Awaiting Telemetry', trendPositive: true, colorClass: 'hr-kpi-icon-red', icon: <FileText size={14} /> },
    { id: 'monitored', title: 'Staff Monitored', value: '0', trend: 'No files uploaded', trendPositive: true, colorClass: 'hr-kpi-icon-green', icon: <AppWindow size={14} /> },
    { id: 'opportunities', title: 'Opportunities', value: '0', trend: 'Awaiting Telemetry', trendPositive: true, colorClass: 'hr-kpi-icon-orange', icon: <UserCheck size={14} /> },
    { id: 'productivity', title: 'Avg. Productivity', value: '0%', trend: 'Awaiting Telemetry', trendPositive: true, colorClass: 'hr-kpi-icon-blue', icon: <Activity size={14} /> }
  ];

  // Filter list
  const filteredItems = resolvedAttentionItems.filter((item) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Critical') return item.category === 'Critical';
    if (activeFilter === 'Need investigation') return item.category === 'Need investigation';
    if (activeFilter === 'Opportunity') return item.category === 'Opportunity';
    return true;
  });

  const selectedItem = resolvedAttentionItems.find((item) => item.id === selectedIssueId) || resolvedAttentionItems[0] || null;

  // Whenever selectedIssueId or liveAnalysis changes, synchronize the right-side tabs to the selected issue
  useEffect(() => {
    if (selectedItem) {
      if (selectedItem.possibleCauses && selectedItem.possibleCauses.length > 0) {
        setRootCauses(selectedItem.possibleCauses);
      } else {
        setRootCauses([]);
      }
      if (selectedItem.decisionOptions && selectedItem.decisionOptions.length > 0) {
        setDecisionOptions(selectedItem.decisionOptions);
        setSelectedOptionId(selectedItem.decisionOptions[0].id);
      } else {
        setDecisionOptions([]);
        setSelectedOptionId(null);
      }
      setDeploymentSuccess(false);
    }
  }, [selectedIssueId, liveAnalysis]);

  const selectedOption = decisionOptions.find((opt) => opt.id === selectedOptionId) || decisionOptions[0] || null;

  const handleExport = () => {
    alert('Exporting verified workforce intelligence report...');
  };

  const handleAskAi = async (e) => {
    e?.preventDefault();
    if (!aiQuery.trim()) return;

    const userText = aiQuery.trim();
    setAiQuery('');
    setShowChatPopup(true);

    const userMsg = { id: Date.now(), sender: 'user', text: userText };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
      });
      const data = await res.json();
      const reply = data.success && data.message ? data.message : 'Telemetry received. Connect additional files in Data Management for deeper correlation.';
      setChatMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'assistant', text: reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'assistant', text: 'Error contacting AI assistant. Please verify your API key in Settings.' }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Trigger Left-Brain AI Diagnosis
  const handleRunAiDiagnosis = async () => {
    if (!selectedItem) return;
    setIsDiagnosing(true);
    try {
      const result = await diagnoseHrIssue(selectedItem);
      if (result && result.rootCauses) {
        setRootCauses(result.rootCauses);
      }
    } catch (err) {
      alert(`Diagnosis error: ${err.message}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Trigger Decision Engine Options Generation
  const handleRegenerateOptions = async () => {
    if (!selectedItem) return;
    setIsGeneratingOptions(true);
    try {
      const options = await generateDecisionOptions(selectedItem);
      if (options && options.length > 0) {
        setDecisionOptions(options);
        setSelectedOptionId(options[0].id);
      }
    } catch (err) {
      alert(`Options generator error: ${err.message}`);
    } finally {
      setIsGeneratingOptions(false);
    }
  };

  // Deploy Action to Layer 7 Execution Engine
  const handleDeployAction = () => {
    if (!selectedOption) return;
    deployActionPlan({
      title: `${selectedOption.badge}: ${selectedOption.title}`,
      owner: actionOwner,
      deadline: actionDeadline,
      kpi: actionKpi,
      optionBadge: selectedOption.badge
    });
    setDeploymentSuccess(true);
  };

  return (
    <div className="hr-page-container">
      {/* 1. Top Section: Banner + AI Assistant & HR Health Score */}
      <div className="hr-top-banner-grid">
        {/* Left Banner Wrapper */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', paddingTop: '15px' }}>
          {/* Floating Actions */}
          <div className="hr-page-header-actions" style={{ position: 'absolute', top: '0', right: '24px', zIndex: 10 }}>
            <button className="hr-date-btn hr-date-btn-shadow" style={{ background: '#fff', height: '36px' }}>
              <Calendar size={14} />
              <span>{dateRange}</span>
              <ChevronDown size={14} />
            </button>
            <button className="hr-export-btn hr-btn-shadow" onClick={handleExport} style={{ background: '#fff', height: '36px' }}>
              <Download size={14} />
              <span>Export Report</span>
            </button>
          </div>

          {/* Left Banner Card */}
          <div className="hr-welcome-banner" style={{ flex: 1 }}>
            <div className="hr-welcome-left">
              <div className="hr-banner-icon-wrapper">
                <Settings size={22} />
              </div>
              <div className="hr-banner-text">
                <h2>HR Intelligence Operating System</h2>
                <p>Understand what's happening in your workforce, why it's happening, and what to do next.</p>
                {/* Two-Brain Architecture Badges */}
                <div className="hr-two-brain-pills">
                  <span className="hr-brain-pill-left" title="Universal Business Management Rules">
                    <BrainCircuit size={13} />
                    <span>Left Brain: Management Diagnostic Framework Active</span>
                  </span>
                  <span className="hr-brain-pill-right" title="Company Digital Profile">
                    <Building2 size={13} />
                    <span>
                      Right Brain: {liveAnalysis ? `${liveAnalysis.totalRecords} Records Synced` : 'Awaiting Ingestion'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Background Graphic */}
            <div className="hr-banner-illustration">
              <img src={bannerImg} alt="Analytics graphic" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.8) translate(-1%, 10%)' }} />
            </div>
          </div>

          {/* 2. Row of 5 Metric KPI Cards */}
          <div className="hr-metrics-grid" style={{ marginTop: '12px' }}>
            {resolvedKpiMetrics.map((kpi, idx) => (
              <div key={kpi.id || idx} className="hr-kpi-card">
                <div className="hr-kpi-top">
                  <span className="hr-kpi-label">{kpi.title}</span>
                  <div className={`hr-kpi-icon-pill ${kpi.colorClass || 'hr-kpi-icon-blue'}`}>
                    {kpi.icon || <Activity size={14} />}
                  </div>
                </div>
                <div className="hr-kpi-val">{kpi.value}</div>
                <div className="hr-kpi-trend">
                  <ArrowUpRight size={14} />
                  <span>{kpi.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Prompt Pill & HR Health Score Card */}
        <div className="hr-top-right-column">
          {/* AI Search / Prompt Pill */}
          <form className="hr-ai-ask-pill" onSubmit={handleAskAi} onClick={() => !showChatPopup && setShowChatPopup(true)}>
            <div className="hr-ai-avatar">
              <img src={botLogo} alt="AI Bot" style={{ width: '110%', height: '110%', objectFit: 'contain' }} />
            </div>
            <input
              type="text"
              className="hr-ai-input-text"
              placeholder="Ask Claude AI about your workforce..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onFocus={() => setShowChatPopup(true)}
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%' }}
            />
          </form>

          {/* Floating Chat Modal */}
          {showChatPopup && (
            <div className="hr-inline-chat-popup">
              <div className="hr-inline-chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="hr-inline-chat-avatar">
                    <img src={botLogo} alt="AI Bot" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Claude AI Assistant</h4>
                    <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: '500' }}>● Live Copilot</span>
                  </div>
                </div>

                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  onClick={() => setShowChatPopup(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="hr-inline-chat-messages">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`hr-chat-msg-row ${msg.sender}`}>
                    <div className="hr-chat-msg-bubble">
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="hr-chat-msg-row assistant">
                    <div className="hr-chat-msg-bubble" style={{ color: '#0ca678', fontStyle: 'italic', fontSize: '12px' }}>
                      Claude is synthesizing telemetry...
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Input Dock inside Chat */}
              <form className="hr-inline-chat-input-row" onSubmit={handleAskAi}>
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  autoFocus
                />
                <button type="submit" title="Send">
                  <Send size={13} />
                </button>
              </form>
            </div>
          )}

          {/* HR Health Score Card */}
          <div className="hr-health-score-card">
            <div className="hr-health-header">
              <span className="hr-health-title">HR Health Score</span>
              <span className="hr-health-badge">
                {liveAnalysis?.healthStatus || 'Awaiting Data'}
              </span>
            </div>
            <div className="hr-health-value">
              {liveAnalysis?.healthScore || 'N/A'}
            </div>
            <div className="hr-health-footer">
              <TrendingUp size={14} />
              <span>
                {resolvedAttentionItems.length > 0 ? `${resolvedAttentionItems.length} active anomalies detected` : 'No anomalies flagged'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split Grid or Clean Empty State */}
      {resolvedAttentionItems.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '70px 40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            marginTop: '20px'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#e6fcf5',
              color: '#0ca678',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <BrainCircuit size={32} />
          </div>
          <div style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
              No Workforce Telemetry Available
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              All mock data has been purged. Upload your actual HR Master, Roster, Attendance, or Payroll CSV/Excel files in Data Management. Brynex AI will automatically cross-correlate records, calculate KPIs, and diagnose root causes.
            </p>
          </div>
          <button
            onClick={() => navigate('/data/hr')}
            style={{
              background: '#0ca678',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px'
            }}
          >
            <UploadCloud size={16} />
            <span>Upload Dataset in Data Management</span>
          </button>
        </div>
      ) : (
        <div className="hr-split-grid">
          {/* Left Column: Management Attention */}
          <div className="hr-attention-column">
            <div className="hr-attention-header-card">
              <div className="hr-attention-title-row">
                <h3 className="hr-attention-title">Management Attention</h3>
                <button className="hr-date-btn hr-date-btn-small">
                  <Calendar size={14} color="#64748b" />
                  <span style={{ color: '#0f172a', fontWeight: '500' }}>{dateRange}</span>
                  <ChevronDown size={14} color="#64748b" />
                </button>
              </div>
              <p className="hr-attention-desc">
                {liveAnalysis?.attentionSummary || 'Dynamic analysis generated from ingested datasets.'}
              </p>

              {/* Filter Pills Row */}
              <div className="hr-filter-row">
                <div className="hr-filter-pills">
                  <button
                    className={`hr-filter-pill ${activeFilter === 'All' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('All')}
                  >
                    All ({resolvedAttentionItems.length})
                  </button>
                  <button
                    className={`hr-filter-pill ${activeFilter === 'Critical' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Critical')}
                  >
                    <span className="hr-dot hr-dot-red"></span>
                    Critical ({resolvedAttentionItems.filter((i) => i.category === 'Critical').length})
                  </button>
                  <button
                    className={`hr-filter-pill ${activeFilter === 'Need investigation' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Need investigation')}
                  >
                    <span className="hr-dot hr-dot-yellow"></span>
                    Need investigation ({resolvedAttentionItems.filter((i) => i.category === 'Need investigation').length})
                  </button>
                  <button
                    className={`hr-filter-pill ${activeFilter === 'Opportunity' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Opportunity')}
                  >
                    <span className="hr-dot hr-dot-green"></span>
                    Opportunity ({resolvedAttentionItems.filter((i) => i.category === 'Opportunity').length})
                  </button>
                </div>
              </div>
            </div>

            {/* List of Issue Cards */}
            <div className="hr-attention-cards-list">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`hr-attention-card ${selectedIssueId === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedIssueId(item.id)}
                >
                  <div className="hr-card-top-row">
                    <span
                      className={`hr-badge ${
                        item.category === 'Critical'
                          ? 'hr-badge-critical'
                          : item.category === 'Need investigation'
                          ? 'hr-badge-warning'
                          : 'hr-badge-opportunity'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="hr-branch-tag">{item.branch}</span>
                  </div>

                  <h4 className="hr-card-title">{item.title}</h4>
                  <p className="hr-card-desc">{item.description}</p>

                  <div className="hr-card-bottom-row">
                    <span className="hr-topic-tag">{item.topic}</span>
                    <span className="hr-confidence-tag">Confidence: {item.confidence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Detailed Investigation View */}
          {selectedItem && (
            <div className="hr-detail-card">
              {/* Top Bar inside Detail */}
              <div className="hr-detail-top-nav">
                <button className="hr-back-btn" onClick={() => setActiveFilter('All')}>
                  <ArrowLeft size={14} />
                  <span>Back to list</span>
                </button>
                <span className="hr-status-badge-outline" style={{ padding: '3px 12px' }}>
                  {selectedItem.status || 'Active Issue'}
                </span>
              </div>

              {/* Title & Metadata */}
              <div>
                <h2 className="hr-detail-title">{selectedItem.title}</h2>
                <div className="hr-detail-meta-row" style={{ marginTop: '8px' }}>
                  <div className="hr-meta-item">
                    <Building2 size={14} />
                    <span>{selectedItem.branch}</span>
                  </div>
                  <div className="hr-meta-item">
                    <ShieldAlert size={14} />
                    <span>{selectedItem.department}</span>
                  </div>
                  <div className="hr-meta-item">
                    <Calendar size={14} />
                    <span>{selectedItem.dateRange}</span>
                  </div>
                </div>
              </div>

              {/* Priority & Confidence row */}
              <div className="hr-detail-badges-row">
                <span className="hr-priority-tag hr-priority-high">● {selectedItem.priority || 'High Priority'}</span>
                <span className="hr-confidence-badge">Confidence: {selectedItem.confidence}</span>
              </div>

              {/* Navigation Tabs */}
              <div className="hr-tabs-container">
                {['Overview', 'Possible Causes', 'Options', 'Decision & Actions'].map((tab) => (
                  <button
                    key={tab}
                    className={`hr-tab-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview */}
              {activeTab === 'Overview' && (
                <div className="hr-tab-content">
                  <div className="hr-section-box">
                    <h4 className="hr-section-header-title">What's happening?</h4>
                    <p className="hr-section-paragraph">{selectedItem.whatsHappening || selectedItem.description}</p>

                    {/* Metric Boxes */}
                    {selectedItem.metrics && selectedItem.metrics.length > 0 && (
                      <div className="hr-four-metrics-grid">
                        {selectedItem.metrics.map((m, idx) => (
                          <div key={idx} className="hr-mini-metric-tile">
                            <span className="hr-mini-metric-title">{m.label}</span>
                            <div className="hr-mini-metric-val">
                              <span>{m.val}</span>
                              {m.hasDownArrow && <ArrowDown size={14} color="#ef4444" />}
                            </div>
                            <span className="hr-mini-metric-note">{m.note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Possible Causes (Claude AI Diagnosis) */}
              {activeTab === 'Possible Causes' && (
                <div className="hr-tab-content">
                  <div className="hr-section-box">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <h4 className="hr-section-header-title" style={{ margin: 0 }}>
                          Claude AI Root Cause Diagnosis
                        </h4>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Diagnostic evaluation using Left-Brain workforce framework
                        </span>
                      </div>
                      <button
                        onClick={handleRunAiDiagnosis}
                        disabled={isDiagnosing}
                        style={{
                          background: '#0f172a',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: isDiagnosing ? 'wait' : 'pointer'
                        }}
                      >
                        <Sparkles size={13} color="#0ca678" />
                        <span>{isDiagnosing ? 'Diagnosing...' : 'Run Live AI Diagnosis'}</span>
                      </button>
                    </div>

                    <div className="hr-causes-list">
                      {rootCauses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                          Click "Run Live AI Diagnosis" to analyze this issue with Claude.
                        </div>
                      ) : (
                        rootCauses.map((cause, idx) => (
                          <div key={idx} className="hr-cause-item">
                            <div className="hr-cause-top">
                              <span className="hr-cause-title">{cause.title}</span>
                              <span
                                className={`hr-cause-badge ${
                                  cause.confidence.includes('High') ? 'hr-badge-high-conf' : 'hr-badge-med-conf'
                                }`}
                              >
                                {cause.confidence}
                              </span>
                            </div>
                            <p className="hr-cause-desc">{cause.description}</p>
                            {cause.evidence && (
                              <div className="hr-cause-evidence">
                                <strong>Evidence:</strong> {cause.evidence}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Options (Claude AI Decision Engine) */}
              {activeTab === 'Options' && (
                <div className="hr-tab-content">
                  <div className="hr-section-box">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <h4 className="hr-section-header-title" style={{ margin: 0 }}>
                          Layer 6 Decision Engine (Option A / B / C)
                        </h4>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Strategic decision options synthesized by Claude AI
                        </span>
                      </div>
                      <button
                        onClick={handleRegenerateOptions}
                        disabled={isGeneratingOptions}
                        style={{
                          background: '#0f172a',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: isGeneratingOptions ? 'wait' : 'pointer'
                        }}
                      >
                        <Sparkles size={13} color="#0ca678" />
                        <span>{isGeneratingOptions ? 'Synthesizing...' : 'Generate AI Options'}</span>
                      </button>
                    </div>

                    <div className="hr-options-grid">
                      {decisionOptions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px', width: '100%' }}>
                          Click "Generate AI Options" to compute 3 architectural decision paths with Claude.
                        </div>
                      ) : (
                        decisionOptions.map((opt) => (
                          <div
                            key={opt.id}
                            className={`hr-option-card ${selectedOptionId === opt.id ? 'active' : ''}`}
                            onClick={() => setSelectedOptionId(opt.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="hr-option-badge">{opt.badge}</span>
                            <h5 className="hr-option-title">{opt.title}</h5>
                            <p className="hr-option-desc">{opt.description}</p>
                            {opt.impact && (
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0ca678', marginTop: '8px' }}>
                                Impact: {opt.impact}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Decision & Actions */}
              {activeTab === 'Decision & Actions' && (
                <div className="hr-tab-content">
                  <div className="hr-section-box">
                    <h4 className="hr-section-header-title">Layer 7 Action Execution</h4>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>
                      Deploy selected management decision to operational action items.
                    </p>

                    {selectedOption ? (
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', marginTop: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                          Selected Decision: {selectedOption.badge}
                        </div>
                        <div style={{ fontSize: '13px', color: '#334155', marginBottom: '14px' }}>
                          {selectedOption.title}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                              Action Owner
                            </label>
                            <input
                              type="text"
                              value={actionOwner}
                              onChange={(e) => setActionOwner(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                              Target Deadline
                            </label>
                            <input
                              type="text"
                              value={actionDeadline}
                              onChange={(e) => setActionDeadline(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleDeployAction}
                          style={{
                            background: '#0ca678',
                            color: '#ffffff',
                            border: 'none',
                            padding: '10px 18px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <CheckCircle2 size={15} />
                          <span>Deploy to AI Tasks</span>
                        </button>

                        {deploymentSuccess && (
                          <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#0ca678', fontWeight: 600 }}>
                            ✓ Action plan deployed successfully to AI Tasks!
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                        Generate and select an option in the "Options" tab first.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
