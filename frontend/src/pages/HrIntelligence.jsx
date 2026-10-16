import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import botLogo from '../assets/bot-logo.png';
import bannerImg from '../assets/banner-illustration.png';
import {
  Settings,
  Calendar,
  Download,
  Bot,
  TrendingUp,
  ArrowUpRight,
  ArrowDown,
  AlertTriangle,
  FileText,
  Clock,
  User,
  Activity,
  SlidersHorizontal,
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
  Play,
  RotateCw,
  Cpu,
  BrainCircuit,
  Check
} from 'lucide-react';
import {
  diagnoseHrIssue,
  generateDecisionOptions,
  deployActionPlan
} from '../services/aiService';
import './HrIntelligence.css';

export default function HrIntelligence() {
  const navigate = useNavigate();
  const [selectedIssueId, setSelectedIssueId] = useState(1);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('Overview');
  const [dateRange, setDateRange] = useState('01-30 Sep 2026');
  const [aiQuery, setAiQuery] = useState('');

  // Left-Brain Dynamic AI Diagnosis State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [rootCauses, setRootCauses] = useState([
    {
      title: 'Concentrated Overtime in Peak Shifts',
      description: 'Overtime hours increased by 28% without corresponding revenue expansion, directly inflating payroll ratio.',
      confidence: 'High Confidence',
      evidence: 'Overtime telemetry: $42.6k spent over benchmark.'
    },
    {
      title: 'Frontline Compensation Disparity',
      description: 'Compensation lags regional benchmark by 8.4%, causing attrition spikes in frontline retail roles.',
      confidence: 'High Confidence',
      evidence: 'Exit interviews: 68% cite compensation gaps.'
    },
    {
      title: 'Manager Supervision & Shift Fatigue',
      description: 'Back-to-back closing and opening shifts lead to fatigue, low productivity and absenteeism.',
      confidence: 'Medium Confidence',
      evidence: 'Shift roster records in West & Central branches.'
    }
  ]);

  // Layer 6 Decision Engine Options State
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState('opt-b');
  const [decisionOptions, setDecisionOptions] = useState([
    {
      id: 'opt-a',
      badge: 'Option A - Revenue Growth',
      title: 'Targeted Staffing & Sales Productivity Coaching',
      description: 'Introduce performance-based incentive tiers ($1,200/mo) and retail sales coaching.',
      impact: 'Potential +$24k/mo revenue uplift',
      effort: 'Medium',
      risk: 'Medium Risk',
      cost: 'Moderate'
    },
    {
      id: 'opt-b',
      badge: 'Option B - Cost Optimisation',
      title: 'Roster Efficiency & Overtime Reduction',
      description: 'Restructure roster to eliminate 15-minute overlap and enforce overtime pre-approval.',
      impact: 'Save $14.2k/month in payroll cost',
      effort: 'Low',
      risk: 'Low Risk',
      cost: 'Minimal'
    },
    {
      id: 'opt-c',
      badge: 'Option C - Combined Turnaround',
      title: 'Cross-Branch Capacity Rebalance & Rest Rotation',
      description: 'Redeploy 2 staff from low-traffic branches and mandate 10-hour rest between shifts.',
      impact: 'EBITDA improvement +$18.5k/month',
      effort: 'High',
      risk: 'Medium Risk',
      cost: 'Low'
    }
  ]);

  // Layer 7 Action Execution State
  const [actionOwner, setActionOwner] = useState('HR Director');
  const [actionDeadline, setActionDeadline] = useState('14 Days (Recommended)');
  const [actionKpi, setActionKpi] = useState('Reduce Payroll Ratio to 14.5%');
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);

  // 5 Top Metric Cards Data
  const kpiMetrics = [
    {
      id: 'issues',
      title: 'Issues Detected',
      value: '3',
      trend: '3% vs previous 30 Days',
      trendPositive: true,
      colorClass: 'hr-kpi-icon-purple',
      icon: <Network size={14} />
    },
    {
      id: 'decisions',
      title: 'Awaited Decisions',
      value: '2',
      trend: '3% vs previous 30 Days',
      trendPositive: true,
      colorClass: 'hr-kpi-icon-red',
      icon: <FileText size={14} />
    },
    {
      id: 'monitored',
      title: 'Being Monitored',
      value: '1',
      trend: '2% vs previous 30 Days',
      trendPositive: true,
      colorClass: 'hr-kpi-icon-green',
      icon: <AppWindow size={14} />
    },
    {
      id: 'opportunities',
      title: 'Opportunities',
      value: '2',
      trend: '3% vs previous 30 Days',
      trendPositive: true,
      colorClass: 'hr-kpi-icon-orange',
      icon: <UserCheck size={14} />
    },
    {
      id: 'productivity',
      title: 'Avg. Productivity',
      value: '87%',
      trend: '3% vs last month',
      trendPositive: true,
      colorClass: 'hr-kpi-icon-blue',
      icon: <Activity size={14} />
    }
  ];

  // Management Attention Items List
  const attentionItems = [
    {
      id: 1,
      category: 'Critical',
      priority: 'High Priority',
      status: 'Needs investigation',
      title: 'Payroll ratio increased to 18% against a 12% target.',
      description: 'Higher exits in sales and retail teams may affect workforce stability and increase recruitment costs.',
      branch: 'All branches',
      topic: 'Cost efficiency',
      dateRange: 'Apr 2026 - May 2026',
      confidence: '78%',
      detailTitle: 'Payroll ratio surged from 12% to 18% (+6 pp)',
      department: 'Workforce Economics & Overtime',
      whatsHappening: "Payroll ratio has increased from 12% to 18% while revenue declined 8% over the last 3 months. Inefficient shift overlap and concentrated peak overtime have driven payroll divergence.",
      metrics: [
        { label: 'Current payroll ratio', val: '18.0%', note: '+6.0 pp vs target' },
        { label: 'Target benchmark', val: '12.0%', note: 'HR benchmark', hasDownArrow: true },
        { label: 'Overtime cost increase', val: '+$42.6k', note: 'Last 90 days' },
        { label: 'Most affected team', val: 'Frontline Retail', note: 'Highest overtime rate' }
      ]
    },
    {
      id: 2,
      category: 'Need investigation',
      priority: 'High Priority',
      status: 'Needs investigation',
      title: 'Higher than expected attrition in frontline retail roles',
      description: 'Frontline turnover increased to 7.8% across retail branches. Overtime replacement costs are rising while service delivery suffers.',
      branch: 'Retail branches',
      topic: 'Retention risk',
      dateRange: 'Apr 2026 - May 2026',
      confidence: '84%',
      detailTitle: 'Frontline retail employee turnover anomaly',
      department: 'Retention & Workforce Planning',
      whatsHappening: 'Frontline workforce turnover has triggered a secondary spike in overtime and onboarding expenses across regional operations centers.',
      metrics: [
        { label: 'Current attrition', val: '7.8%', note: '+2.8 pp vs target' },
        { label: 'Target', val: '5.0%', note: 'HR benchmark', hasDownArrow: true },
        { label: 'Employees exited', val: '14', note: 'Frontline headcount' },
        { label: 'Most affected team', val: 'Sales & Retail', note: 'Critical shift load' }
      ]
    },
    {
      id: 3,
      category: 'Opportunity',
      priority: 'Low Priority',
      status: 'Needs investigation',
      title: 'West branch generates 18% higher revenue per employee',
      description: 'Analyze roster scheduling and commission structures in West branch to replicate across underperforming units.',
      branch: 'West Branch',
      topic: 'Productivity benchmarking',
      dateRange: 'Apr 2026 - May 2026',
      confidence: '91%',
      detailTitle: 'Cross-branch productivity optimization',
      department: 'Performance Intelligence',
      whatsHappening: 'West branch operates with optimized 10-hour rest intervals and targeted performance incentives, yielding 18% higher output per labor hour.',
      metrics: [
        { label: 'Rev per labor hour', val: '$148/hr', note: '+18% vs avg' },
        { label: 'Absenteeism rate', val: '1.8%', note: 'Lowest across units' },
        { label: 'Schedule efficiency', val: '94.2%', note: 'Demand-matched' },
        { label: 'Team capacity', val: '16 staff', note: 'Optimal staffing' }
      ]
    }
  ];

  // Filter list
  const filteredItems = attentionItems.filter(item => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Critical') return item.category === 'Critical';
    if (activeFilter === 'Need investigation') return item.category === 'Need investigation';
    if (activeFilter === 'Opportunity') return item.category === 'Opportunity';
    return true;
  });

  const selectedItem = attentionItems.find(item => item.id === selectedIssueId) || attentionItems[0];
  const selectedOption = decisionOptions.find(opt => opt.id === selectedOptionId) || decisionOptions[1];

  const handleExport = () => {
    alert('Generating and exporting comprehensive HR Intelligence Report (PDF / Excel)...');
  };

  const handleAskAi = (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    const query = aiQuery.trim();
    setAiQuery('');
    navigate('/assistant', { state: { initialPrompt: query } });
  };

  // Trigger Left-Brain AI Diagnosis
  const handleRunAiDiagnosis = async () => {
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
    setIsGeneratingOptions(true);
    try {
      const options = await generateDecisionOptions(selectedItem);
      if (options && options.length > 0) {
        setDecisionOptions(options);
      }
    } catch (err) {
      alert(`Options generator error: ${err.message}`);
    } finally {
      setIsGeneratingOptions(false);
    }
  };

  // Deploy Action to Layer 7 Execution Engine
  const handleDeployAction = () => {
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
            <button className="hr-date-btn hr-date-btn-shadow" onClick={() => alert('Change date range')} style={{ background: '#fff', height: '36px' }}>
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
                    <span>Left Brain: Management Diagnostic Rules Active</span>
                  </span>
                  <span className="hr-brain-pill-right" title="Company Digital Profile">
                    <Building2 size={13} />
                    <span>Right Brain: 32 Employees • 4 Branches Synced</span>
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
            {kpiMetrics.map((kpi) => (
              <div key={kpi.id} className="hr-kpi-card">
                <div className="hr-kpi-top">
                  <span className="hr-kpi-label">{kpi.title}</span>
                  <div className={`hr-kpi-icon-pill ${kpi.colorClass}`}>
                    {kpi.icon}
                  </div>
                </div>
                <div className="hr-kpi-val">{kpi.value}</div>
                <div className="hr-kpi-trend">
                  <ArrowUpRight size={14} />
                  <span>{kpi.trend.split(' ')[0]}</span>
                  <span className="hr-kpi-trend-sub"> {kpi.trend.substring(kpi.trend.indexOf(' '))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Prompt Pill & HR Health Score Card */}
        <div className="hr-top-right-column">
          {/* AI Search / Prompt Pill */}
          <form className="hr-ai-ask-pill" onSubmit={handleAskAi}>
            <div className="hr-ai-avatar">
              <img src={botLogo} alt="AI Bot" style={{ width: '110%', height: '110%', objectFit: 'contain' }} />
            </div>
            <input
              type="text"
              className="hr-ai-input-text"
              placeholder="Ask anything (e.g. Why is attrition increasing?)..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%' }}
            />
          </form>

          {/* HR Health Score Dark Card */}
          <div className="hr-health-score-card">
            <div className="hr-health-header">
              <span className="hr-health-title">HR Health Score</span>
              <span className="hr-health-badge">Healthy</span>
            </div>
            <div className="hr-health-value">82%</div>
            <div className="hr-health-footer">
              <TrendingUp size={14} />
              <span>3 areas need attention</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split Grid: Left (Management Attention) & Right (Investigation Detail) */}
      <div className="hr-split-grid">
        {/* Left Column: Management Attention */}
        <div className="hr-attention-column">
          <div className="hr-attention-header-card">
            <div className="hr-attention-title-row">
              <h3 className="hr-attention-title">Management Attention</h3>
              <button className="hr-date-btn hr-date-btn-small">
                <Calendar size={14} color="#64748b" />
                <span style={{ color: '#0f172a', fontWeight: '500' }}>01-30 Sep 2026</span>
                <ChevronDown size={14} color="#64748b" />
              </button>
            </div>
            <p className="hr-attention-desc">
              Payroll ratio has increased from 12% to 18% (+6 pp) while revenue has declined by 8% over the last 3 months.
            </p>

            {/* Filter Pills Row */}
            <div className="hr-filter-row">
              <div className="hr-filter-pills">
                <button
                  className={`hr-filter-pill ${activeFilter === 'All' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('All')}
                >
                  All (3)
                </button>
                <button
                  className={`hr-filter-pill ${activeFilter === 'Critical' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('Critical')}
                >
                  <span className="hr-dot hr-dot-red"></span>
                  Critical (1)
                </button>
                <button
                  className={`hr-filter-pill ${activeFilter === 'Need investigation' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('Need investigation')}
                >
                  <span className="hr-dot hr-dot-yellow"></span>
                  Need investigation (1)
                </button>
                <button
                  className={`hr-filter-pill ${activeFilter === 'Opportunity' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('Opportunity')}
                >
                  <span className="hr-dot hr-dot-green"></span>
                  Opportunity (1)
                </button>
              </div>
              <button className="hr-filter-icon-btn-borderless" title="Filter settings">
                <Filter size={16} />
              </button>
            </div>
          </div>

          {/* Attention Cards List */}
          <div className="hr-issue-cards-list">
            {filteredItems.map((item) => {
              const isSelected = selectedIssueId === item.id;
              const isHigh = item.priority === 'High Priority';
              return (
                <div
                  key={item.id}
                  className={`hr-issue-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedIssueId(item.id);
                    setDeploymentSuccess(false);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="hr-issue-card-tags">
                    <span className={`hr-priority-tag ${isHigh ? 'hr-priority-high' : 'hr-priority-low'}`}>
                      ● {item.priority}
                    </span>
                    <span className="hr-status-badge-outline">{item.status}</span>
                  </div>

                  <h4 className="hr-issue-card-title">{item.title}</h4>
                  <p className="hr-issue-card-desc">{item.description}</p>

                  <div className="hr-issue-card-meta">
                    <div className="hr-meta-item">
                      <Building2 size={13} />
                      <span>{item.branch}</span>
                    </div>
                    <div className="hr-meta-item">
                      <ShieldAlert size={13} />
                      <span>{item.topic}</span>
                    </div>
                    <div className="hr-meta-item">
                      <Calendar size={13} />
                      <span>{item.dateRange}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Investigation View */}
        <div className="hr-detail-card">
          {/* Top Bar inside Detail */}
          <div className="hr-detail-top-nav">
            <button className="hr-back-btn" onClick={() => setActiveFilter('All')}>
              <ArrowLeft size={14} />
              <span>Back to list</span>
            </button>
            <span className="hr-status-badge-outline" style={{ padding: '3px 12px' }}>
              Needs investigation
            </span>
          </div>

          {/* Title & Metadata */}
          <div>
            <h2 className="hr-detail-title">{selectedItem.detailTitle}</h2>
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
            <span className="hr-priority-tag hr-priority-high">● High Priority</span>
            <span className="hr-confidence-badge">Confidence: {selectedItem.confidence}</span>
          </div>

          {/* Navigation Tabs */}
          <div className="hr-tabs-container">
            {['Overview', 'Evidence', 'Possible Causes', 'Options', 'Decision & Actions', 'Outcome'].map((tab) => (
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
                <p className="hr-section-paragraph">{selectedItem.whatsHappening}</p>

                {/* 4 Callout Metric Boxes */}
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
              </div>

              {/* Section 2: "Why does it matter?" */}
              <div style={{ marginTop: '8px', padding: '0 4px' }}>
                <h4 className="hr-section-header-title" style={{ marginBottom: '16px' }}>Why does it matter?</h4>
                <div className="hr-impact-cards-grid">
                  <div className="hr-impact-text-block">
                    <div className="hr-impact-card-header">
                      <Target size={18} color="#f97316" />
                      <span>Workforce continuity</span>
                    </div>
                    <p className="hr-impact-card-p">
                      Unplanned shift overlap and vacancies impact labor economics and team delivery.
                    </p>
                  </div>

                  <div className="hr-impact-text-block">
                    <div className="hr-impact-card-header">
                      <AlertTriangle size={18} color="#ef4444" />
                      <span>Operating margin impact</span>
                    </div>
                    <p className="hr-impact-card-p">
                      Payroll surge (+6 pp) directly erodes EBITDA if not counterbalanced by schedule realignment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Evidence */}
          {activeTab === 'Evidence' && (
            <div className="hr-tab-content">
              <div className="hr-section-box">
                <h4 className="hr-section-header-title" style={{ marginBottom: '16px' }}>Key Telemetry Evidence (Right Brain)</h4>

                <div className="hr-evidence-list">
                  <div className="hr-evidence-item">
                    <div className="hr-evidence-text">
                      <div className="hr-evidence-title">Exit interview feedback telemetry</div>
                      <div className="hr-evidence-desc">9 of 14 employees cited compensation vs regional benchmark</div>
                    </div>
                    <div className="hr-evidence-record-pill">9 records</div>
                  </div>

                  <div className="hr-evidence-item">
                    <div className="hr-evidence-text">
                      <div className="hr-evidence-title">Departmental overtime concentration</div>
                      <div className="hr-evidence-desc">Retail Ops: 68% of overtime · West Branch: 22% · HQ: 10%</div>
                    </div>
                    <div className="hr-evidence-icon-circle">
                      <BarChart2 size={16} />
                    </div>
                  </div>

                  <div className="hr-evidence-item">
                    <div className="hr-evidence-text">
                      <div className="hr-evidence-title">Schedule overlap analysis</div>
                      <div className="hr-evidence-desc">32 shift handovers had unbudgeted 30-min double-staffing</div>
                    </div>
                    <div className="hr-evidence-icon-circle">
                      <ClipboardList size={16} />
                    </div>
                  </div>

                  <div className="hr-evidence-item">
                    <div className="hr-evidence-text">
                      <div className="hr-evidence-title">Payroll ratio vs Revenue</div>
                      <div className="hr-evidence-desc">Revenue down 8% while payroll rose 14% ($42.6k overtime delta)</div>
                    </div>
                    <div className="hr-evidence-icon-circle">
                      <Wallet size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Possible Causes (Left Brain AI Diagnosis) */}
          {activeTab === 'Possible Causes' && (
            <div className="hr-tab-content">
              <div className="hr-section-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h4 className="hr-section-header-title" style={{ margin: 0 }}>
                      Left-Brain Root Cause Diagnosis
                    </h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Diagnostic tree evaluating traffic, shift fatigue, compensation & manager factors
                    </span>
                  </div>
                  <button
                    onClick={handleRunAiDiagnosis}
                    disabled={isDiagnosing}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isDiagnosing ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sparkles size={13} color="#0ca678" />
                    <span>{isDiagnosing ? 'Reasoning...' : 'Run Left-Brain AI Diagnosis'}</span>
                  </button>
                </div>

                <div className="hr-causes-list">
                  {rootCauses.map((cause, idx) => (
                    <div key={idx} className="hr-cause-item">
                      <div className="hr-cause-icon-wrapper">
                        <AlertCircle size={16} strokeWidth={2.5} />
                      </div>
                      <div className="hr-cause-text">
                        <div className="hr-cause-title">{cause.title}</div>
                        <div className="hr-cause-desc">{cause.description}</div>
                        {cause.evidence && (
                          <div style={{ fontSize: '11px', color: '#0ca678', marginTop: '4px', fontWeight: 500 }}>
                            Evidence: {cause.evidence}
                          </div>
                        )}
                      </div>
                      <div className={`hr-cause-confidence ${cause.confidence.toLowerCase().includes('high') ? 'high-confidence' : 'medium-confidence'}`}>
                        {cause.confidence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Options (Layer 6 Decision Engine) */}
          {activeTab === 'Options' && (
            <div className="hr-tab-content">
              <div className="hr-section-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h4 className="hr-section-header-title" style={{ margin: 0 }}>
                      Layer 6: Structured Decision Options
                    </h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Select an option below to approve it for execution. Human management retains approval authority.
                    </span>
                  </div>
                  <button
                    onClick={handleRegenerateOptions}
                    disabled={isGeneratingOptions}
                    style={{
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isGeneratingOptions ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RotateCw size={12} className={isGeneratingOptions ? 'spin' : ''} />
                    <span>{isGeneratingOptions ? 'Generating...' : 'Regenerate Options'}</span>
                  </button>
                </div>

                <div className="hr-options-grid">
                  {decisionOptions.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`hr-option-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedOptionId(opt.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div className="hr-option-badge">{opt.badge}</div>
                          {isSelected && (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#0ca678', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle2 size={13} /> Selected Decision
                            </span>
                          )}
                        </div>

                        <div className="hr-option-title">{opt.title}</div>
                        <div className="hr-option-desc">{opt.description}</div>

                        <div className="hr-option-tags">
                          <span className="hr-option-tag" style={{ color: '#0ca678', fontWeight: 600, background: '#e6fcf5' }}>
                            {opt.impact}
                          </span>
                          <span className="hr-option-tag">Effort: {opt.effort}</span>
                          <span className="hr-option-tag">Risk: {opt.risk}</span>
                        </div>

                        <button
                          type="button"
                          className={`hr-option-select-btn ${isSelected ? 'active' : 'inactive'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOptionId(opt.id);
                          }}
                        >
                          {isSelected ? (
                            <>
                              <Check size={14} /> Approved as Management Action
                            </>
                          ) : (
                            'Select this Decision Option'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Decision & Actions (Layer 7 Action & Execution Engine) */}
          {activeTab === 'Decision & Actions' && (
            <div className="hr-tab-content">
              <div className="hr-section-box">
                <h4 className="hr-section-header-title">Layer 7: Action & Execution Deployment</h4>
                <div className="hr-next-step-desc">
                  Convert the approved decision into monitored execution tasks with responsible owner and deadline.
                </div>
                <div className="hr-next-step-info">
                  <Info size={16} />
                  <span>Human approval confirmed. Ready to deploy into AI Task Queue.</span>
                </div>

                {deploymentSuccess && (
                  <div className="hr-toast-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} />
                      <span>Action plan deployed to AI Execution Queue successfully!</span>
                    </div>
                    <button
                      onClick={() => navigate('/tasks')}
                      style={{
                        background: '#0ca678',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      View in AI Tasks →
                    </button>
                  </div>
                )}

                {/* Approved Decision Preview */}
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Approved Management Decision
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                    {selectedOption.badge}: {selectedOption.title}
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                    {selectedOption.description}
                  </p>
                </div>

                {/* Execution Form */}
                <div className="hr-action-form-box">
                  <div className="hr-action-form-grid">
                    <div className="hr-form-group">
                      <label className="hr-form-label">Responsible Person (Owner)</label>
                      <select
                        className="hr-form-select"
                        value={actionOwner}
                        onChange={(e) => setActionOwner(e.target.value)}
                      >
                        <option value="HR Director">HR Director (Executive)</option>
                        <option value="Retail Operations Lead">Retail Operations Lead</option>
                        <option value="Branch Manager - West">Branch Manager - West</option>
                        <option value="Finance Controller">Finance Controller</option>
                      </select>
                    </div>

                    <div className="hr-form-group">
                      <label className="hr-form-label">Implementation Deadline</label>
                      <select
                        className="hr-form-select"
                        value={actionDeadline}
                        onChange={(e) => setActionDeadline(e.target.value)}
                      >
                        <option value="7 Days">7 Days (Fast turnaround)</option>
                        <option value="14 Days (Recommended)">14 Days (Recommended)</option>
                        <option value="30 Days">30 Days</option>
                        <option value="60 Days">60 Days</option>
                      </select>
                    </div>

                    <div className="hr-form-group">
                      <label className="hr-form-label">Target Metric (KPI)</label>
                      <input
                        type="text"
                        className="hr-form-input"
                        value={actionKpi}
                        onChange={(e) => setActionKpi(e.target.value)}
                        placeholder="e.g. Reduce Payroll Ratio to 14.5%"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      type="button"
                      className="hr-deploy-btn"
                      onClick={handleDeployAction}
                    >
                      <Play size={14} fill="#ffffff" />
                      <span>Deploy Action Plan to Execution Engine</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Outcome (Organisational Learning Loop) */}
          {activeTab === 'Outcome' && (
            <div className="hr-tab-content">
              <div className="hr-section-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <BrainCircuit size={18} color="#0ca678" />
                  <h4 className="hr-section-header-title" style={{ margin: 0 }}>
                    Organisational Learning Loop (Decision Memory)
                  </h4>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  The 3rd intelligence layer beyond Left and Right Brain: what has historically worked or failed for this company.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#0ca678', background: '#e6fcf5', padding: '2px 8px', borderRadius: '10px' }}>
                        30-Day Result Verified
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sep 2026 Audit</span>
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: '4px 0' }}>
                      Previous Action: Shift Overlap Restructure in West Branch
                    </h4>
                    <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                      Eliminated 20-minute double staffing between afternoon and evening retail shifts. Payroll ratio decreased from 17.8% to 14.1% with zero drop in customer satisfaction or sales volume.
                    </p>
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '11.5px', color: '#166534', fontWeight: 500 }}>
                      ✓ Stored Company Learning: "Retail branches with over 15 staff must maintain max 10% shift overlap to avoid payroll ratio divergence."
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      Current Cycle: Awaiting 30-Day Outcome Verification
                    </div>
                    <p style={{ fontSize: '11.5px', color: '#64748b', margin: '4px 0 0 0' }}>
                      Upon completion of the deployed action plan, performance metrics will automatically be evaluated and permanently stored as company-specific intelligence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
