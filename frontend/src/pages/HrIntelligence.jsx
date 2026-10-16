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
  const [selectedIssueId, setSelectedIssueId] = useState('att-1');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('Overview');
  const [dateRange, setDateRange] = useState('01-30 Sep 2026');
  const [aiQuery, setAiQuery] = useState('');

  // Floating AI Chat Copilot popup
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Hello! I am your Brynex AI Workforce Intelligence Copilot powered by Claude. Ask me about your workforce metrics, shift rosters, or labor expenditure.'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Live dynamic analysis state from uploaded dataset
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);

  // Left-Brain AI Diagnosis State
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

  // Baseline templates matching the Figma design faithfully
  const defaultAttentionItems = [
    {
      id: 'att-1',
      category: 'Critical',
      priority: 'High Priority',
      title: 'Employee attrition rate increased to 7.8%',
      description: 'Attrition rate increased to 7.8% against a 5% target. Higher exits in sales and retail teams may affect workforce stability and increase recruitment costs.',
      branch: 'All branches',
      department: 'Sales & Retail',
      topic: 'Employee Retention & Attrition',
      dateRange: 'Apr 2026 - May 2026',
      confidence: '79%',
      status: 'Needs investigation',
      whatsHappening: "Employee attrition has increased from 5% to 7.8%, exceeding the company's target by 2.8 percentage points. Sales and retail teams account for a larger share of recent exits.",
      metrics: [
        { label: 'Current attrition', val: '7.8%', note: '+2.8 pp vs target', hasDownArrow: false },
        { label: 'Target', val: '5.0%', note: 'HR benchmark', hasDownArrow: true },
        { label: 'Employees exited', val: '14', note: 'Illustrative count', hasDownArrow: false },
        { label: 'Most affected team', val: 'Sales', note: 'Highest department rate', hasDownArrow: false }
      ],
      evidence: [
        { title: 'Notice Submissions in Retail Sales', desc: 'Frontline store staff voluntary terminations accelerated over last 60 days.', record: '14 Recorded Exits' },
        { title: 'Shift Schedule Overlap Fatigue', desc: 'Closing shifts followed by next-day opening shifts logged across Central & West stores.', record: '34 Close-Open Rotations' },
        { title: 'Overtime Compensation vs Revenue', desc: 'Labor costs rose 18% while branch revenue contracted 8% over last quarter.', record: '18.2% Payroll Ratio' }
      ],
      possibleCauses: [
        {
          title: 'Consecutive evening closing and morning opening shift rotations',
          confidence: 'High Confidence (86%)',
          description: 'Frontline floor staff scheduled for late closing shifts followed immediately by opening shifts without mandated 10-hour rest intervals, triggering burnout.',
          evidence: '34 instances of sub-8-hour rest intervals logged in Central Store attendance roster.'
        },
        {
          title: 'Uncompetitive retail variable commission band',
          confidence: 'Medium Confidence (74%)',
          description: 'Quarterly sales targets recalibrated +15% without adjusting base commission steps, reducing average monthly variable bonus by 22%.',
          evidence: 'Sales department compensation divergence identified in payroll audit.'
        }
      ],
      decisionOptions: [
        {
          id: 'opt-1',
          badge: 'Option A (Recommended)',
          title: 'Mandate 11-Hour Shift Rest Rostering Rule',
          description: 'Enforce automated shift scheduling validation preventing consecutive close-open shift rotations across all retail locations.',
          impact: 'Expected +14% retention recovery within 30 days with minimal schedule disruption.'
        },
        {
          id: 'opt-2',
          badge: 'Option B',
          title: 'Recalibrate Frontline Sales Incentive Band',
          description: 'Adjust Tier-1 commission threshold to reward consistent store-level deal velocity and prevent floor staff churn.',
          impact: 'Re-aligns earnings with peer benchmarks; estimated +$16k monthly payroll adjustment.'
        },
        {
          id: 'opt-3',
          badge: 'Option C',
          title: 'Establish Cross-Branch Rotation Relievers',
          description: 'Deploy floating senior floor staff between Central and West stores during high-traffic weekend shifts.',
          impact: 'Relieves shift pressure immediately with zero budget expansion.'
        }
      ]
    },
    {
      id: 'att-2',
      category: 'Need investigation',
      priority: 'High Priority',
      title: 'Higher than expected attrition in frontline roles',
      description: 'People costs are rising 18% while revenue has declined 8% over the last 3 months. This may impact profitability and requires investigation across payroll, sales and scheduling.',
      branch: 'Central Store',
      department: 'Retail Operations',
      topic: 'Cost efficiency',
      dateRange: 'Apr 2026 - May 2026',
      confidence: '84%',
      status: 'Needs investigation',
      whatsHappening: 'Frontline retail labor expenses have outpaced store productivity, with overtime expenditure rising 18% while footfall-to-conversion declined.',
      metrics: [
        { label: 'Payroll Expansion', val: '18.2%', note: '+6.2 pp above budget', hasDownArrow: true },
        { label: 'Store Footfall Conversion', val: '14.1%', note: 'Target 18.0%', hasDownArrow: false },
        { label: 'Overtime Hours Logged', val: '286 hrs', note: 'Central Store peak', hasDownArrow: false },
        { label: 'Target Ratio', val: '12.0%', note: 'Enterprise standard', hasDownArrow: false }
      ],
      evidence: [
        { title: 'Store Shift Log Telemetry', desc: 'High frequency of overtime hours logged during weekday evening shifts.', record: '286.4 Total Hours' },
        { title: 'Footfall vs Staffing Ratio', desc: 'Over-staffing during low-traffic afternoon hours and under-staffing during peak evening surges.', record: 'Shift Misalignment' }
      ],
      possibleCauses: [
        {
          title: 'Shift schedule misalignment with customer traffic curves',
          confidence: 'High Confidence (88%)',
          description: 'Static shift rosters fail to dynamically scale with hourly store visitor traffic, generating unproductive labor hours.',
          evidence: 'POS footfall data reveals 42% of sales occur in a 3-hour evening window with equal staffing across the 10-hour day.'
        }
      ],
      decisionOptions: [
        {
          id: 'opt-2-1',
          badge: 'Option A (Recommended)',
          title: 'Dynamic Traffic-Weighted Shift Rostering',
          description: 'Align shift start times with peak hourly footfall patterns to eliminate unproductive daytime overtime.',
          impact: 'Saves $14.2k/month in overtime costs while increasing peak-hour coverage.'
        }
      ]
    },
    {
      id: 'att-3',
      category: 'Opportunity',
      priority: 'Low Priority',
      title: 'Higher than expected attrition in frontline roles',
      description: 'Shift schedule efficiency in West Branch shows 98.4% attendance with balanced 4-day rotations.',
      branch: 'West Branch',
      department: 'Workforce Scheduling',
      topic: 'Operational Efficiency',
      dateRange: 'Apr 2026 - May 2026',
      confidence: '92%',
      status: 'Needs investigation',
      whatsHappening: 'West Branch has achieved industry-leading attendance and lowest turnover through structured 4-day on, 3-day off rotational schedules.',
      metrics: [
        { label: 'Turnover Rate', val: '3.2%', note: 'Industry best-practice', hasDownArrow: false },
        { label: 'Attendance Rate', val: '98.4%', note: 'Consistently high', hasDownArrow: false },
        { label: 'Store Conversion', val: '18.6%', note: '+4.5 pp vs Central', hasDownArrow: false },
        { label: 'Staff Satisfaction', val: '92/100', note: 'Quarterly pulse', hasDownArrow: false }
      ],
      evidence: [
        { title: 'Attendance Logs in West Branch', desc: 'Consistently low tardiness and near-zero unscheduled absences over 90 days.', record: '98.4% Attendance' }
      ],
      possibleCauses: [
        {
          title: 'Structured rotational shift schedules provide predictable rest cycles',
          confidence: 'High Confidence (94%)',
          description: 'Predictable scheduling gives staff adequate recovery time, directly suppressing burnout and absenteeism.',
          evidence: 'Zero sub-10-hour turnarounds logged in West Branch rosters.'
        }
      ],
      decisionOptions: [
        {
          id: 'opt-3-1',
          badge: 'Option A (Recommended)',
          title: 'Replicate West Branch Scheduling Template',
          description: 'Standardize Central Store shift schedules using the proven West Branch 4-day rotational template.',
          impact: 'Expected +12% attendance improvement and -$18k overtime cost reduction.'
        }
      ]
    }
  ];

  // Resolve attention items: Use live dataset items if available; otherwise use Figma baseline template
  const resolvedAttentionItems = (liveAnalysis?.attentionItems && liveAnalysis.attentionItems.length > 0)
    ? liveAnalysis.attentionItems
    : defaultAttentionItems;

  const resolvedKpiMetrics = (liveAnalysis?.kpiMetrics && liveAnalysis.kpiMetrics.length > 0)
    ? liveAnalysis.kpiMetrics
    : [
        { id: 'issues', title: 'Issues Detected', value: '3', trend: '3% vs previous 30 Days', trendPositive: true, colorClass: 'hr-kpi-icon-purple', icon: <Network size={14} /> },
        { id: 'decisions', title: 'Awaited Decisions', value: '2', trend: '3% vs previous 30 Days', trendPositive: true, colorClass: 'hr-kpi-icon-red', icon: <FileText size={14} /> },
        { id: 'monitored', title: 'Being Monitored', value: '1', trend: '2% vs previous 30 Days', trendPositive: true, colorClass: 'hr-kpi-icon-green', icon: <AppWindow size={14} /> },
        { id: 'opportunities', title: 'Opportunities', value: '2', trend: '3% vs previous 30 Days', trendPositive: true, colorClass: 'hr-kpi-icon-orange', icon: <UserCheck size={14} /> },
        { id: 'productivity', title: 'Avg. Productivity', value: '87%', trend: '3% vs last month', trendPositive: true, colorClass: 'hr-kpi-icon-blue', icon: <Activity size={14} /> }
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

  // Synchronize causes and options when selected issue changes
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
      const reply = data.success && data.message ? data.message : 'Telemetry synthesized. You can connect additional files in Data Management for deeper multi-source correlation.';
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

  // Trigger Left-Brain AI Diagnosis with Claude
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

  // Trigger Decision Engine Options Generation with Claude
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
      {/* 1. Page Header Row: Title, Breadcrumbs, Date & Export Actions */}
      <div className="hr-page-header-row">
        <div className="hr-page-title-area">
          <h1 className="hr-main-page-title">HR Intelligence</h1>
          <div className="hr-breadcrumbs">
            <span>AI Workspace</span>
            <span className="crumb-separator">&gt;</span>
            <span className="hr-breadcrumb-current">HR Intelligence</span>
          </div>
        </div>
        <div className="hr-page-header-actions">
          <button className="hr-date-btn hr-date-btn-shadow">
            <Calendar size={14} color="#64748b" />
            <span>{dateRange}</span>
            <ChevronDown size={14} color="#64748b" />
          </button>
          <button className="hr-export-btn hr-btn-shadow" onClick={handleExport}>
            <Download size={14} color="#64748b" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. Top Banner Grid: Hero Banner + AI Ask Pill & HR Health Score */}
      <div className="hr-top-banner-grid">
        {/* Left Banner Wrapper */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* Left Banner Card */}
          <div className="hr-welcome-banner" style={{ flex: 1 }}>
            <div className="hr-welcome-left">
              <div className="hr-banner-icon-wrapper">
                <Settings size={22} />
              </div>
              <div className="hr-banner-text">
                <h2>HR Intelligence</h2>
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
                      Right Brain: {liveAnalysis ? `${liveAnalysis.totalRecords || 35} Records Synced` : 'Enterprise Synced'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Background Illustration Graphic */}
            <div className="hr-banner-illustration">
              <img src={bannerImg} alt="Analytics graphic" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.8) translate(-1%, 10%)' }} />
            </div>
          </div>

          {/* Row of 5 Metric KPI Cards */}
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
        <div className="hr-top-right-column" style={{ paddingTop: '0' }}>
          {/* AI Search / Prompt Pill */}
          <form className="hr-ai-ask-pill" onSubmit={handleAskAi} onClick={() => !showChatPopup && setShowChatPopup(true)}>
            <div className="hr-ai-avatar">
              <img src={botLogo} alt="AI Bot" style={{ width: '110%', height: '110%', objectFit: 'contain' }} />
            </div>
            <input
              type="text"
              className="hr-ai-input-text"
              placeholder="Ask me anything about your business..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onFocus={() => setShowChatPopup(true)}
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%' }}
            />
          </form>

          {/* Floating Luxury Claude AI Copilot Modal */}
          {showChatPopup && (
            <div className="hr-inline-chat-popup">
              {/* Header */}
              <div className="hr-inline-chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="hr-inline-chat-avatar">
                    <img src={botLogo} alt="AI Bot" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', margin: 0, letterSpacing: '-0.2px' }}>
                      Claude AI Workforce Copilot
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }}></span>
                      <span style={{ fontSize: '10.5px', color: '#a7f3d0', fontWeight: '500' }}>Claude 3.5 Active</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="hr-chat-close-btn"
                    onClick={() => navigate('/assistant')}
                    title="Open Full Assistant Canvas"
                  >
                    <ArrowUpRight size={15} />
                  </button>
                  <button
                    type="button"
                    className="hr-chat-close-btn"
                    onClick={() => setShowChatPopup(false)}
                    title="Close"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Messages Body */}
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
                    <div className="hr-chat-msg-bubble hr-chat-typing-indicator">
                      <Sparkles size={13} color="#0ca678" />
                      <span>Claude is synthesizing workforce telemetry...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div className="hr-chat-quick-chips">
                <button
                  type="button"
                  className="hr-chat-chip"
                  onClick={() => {
                    const text = 'Why is retail sales attrition at 7.8%?';
                    setAiQuery(text);
                  }}
                >
                  Why is sales attrition at 7.8%?
                </button>
                <button
                  type="button"
                  className="hr-chat-chip"
                  onClick={() => {
                    const text = 'Explain payroll ratio divergence vs target';
                    setAiQuery(text);
                  }}
                >
                  Analyze payroll divergence
                </button>
                <button
                  type="button"
                  className="hr-chat-chip"
                  onClick={() => {
                    const text = 'Suggest optimal shift rest intervals';
                    setAiQuery(text);
                  }}
                >
                  Shift rest intervals
                </button>
              </div>

              {/* Input Dock */}
              <form className="hr-inline-chat-input-row" onSubmit={handleAskAi}>
                <div className="hr-chat-input-pill">
                  <input
                    type="text"
                    placeholder="Ask Claude a question..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="hr-chat-send-btn"
                  title="Send to Claude"
                  disabled={!aiQuery.trim() || isTyping}
                >
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
                {liveAnalysis?.healthStatus || 'Healthy'}
              </span>
            </div>
            <div className="hr-health-value">
              {liveAnalysis?.healthScore ? `${liveAnalysis.healthScore}%` : '82%'}
            </div>
            <div className="hr-health-footer">
              <TrendingUp size={14} />
              <span>
                {resolvedAttentionItems.length > 0 ? `${resolvedAttentionItems.length} areas need attention` : 'Live telemetry nominal'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split Grid (Faithful to Figma layout) */}
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
              {liveAnalysis?.attentionSummary || 'Payroll ratio has increased from 12% to 18% (+6 pp) while revenue has declined by 8% over the last 3 months.'}
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
              <button className="hr-filter-icon-btn-borderless" title="Filter settings">
                <Filter size={15} />
              </button>
            </div>
          </div>

          {/* List of Issue Cards */}
          <div className="hr-issue-cards-list">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`hr-issue-card ${selectedIssueId === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedIssueId(item.id)}
              >
                <div className="hr-issue-card-tags">
                  <span
                    className={`hr-priority-tag ${
                      item.priority?.includes('Low') ? 'hr-priority-low' : 'hr-priority-high'
                    }`}
                  >
                    ● {item.priority || 'High Priority'}
                  </span>
                  <span className="hr-status-badge-outline">{item.status || 'Needs investigation'}</span>
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
            ))}
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
              {selectedItem?.status || 'Needs investigation'}
            </span>
          </div>

          {/* Title & Metadata */}
          <div>
            <h2 className="hr-detail-title">{selectedItem?.title || 'Employee attrition rate increased to 7.8%'}</h2>
            <div className="hr-detail-meta-row" style={{ marginTop: '8px' }}>
              <div className="hr-meta-item">
                <Building2 size={14} />
                <span>{selectedItem?.branch || 'All branches'}</span>
              </div>
              <div className="hr-meta-item">
                <ShieldAlert size={14} />
                <span>{selectedItem?.topic || 'Employee Retention & Attrition'}</span>
              </div>
              <div className="hr-meta-item">
                <Calendar size={14} />
                <span>{selectedItem?.dateRange || 'Apr 2026 - May 2026'}</span>
              </div>
            </div>
          </div>

          {/* Priority & Confidence row */}
          <div className="hr-detail-badges-row">
            <span className="hr-priority-tag hr-priority-high">● {selectedItem?.priority || 'High Priority'}</span>
            <span className="hr-confidence-badge">Confidence: {selectedItem?.confidence || '79%'}</span>
          </div>

          {/* All 6 Navigation Tabs */}
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
              {/* "What's happening?" container */}
              <div className="hr-section-box">
                <h4 className="hr-section-header-title">What's happening?</h4>
                <p className="hr-section-paragraph">{selectedItem?.whatsHappening || selectedItem?.description}</p>

                {/* 4 Metric Highlight Boxes */}
                <div className="hr-four-metrics-grid">
                  {(selectedItem?.metrics || [
                    { label: 'Current attrition', val: '7.8%', note: '+2.8 pp vs target', hasDownArrow: false },
                    { label: 'Target', val: '5.0%', note: 'HR benchmark', hasDownArrow: true },
                    { label: 'Employees exited', val: '14', note: 'Illustrative count', hasDownArrow: false },
                    { label: 'Most affected team', val: 'Sales', note: 'Highest department rate', hasDownArrow: false }
                  ]).map((m, idx) => (
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

              {/* "Why does it matter?" container with 2 side-by-side impact cards */}
              <div className="hr-section-box">
                <h4 className="hr-section-header-title">Why does it matter?</h4>
                <div className="hr-impact-cards-grid">
                  <div className="hr-impact-card">
                    <div className="hr-impact-card-header">
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={14} />
                      </div>
                      <span>Workforce continuity</span>
                    </div>
                    <p className="hr-impact-card-p">
                      Vacancies and replacement periods may affect team capacity, training consistency, and retail service delivery.
                    </p>
                  </div>

                  <div className="hr-impact-card">
                    <div className="hr-impact-card-header">
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={14} />
                      </div>
                      <span>Business performance</span>
                    </div>
                    <p className="hr-impact-card-p">
                      Investigate whether turnover is affecting sales productivity, customer experience, or branch revenue targets.
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
                <h4 className="hr-section-header-title">Workforce Telemetry Evidence</h4>
                <p className="hr-section-paragraph">
                  Cross-correlated records linking employee turnover to shift overtime schedules and compensation benchmarks.
                </p>
                <div className="hr-evidence-list">
                  {(selectedItem?.evidence || [
                    { title: 'Notice Period Submissions in Sales', desc: 'Frontline store staff voluntary terminations accelerated over last 60 days.', record: '14 Recorded Exits' },
                    { title: 'Shift Schedule Overlap Fatigue', desc: 'Closing shifts followed by next-day opening shifts logged across Central & West stores.', record: '34 Close-Open Rotations' },
                    { title: 'Overtime Compensation vs Revenue', desc: 'Labor costs rose 18% while branch revenue contracted 8% over last quarter.', record: '18.2% Payroll Ratio' }
                  ]).map((ev, idx) => (
                    <div key={idx} className="hr-evidence-item">
                      <div>
                        <div className="hr-evidence-title">{ev.title}</div>
                        <div className="hr-evidence-desc">{ev.desc}</div>
                      </div>
                      <span className="hr-evidence-record-pill">{ev.record}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Possible Causes (Claude AI Diagnosis) */}
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
                    <span>{isDiagnosing ? 'Diagnosing with Claude...' : 'Run Live AI Diagnosis'}</span>
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
                        <div className="hr-cause-icon-wrapper">
                          <AlertCircle size={18} />
                        </div>
                        <div className="hr-cause-text">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span className="hr-cause-title">{cause.title}</span>
                            <span
                              className={`hr-cause-confidence ${
                                cause.confidence?.includes('High') ? 'high-confidence' : 'medium-confidence'
                              }`}
                            >
                              {cause.confidence}
                            </span>
                          </div>
                          <p className="hr-cause-desc">{cause.description}</p>
                          {cause.evidence && (
                            <div style={{ fontSize: '12px', color: '#0ca678', marginTop: '6px', fontWeight: 500 }}>
                              <strong>Evidence:</strong> {cause.evidence}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Options (Claude AI Decision Engine) */}
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
                    <span>{isGeneratingOptions ? 'Synthesizing with Claude...' : 'Generate AI Options'}</span>
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
                        style={{
                          cursor: 'pointer',
                          borderColor: selectedOptionId === opt.id ? '#0ca678' : '#e2e8f0',
                          boxShadow: selectedOptionId === opt.id ? '0 0 0 1.5px #0ca678' : 'none'
                        }}
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

          {/* Tab 5: Decision & Actions */}
          {activeTab === 'Decision & Actions' && (
            <div className="hr-tab-content">
              <div className="hr-section-box">
                <h4 className="hr-section-header-title">Layer 7 Action Execution</h4>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Deploy selected management decision to operational action items.
                </p>

                {selectedOption ? (
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', marginTop: '12px', border: '1px solid #e2e8f0' }}>
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
                    Select an option in the "Options" tab first.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 6: Outcome */}
          {activeTab === 'Outcome' && (
            <div className="hr-tab-content">
              <div className="hr-section-box">
                <h4 className="hr-section-header-title">Projected Stabilization & ROI Forecast</h4>
                <p className="hr-section-paragraph">
                  Estimated impact of implementing selected shift interval guidelines and commission alignments across sales and store operations.
                </p>

                <div className="hr-four-metrics-grid" style={{ marginTop: '12px' }}>
                  <div className="hr-mini-metric-tile">
                    <span className="hr-mini-metric-title">Target Attrition Rate</span>
                    <div className="hr-mini-metric-val">
                      <span style={{ color: '#10b981' }}>4.9%</span>
                      <ArrowDown size={14} color="#10b981" />
                    </div>
                    <span className="hr-mini-metric-note">-2.9 pp within 45 days</span>
                  </div>

                  <div className="hr-mini-metric-tile">
                    <span className="hr-mini-metric-title">Overtime Cost Reduction</span>
                    <div className="hr-mini-metric-val">
                      <span style={{ color: '#10b981' }}>-$18.5k</span>
                    </div>
                    <span className="hr-mini-metric-note">Monthly recurring savings</span>
                  </div>

                  <div className="hr-mini-metric-tile">
                    <span className="hr-mini-metric-title">Shift Attendance Index</span>
                    <div className="hr-mini-metric-val">
                      <span>97.8%</span>
                    </div>
                    <span className="hr-mini-metric-note">+10.8 pp improvement</span>
                  </div>

                  <div className="hr-mini-metric-tile">
                    <span className="hr-mini-metric-title">Staff Satisfaction Pulse</span>
                    <div className="hr-mini-metric-val">
                      <span>89/100</span>
                    </div>
                    <span className="hr-mini-metric-note">Projected pulse score</span>
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
