import React, { useState, useEffect } from 'react';
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
  X,
  Send
} from 'lucide-react';
import './HrIntelligence.css';

export default function HrIntelligence() {
  const [selectedIssueId, setSelectedIssueId] = useState(1);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('Overview');
  const [dateRange, setDateRange] = useState('01-30 Sep 2026');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiQuery, setAiQuery] = useState('');

  // Small floating chat screen state (appears as modal above health bar)
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Hello! I am your HR Assistant. Ask me about attrition rates, department productivity, or workforce costs.'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Live dynamic analysis state from uploaded file
  const [liveAnalysis, setLiveAnalysis] = useState(null);

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
      }
    };
    fetchAnalysis();
  }, []);

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
      title: 'Attrition rate increased to 7.8% against a 5% target.',
      description: 'Higher exits in sales and retail teams may affect workforce stability and increase recruitment costs.',
      branch: 'All branches',
      topic: 'Cost efficiency',
      dateRange: 'Apr 2026 - May 2026',
      confidence: '78%',
      detailTitle: 'Employee attrition rate increased to 7.8%',
      department: 'Employee Retention & Attrition',
      whatsHappening: "Employee attrition has increased from 5% to 7.8%, exceeding the company's target by 2.8 percentage points. Sales and retail teams account for a larger share of recent exits.",
      metrics: [
        { label: 'Current attrition', val: '7.8%', note: '+2.8 pp vs target' },
        { label: 'Target', val: '5.0%', note: 'HR benchmark', hasDownArrow: true },
        { label: 'Employees exited', val: '14', note: 'Illustrative count' },
        { label: 'Most affected team', val: 'Sales', note: 'Highest department rate' }
      ]
    },
    {
      id: 2,
      category: 'Need investigation',
      priority: 'High Priority',
      status: 'Needs investigation',
      title: 'Higher than expected attrition in frontline roles',
      description: 'People costs are rising 18% while revenue has declined 8% over the last 3 months. This may impact profitability and requires investigation across payroll, sales and scheduling.',
      branch: 'All branches',
      topic: 'Cost efficiency',
      dateRange: 'Apr 2026 - May 2026',
      confidence: '84%',
      detailTitle: 'Higher than expected attrition in frontline roles',
      department: 'Payroll & Scheduling Optimization',
      whatsHappening: 'Frontline workforce turnover has triggered a secondary spike in overtime and onboarding expenses across regional operations centers.',
      metrics: [
        { label: 'Current attrition', val: '8.4%', note: '+3.4 pp vs target' },
        { label: 'Target', val: '5.0%', note: 'HR benchmark', hasDownArrow: true },
        { label: 'Employees exited', val: '22', note: 'Frontline headcount' },
        { label: 'Most affected team', val: 'Retail Ops', note: 'Critical shift load' }
      ]
    },
    {
      id: 3,
      category: 'Opportunity',
      priority: 'Low Priority',
      status: 'Needs investigation',
      title: 'Higher than expected attrition in frontline roles',
      description: 'Review compensation bands and shift flexibility to retain high performers in retail customer service branches.',
      branch: 'All branches',
      topic: 'Workforce stability',
      dateRange: 'Apr 2026 - May 2026',
      confidence: '91%',
      detailTitle: 'Retention program optimization for frontline talent',
      department: 'Talent Retention Strategy',
      whatsHappening: 'Exit interviews indicate compensation satisfaction is 14% below industry benchmarks in tier-1 metropolitan branches.',
      metrics: [
        { label: 'Current attrition', val: '6.2%', note: '+1.2 pp vs target' },
        { label: 'Target', val: '5.0%', note: 'HR benchmark', hasDownArrow: true },
        { label: 'Employees exited', val: '8', note: 'Q2 frontline total' },
        { label: 'Most affected team', val: 'Support', note: 'Tier 1 Support' }
      ]
    }
  ];

  // Resolve active items and metrics from live analysis or fallback sample
  const resolvedKpiMetrics = liveAnalysis?.kpiMetrics ? liveAnalysis.kpiMetrics.map((kpi, idx) => ({
    ...kpi,
    icon: kpiMetrics[idx]?.icon || <Activity size={14} />
  })) : kpiMetrics;

  const resolvedAttentionItems = liveAnalysis?.attentionItems || attentionItems;

  // Filter list
  const filteredItems = resolvedAttentionItems.filter(item => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Critical') return item.category === 'Critical';
    if (activeFilter === 'Need investigation') return item.category === 'Need investigation';
    if (activeFilter === 'Opportunity') return item.category === 'Opportunity';
    return true;
  });

  const selectedItem = resolvedAttentionItems.find(item => item.id === selectedIssueId) || resolvedAttentionItems[0] || attentionItems[0];

  const handleExport = () => {
    alert('Generating and exporting comprehensive HR Intelligence Report (PDF / Excel)...');
  };

  const handleAskAi = (e) => {
    e?.preventDefault();
    if (!aiQuery.trim()) return;

    const userText = aiQuery.trim();
    setAiQuery('');
    setShowChatPopup(true);

    const userMsg = { id: Date.now(), sender: 'user', text: userText };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let replyText = `Cross-referencing connected workforce telemetry: Attrition is currently tracked at ${liveAnalysis?.attentionItems?.[0]?.metrics?.[0]?.val || '7.8%'}, with productivity at ${liveAnalysis?.kpiMetrics?.[4]?.value || '87%'}. Focus areas remain concentrated in ${liveAnalysis?.attentionItems?.[0]?.department || 'Sales & Operations'}.`;
      
      const lower = userText.toLowerCase();
      if (lower.includes('attrition') || lower.includes('exit')) {
        replyText = `Current attrition rate is ${liveAnalysis?.attentionItems?.[0]?.metrics?.[0]?.val || '7.8%'} vs ${liveAnalysis?.attentionItems?.[0]?.metrics?.[1]?.val || '5.0%'} target. Exit interviews cite compensation disparity and shift fatigue as primary drivers.`;
      } else if (lower.includes('attendance') || lower.includes('productivity') || lower.includes('shift')) {
        replyText = `Workforce attendance average is ${liveAnalysis?.kpiMetrics?.[4]?.value || '87%'}. Telemetry indicates shift coverage deficits in frontline operations with associated overtime surges.`;
      } else if (lower.includes('cost') || lower.includes('payroll') || lower.includes('salary')) {
        replyText = `People costs and overtime are currently elevated +14% relative to shift output. Potential savings of up to $42.6k projected through scheduling optimization.`;
      }

      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'assistant', text: replyText }
      ]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="hr-page-container">
      {/* 1. Top Section: Banner + AI Assistant & HR Health Score */}
      <div className="hr-top-banner-grid">
        {/* Left Banner Wrapper */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', paddingTop: '15px' }}>
          {/* Floating Actions overlapping the top border */}
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
                <h2>HR Intelligence</h2>
                <p>
                  Understand what's happening in your workforce, why it's happening, and what to do next.
                </p>
              </div>
            </div>

            <div className="hr-welcome-right">
              {/* Actions moved to page header */}
            </div>

            {/* Background Graphic */}
            <div className="hr-banner-illustration">
              <img src={bannerImg} alt="Analytics graphic" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.8) translate(-1%, 10%)' }} />
            </div>
          </div>

          {/* 2. Row of 5 Metric KPI Cards (Moved into Left Column) */}
          <div className="hr-metrics-grid" style={{ marginTop: '12px' }}>
            {resolvedKpiMetrics.map((kpi) => (
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

          {/* Small Floating Chat Screen - Appears as a sleek modal anchored above the health bar without altering layout */}
          {showChatPopup && (
            <div className="hr-inline-chat-popup">
              <div className="hr-inline-chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="hr-inline-chat-avatar">
                    <img src={botLogo} alt="AI Bot" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', margin: 0 }}>HR Assistant</h4>
                    <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: '500' }}>● Live Intelligence</span>
                  </div>
                </div>

                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: '2px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChatPopup(false);
                  }}
                  title="Close chat"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Chat Message Scroll */}
              <div className="hr-inline-chat-body">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`hr-inline-msg-bubble ${msg.sender}`}>
                    {msg.text}
                  </div>
                ))}
                {isTyping && (
                  <div className="hr-inline-msg-bubble assistant typing">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                )}
              </div>

              {/* Quick Prompts */}
              <div className="hr-inline-quick-prompts">
                <button
                  type="button"
                  onClick={() => {
                    setAiQuery('Why is attrition increasing?');
                    setTimeout(() => handleAskAi(), 50);
                  }}
                >
                  Attrition root-causes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAiQuery('Which department has productivity gaps?');
                    setTimeout(() => handleAskAi(), 50);
                  }}
                >
                  Productivity gaps
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAiQuery('Analyze overtime and payroll');
                    setTimeout(() => handleAskAi(), 50);
                  }}
                >
                  Overtime vs payroll
                </button>
              </div>

              {/* Interactive Input Dock inside Chat */}
              <form
                className="hr-inline-chat-input-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskAi(e);
                }}
              >
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

          {/* HR Health Score Dark Card */}
          <div className="hr-health-score-card">
            <div className="hr-health-header">
              <span className="hr-health-title">HR Health Score</span>
              <span className="hr-health-badge">
                {liveAnalysis?.healthStatus || 'Healthy'}
              </span>
            </div>
            <div className="hr-health-value">
              {liveAnalysis?.healthScore || '82%'}
            </div>
            <div className="hr-health-footer">
              <TrendingUp size={14} />
              <span>
                {liveAnalysis?.attentionItems?.length || 3} areas need attention
              </span>
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
              {liveAnalysis?.attentionSummary || (liveAnalysis?.fileScope?.includes('Attendance')
                ? `Workforce attendance is currently tracked across ${liveAnalysis?.totalRecords || 146} employee records with ${resolvedAttentionItems.filter(i => i.category === 'Critical').length} critical shift deficits.`
                : 'Payroll ratio has increased from 12% to 18% (+6 pp) while revenue has declined by 8% over the last 3 months.')}
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
                  Critical ({resolvedAttentionItems.filter(i => i.category === 'Critical').length})
                </button>
                <button
                  className={`hr-filter-pill ${activeFilter === 'Need investigation' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('Need investigation')}
                >
                  <span className="hr-dot hr-dot-yellow"></span>
                  Need investigation ({resolvedAttentionItems.filter(i => i.category === 'Need investigation').length})
                </button>
                <button
                  className={`hr-filter-pill ${activeFilter === 'Opportunity' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('Opportunity')}
                >
                  <span className="hr-dot hr-dot-green"></span>
                  Opportunity ({resolvedAttentionItems.filter(i => i.category === 'Opportunity').length})
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
                  onClick={() => setSelectedIssueId(item.id)}
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

        {/* Right Column: Detailed Investigation View (738 width) */}
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

          {/* Navigation Tabs (738 Fill x 31 Hug) */}
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

          {/* Tab Contents */}
          {activeTab === 'Overview' && (
            <div className="hr-tab-content">
              {/* Section 1: "What's happening?" */}
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
                      Vacancies and replacement periods may affect team capacity and service delivery.
                    </p>
                  </div>

                  <div className="hr-impact-text-block">
                    <div className="hr-impact-card-header">
                      <AlertTriangle size={18} color="#ef4444" />
                      <span>Business performance</span>
                    </div>
                    <p className="hr-impact-card-p">
                      Investigate whether turnover is affecting sales productivity, customer experience or branch targets.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Evidence' && (
            <div className="hr-tab-content">
              <div className="hr-section-box">
                <h4 className="hr-section-header-title" style={{ marginBottom: '16px' }}>Key evidence</h4>

                <div className="hr-evidence-list">
                  <div className="hr-evidence-item">
                    <div className="hr-evidence-text">
                      <div className="hr-evidence-title">Exit interview feedback</div>
                      <div className="hr-evidence-desc">7 of 14 cited career growth</div>
                    </div>
                    <div className="hr-evidence-record-pill">7 records</div>
                  </div>

                  <div className="hr-evidence-item">
                    <div className="hr-evidence-text">
                      <div className="hr-evidence-title">Department attrition</div>
                      <div className="hr-evidence-desc">Sales: 12.4% · Retail: 10.8% · Others: 3.2%</div>
                    </div>
                    <div className="hr-evidence-icon-circle">
                      <BarChart2 size={16} />
                    </div>
                  </div>

                  <div className="hr-evidence-item">
                    <div className="hr-evidence-text">
                      <div className="hr-evidence-title">Engagement survey</div>
                      <div className="hr-evidence-desc">Overall score decreased from 78% to 71%</div>
                    </div>
                    <div className="hr-evidence-icon-circle">
                      <ClipboardList size={16} />
                    </div>
                  </div>

                  <div className="hr-evidence-item">
                    <div className="hr-evidence-text">
                      <div className="hr-evidence-title">Payroll & overtime</div>
                      <div className="hr-evidence-desc">Overtime cost increased by 18%</div>
                    </div>
                    <div className="hr-evidence-icon-circle">
                      <Wallet size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Possible Causes' && (
            <div className="hr-tab-content">
              <div className="hr-section-box">
                <h4 className="hr-section-header-title" style={{ marginBottom: '16px' }}>Possible Causes</h4>

                <div className="hr-causes-list">
                  <div className="hr-cause-item">
                    <div className="hr-cause-icon-wrapper">
                      <AlertCircle size={16} strokeWidth={2.5} />
                    </div>
                    <div className="hr-cause-text">
                      <div className="hr-cause-title">Limited career growth</div>
                      <div className="hr-cause-desc">Exit feedback may indicate limited promotion or internal mobility opportunities.</div>
                    </div>
                    <div className="hr-cause-confidence high-confidence">High Confidence</div>
                  </div>

                  <div className="hr-cause-item">
                    <div className="hr-cause-icon-wrapper">
                      <AlertCircle size={16} strokeWidth={2.5} />
                    </div>
                    <div className="hr-cause-text">
                      <div className="hr-cause-title">Compensation concerns</div>
                      <div className="hr-cause-desc">Compare salary, incentives and pay progression with internal role structures.</div>
                    </div>
                    <div className="hr-cause-confidence medium-confidence">Medium Confidence</div>
                  </div>

                  <div className="hr-cause-item">
                    <div className="hr-cause-icon-wrapper">
                      <AlertCircle size={16} strokeWidth={2.5} />
                    </div>
                    <div className="hr-cause-text">
                      <div className="hr-cause-title">Limited career growth</div>
                      <div className="hr-cause-desc">Exit feedback may indicate limited promotion or internal mobility opportunities.</div>
                    </div>
                    <div className="hr-cause-confidence high-confidence">High Confidence</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Options' && (
            <div className="hr-tab-content">
              <div className="hr-section-box">
                <h4 className="hr-section-header-title" style={{ marginBottom: '16px' }}>Management Options</h4>

                <div className="hr-options-grid">
                  <div className="hr-option-card">
                    <div className="hr-option-badge">Option A</div>
                    <div className="hr-option-title">Improve career growth and internal mobility</div>
                    <div className="hr-option-desc">Define career paths, review promotion opportunities and establish development plans for eligible employees.</div>
                    <div className="hr-option-tags">
                      <span className="hr-option-tag">Impact: Potentially high</span>
                      <span className="hr-option-tag">Effort: Medium</span>
                      <span className="hr-option-tag">Risk: Low</span>
                    </div>
                  </div>

                  <div className="hr-option-card">
                    <div className="hr-option-badge">Option B</div>
                    <div className="hr-option-title">Review workload and team structure</div>
                    <div className="hr-option-desc">Analyse overtime, shift coverage and role expectations in departments with higher attrition.</div>
                    <div className="hr-option-tags">
                      <span className="hr-option-tag">Impact: medium</span>
                      <span className="hr-option-tag">Effort: Medium</span>
                      <span className="hr-option-tag">Risk: Low</span>
                    </div>
                  </div>

                  <div className="hr-option-card">
                    <div className="hr-option-badge">Option A</div>
                    <div className="hr-option-title">Review compensation and incentives</div>
                    <div className="hr-option-desc">Compare pay structures and incentive criteria for affected roles before considering changes.</div>
                    <div className="hr-option-tags">
                      <span className="hr-option-tag">Impact: To be assessed</span>
                      <span className="hr-option-tag">Effort: High</span>
                      <span className="hr-option-tag">Risk: Medium</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'Decision & Actions' || activeTab === 'Outcome') && (
            <div className="hr-tab-content">
              <div className="hr-section-box">
                <h4 className="hr-section-header-title" style={{ marginBottom: '16px' }}>Next Step</h4>
                <div className="hr-next-step-desc">Validate the causes and select an appropriate management action.</div>
                <div className="hr-next-step-info">
                  <Info size={16} />
                  <span>Human approval required for consequential employment decisions.</span>
                </div>

                <div className="hr-next-step-actions">
                  <button className="hr-action-btn-primary">
                    Assign owner <ArrowUpRight size={16} style={{ marginLeft: '6px' }} />
                  </button>
                  <button className="hr-action-btn-outline">Review evidence</button>
                  <button className="hr-action-btn-outline">Set deadline</button>
                  <button className="hr-action-btn-outline">Define KPI</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
