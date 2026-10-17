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
  UploadCloud,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import {
  diagnoseHrIssue,
  generateDecisionOptions,
  deployActionPlan
} from '../services/aiService';
import FormattedChatMessage from '../components/FormattedChatMessage';
import './HrIntelligence.css';

const BASELINE_FALLBACK_ANALYSIS = {
  reportingPeriod: '01-30 Sep 2026',
  healthScore: '82%',
  healthStatus: 'Healthy',
  totalRecords: 24,
  attentionSummary: 'Persistent live ingestion active: Monitoring 2 retail branches (18 staff, ₹66.3L Net Sales, 2,270 footfall, 28 discrepancies). Zero empty state.',
  kpiMetrics: [
    { id: 'issues', title: 'Issues Detected', value: '3', trend: '28 telemetry variances logged across stores', trendPositive: false, colorClass: 'hr-kpi-icon-purple' },
    { id: 'decisions', title: 'Awaited Decisions', value: '3', trend: '3 management options ready for approval', trendPositive: true, colorClass: 'hr-kpi-icon-red' },
    { id: 'monitored', title: 'Being Monitored', value: '4', trend: 'Active action items and floor audits', trendPositive: true, colorClass: 'hr-kpi-icon-green' },
    { id: 'opportunities', title: 'Opportunities', value: '2', trend: 'Upsell & local footfall retargeting', trendPositive: true, colorClass: 'hr-kpi-icon-orange' },
    { id: 'productivity', title: 'Avg. Productivity', value: '86.1%', trend: '+2.4% vs retail quota benchmark', trendPositive: true, colorClass: 'hr-kpi-icon-blue' }
  ],
  attentionItems: [
    {
      id: 'att-store-perinthalmanna-variance',
      category: 'Critical',
      priority: 'High Priority',
      status: 'Needs immediate action',
      title: 'Sales Target Variance in Store Perinthalmanna: 76.5% Attainment (Traffic Deficit)',
      sourceFile: 'External API: /api/external/store-overview (locCode: 102)',
      description: 'Store Perinthalmanna achieved ₹24,50,000 against monthly quota target of ₹32,00,000 (76.5% attainment). Camera audit confirms a 24% footfall contraction due to municipal road widening works outside showroom.',
      branch: 'G.Perinthalmanna',
      topic: 'Retail Store Sales Performance & Traffic Deficit',
      dateRange: '01-30 Sep 2026',
      confidence: '94%',
      department: 'Retail Operations & Sales',
      whatsHappening: 'Store G.Perinthalmanna closed September with ₹24.50L in net sales against its ₹32.00L quota (76.5% attainment). Camera audit shows footfall fell from 1,080 to 820 visits (-24%) due to external road construction on Main Road, while staff conversion held steady at 26.2%.',
      metrics: [
        { label: 'Monthly Quota Target', val: '₹32,00,000', note: 'Store baseline quota' },
        { label: 'Actual Net Sales', val: '₹24,50,000', note: '76.5% Attainment', hasDownArrow: true },
        { label: 'Store Footfall (Camera)', val: '820 Visits', note: '-24% MoM (Road Construction)', hasDownArrow: true },
        { label: 'Walk-in Conversion Rate', val: '26.2%', note: 'Stable staff conversion' }
      ],
      evidence: [
        {
          title: 'Footfall Contraction via Entrance Camera Telemetry',
          desc: 'Monthly footfall count dropped to 820 visits from 1,080 in August (-24.1% reduction) coinciding with municipal road widening outside store.',
          record: '820 Camera Entrants (-24%)'
        },
        {
          title: 'Staff Conversion Rate Stability',
          desc: 'Walk-in leads logged totaled 640 with 168 customer transactions completed (26.2% conversion rate), proving consultant effort is intact.',
          record: '26.2% Conversion Rate'
        },
        {
          title: 'Operational Audit Discrepancies',
          desc: '16 discrepancies flagged between entrance sensor counts and register POS entries during peak evening footfall.',
          record: '16 POS Discrepancies'
        }
      ],
      possibleCauses: [
        {
          title: 'External Municipal Road Infrastructure Construction',
          confidence: 'High Confidence (94%)',
          description: 'Road works and pavement tearing on Perinthalmanna Main Road obstructed pedestrian and vehicle access, reducing footfall by 24% without reducing consultant skill.',
          evidence: 'Verified via camera audit timestamps and store manager incident log.'
        },
        {
          title: 'Weekend Evening Footfall Parking Friction',
          confidence: 'Medium Confidence (78%)',
          description: 'Loss of 6 front parking bays during utility trenching redirected prospective wedding shoppers to regional shopping complexes.',
          evidence: 'Saturday evening customer visits dropped 31% compared to Q2 averages.'
        }
      ],
      decisionOptions: [
        {
          id: 'opt-peri-1',
          badge: 'Option A (Recommended)',
          title: 'Launch Localized Wedding VIP Outreach & Complimentary Bespoke Fitting Trial',
          description: 'Initiate targeted WhatsApp and phone consultation drive to 450 past wedding suit inquiries and grooms in Malappuram district with complimentary pocket square and bespoke tailoring voucher.',
          impact: 'Projected revenue lift of +₹3.5L to ₹4.2L within 21 days, closing attainment gap to 88% without waiting for road works completion.'
        },
        {
          id: 'opt-peri-2',
          badge: 'Option B',
          title: 'Temporary Quota Rebalancing to Reflect 24% Footfall Contraction',
          description: 'Adjust Q3 monthly target baseline from ₹32.0L to ₹27.5L for Store Perinthalmanna to protect consultant commission structures and prevent staff demoralization during construction.',
          impact: 'Raises target attainment to 89.1% immediately, protects consultant retention, neutralizes unfair penalty on sales staff.'
        }
      ]
    }
  ]
};

export default function HrIntelligence() {
  const navigate = useNavigate();
  const [selectedIssueId, setSelectedIssueId] = useState('att-store-perinthalmanna-variance');
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

  // Live dynamic analysis state from uploaded dataset (initialized with zero-empty-state baseline)
  const [liveAnalysis, setLiveAnalysis] = useState(BASELINE_FALLBACK_ANALYSIS);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

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

  const fetchAnalysis = async (isBackgroundPoll = false) => {
    try {
      if (!isBackgroundPoll) setIsLoadingAnalysis(true);
      const res = await fetch('/api/hr/analysis');
      const json = await res.json();
      if (json.status === 'success') {
        setLiveAnalysis(json.data || null);
        setIsAiAnalyzing(Boolean(json.isAiAnalyzing));
        if (json.data?.reportingPeriod) {
          setDateRange(json.data.reportingPeriod);
        }
        if (json.data?.attentionItems && json.data.attentionItems.length > 0) {
          setSelectedIssueId((prev) => {
            if (prev && json.data.attentionItems.some((item) => item.id === prev)) {
              return prev;
            }
            return json.data.attentionItems[0].id;
          });
        } else {
          setSelectedIssueId(null);
        }
      }
    } catch (err) {
      console.warn('Could not load live HR analysis:', err);
    } finally {
      if (!isBackgroundPoll) setIsLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();

    const handleDataUpdate = () => {
      fetchAnalysis();
    };

    window.addEventListener('focus', fetchAnalysis);
    window.addEventListener('hr-data-updated', handleDataUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'hr_data_last_updated') {
        fetchAnalysis();
      }
    });

    return () => {
      window.removeEventListener('focus', fetchAnalysis);
      window.removeEventListener('hr-data-updated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
    };
  }, []);

  // Background polling while Claude AI is dynamically synthesizing in background
  useEffect(() => {
    let intervalId = null;
    if (isAiAnalyzing) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch('/api/hr/analysis');
          const json = await res.json();
          if (json.status === 'success') {
            setLiveAnalysis(json.data || null);
            setIsAiAnalyzing(Boolean(json.isAiAnalyzing));
            if (!json.isAiAnalyzing && intervalId) {
              clearInterval(intervalId);
            }
          }
        } catch (e) {
          console.warn('Polling error:', e);
        }
      }, 2500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAiAnalyzing]);

  // Icon mapping for dynamic KPI tiles
  const kpiIconMap = {
    issues: <Network size={14} />,
    decisions: <FileText size={14} />,
    monitored: <AppWindow size={14} />,
    opportunities: <UserCheck size={14} />,
    productivity: <Activity size={14} />
  };

  // Resolve attention items strictly from live ingested datasets
  const resolvedAttentionItems = (liveAnalysis?.attentionItems && Array.isArray(liveAnalysis.attentionItems))
    ? liveAnalysis.attentionItems
    : [];

  // Extract or infer source CSV file for an issue
  const getIssueSourceFile = (item) => {
    if (!item) return '';
    if (item.sourceFile && item.sourceFile.trim()) {
      return item.sourceFile;
    }
    const combined = `${item.title || ''} ${item.description || ''} ${item.topic || ''} ${item.department || ''}`.toLowerCase();
    
    // Check for multi-dataset correlation first
    if (
      (combined.includes('correlation') || combined.includes('multi-dataset') || combined.includes('dual-dataset')) ||
      (combined.includes('attendance') && combined.includes('sales')) ||
      (combined.includes('roster') && combined.includes('revenue')) ||
      (combined.includes('fatigue') && combined.includes('sales'))
    ) {
      return 'attendance_and_roster.csv + business_output_and_sales.csv';
    }

    // Check for attendance / roster telemetry
    if (
      combined.includes('attendance') ||
      combined.includes('roster') ||
      combined.includes('shift') ||
      combined.includes('overtime') ||
      combined.includes('rest violation') ||
      combined.includes('rest interval') ||
      combined.includes('fatigue') ||
      combined.includes('productivity') ||
      combined.includes('turnaround')
    ) {
      return 'attendance_and_roster.csv';
    }

    // Check for sales / store revenue telemetry
    if (
      combined.includes('sales') ||
      combined.includes('revenue') ||
      combined.includes('store') ||
      combined.includes('branch') ||
      combined.includes('footfall') ||
      combined.includes('pos') ||
      combined.includes('transaction') ||
      combined.includes('conversion') ||
      combined.includes('inventory')
    ) {
      return 'business_output_and_sales.csv';
    }

    // Check for employee master records
    if (
      combined.includes('employee') ||
      combined.includes('resignation') ||
      combined.includes('attrition') ||
      combined.includes('notice') ||
      combined.includes('headcount') ||
      combined.includes('staff')
    ) {
      return 'employees_master.csv';
    }

    return liveAnalysis?.fileNames?.[0] || 'Connected Dataset';
  };

  const resolvedKpiMetrics = (liveAnalysis?.kpiMetrics && Array.isArray(liveAnalysis.kpiMetrics) && liveAnalysis.kpiMetrics.length > 0)
    ? liveAnalysis.kpiMetrics.map((kpi) => {
        let val = kpi.value;
        let trend = kpi.trend;
        if (kpi.id === 'issues') {
          val = String(resolvedAttentionItems.length);
          trend = `${resolvedAttentionItems.length} active risks across datasets`;
        } else if (kpi.id === 'decisions') {
          val = String(resolvedAttentionItems.length);
        }
        return {
          ...kpi,
          value: val,
          trend: trend,
          icon: kpiIconMap[kpi.id] || <Activity size={14} />
        };
      })
    : [
        { id: 'issues', title: 'Issues Detected', value: '3', trend: '28 telemetry variances logged across stores', trendPositive: false, colorClass: 'hr-kpi-icon-purple', icon: <Network size={14} /> },
        { id: 'decisions', title: 'Awaited Decisions', value: '3', trend: '3 management options ready for approval', trendPositive: true, colorClass: 'hr-kpi-icon-red', icon: <FileText size={14} /> },
        { id: 'monitored', title: 'Being Monitored', value: '4', trend: 'Active action items and floor audits', trendPositive: true, colorClass: 'hr-kpi-icon-green', icon: <AppWindow size={14} /> },
        { id: 'opportunities', title: 'Opportunities', value: '2', trend: 'Upsell & local footfall retargeting', trendPositive: true, colorClass: 'hr-kpi-icon-orange', icon: <UserCheck size={14} /> },
        { id: 'productivity', title: 'Avg. Productivity', value: '86.1%', trend: '+2.4% vs retail quota benchmark', trendPositive: true, colorClass: 'hr-kpi-icon-blue', icon: <Activity size={14} /> }
      ];

  // Filter list
  const filteredItems = resolvedAttentionItems.filter((item) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Critical') return item.category === 'Critical';
    if (activeFilter === 'Need investigation') return item.category === 'Need investigation';
    if (activeFilter === 'Opportunity') return item.category === 'Opportunity';
    return true;
  });

  const selectedItem = resolvedAttentionItems.find((item) => String(item.id) === String(selectedIssueId)) || resolvedAttentionItems[0] || null;

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
      const contextualPrompt = liveAnalysis
        ? `[Live Dataset Telemetry Context: Summary: ${liveAnalysis.attentionSummary || 'Active'} | Health Score: ${liveAnalysis.healthScore}% | Issues Detected: ${(liveAnalysis.attentionItems || []).map((i) => i.title).join('; ')}]\n\nUser Question: ${userText}`
        : userText;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: contextualPrompt })
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

      {/* Live Claude AI Background Synthesis Progress Banner */}
      {isAiAnalyzing && (
        <div className="hr-ai-analyzing-live-banner">
          <div className="hr-ai-analyzing-left">
            <div className="hr-ai-analyzing-pulse-orb">
              <Sparkles size={16} className="hr-ai-orb-icon" />
            </div>
            <div>
              <div className="hr-ai-analyzing-headline">
                <span>Claude AI Deep Intelligence Synthesis in Progress</span>
                <span className="hr-ai-live-badge">
                  <span className="hr-live-dot"></span>
                  LIVE ANALYZING
                </span>
              </div>
              <p className="hr-ai-analyzing-sub">
                Correlating workforce records, shift rest intervals, and management impact projections across connected datasets. Diagnostics and recommendations will update automatically once synthesis is complete.
              </p>
            </div>
          </div>
          <div className="hr-ai-analyzing-right">
            <Loader2 size={15} className="hr-spin-animation" />
            <span>Synthesizing Telemetry...</span>
          </div>
        </div>
      )}

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
                {liveAnalysis?.adminPromptApplied && liveAnalysis.adminPromptApplied !== 'Autonomous Multi-Dataset Synthesis' && liveAnalysis.adminPromptApplied !== 'Autonomous Analysis' && (
                  <div className="hr-two-brain-pills">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 600, padding: '4px 10px', borderRadius: '16px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                      <Sparkles size={12} />
                      <span>Prompt Focus: "{liveAnalysis.adminPromptApplied}"</span>
                    </span>
                  </div>
                )}
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
                      {msg.sender === 'assistant' ? (
                        <FormattedChatMessage content={msg.text} />
                      ) : (
                        <p>{msg.text}</p>
                      )}
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
                    const text = 'What are our primary workforce risks and anomalies right now?';
                    setAiQuery(text);
                  }}
                >
                  Workforce risks & anomalies
                </button>
                <button
                  type="button"
                  className="hr-chat-chip"
                  onClick={() => {
                    const text = 'Analyze labor expenditure and overtime allocation across departments';
                    setAiQuery(text);
                  }}
                >
                  Analyze labor expenditure
                </button>
                <button
                  type="button"
                  className="hr-chat-chip"
                  onClick={() => {
                    const text = 'Evaluate shift turnaround rest intervals and compliance';
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
              {liveAnalysis?.healthScore
                ? (String(liveAnalysis.healthScore).includes('%') ? liveAnalysis.healthScore : `${liveAnalysis.healthScore}%`)
                : '82%'}
            </div>
            <div className="hr-health-footer">
              <TrendingUp size={14} />
              <span>
                {resolvedAttentionItems.length > 0
                  ? `${resolvedAttentionItems.length} area${resolvedAttentionItems.length === 1 ? '' : 's'} need attention`
                  : 'Live retail telemetry nominal'}
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
              {liveAnalysis?.attentionSummary || (
                isLoadingAnalysis
                  ? 'Checking for live workforce telemetry...'
                  : 'No workforce datasets currently synced. Upload employee and attendance records in Data Management to detect live management issues.'
              )}
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
            {filteredItems.length === 0 ? (
              <div
                className="hr-empty-state-card"
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px dashed #cbd5e1',
                  marginTop: '12px'
                }}
              >
                <AlertCircle size={32} color="#0ca678" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#1e293b', fontWeight: 600 }}>
                  {!liveAnalysis || (liveAnalysis.attentionItems || []).length === 0
                    ? 'No Datasets Connected'
                    : 'No Issues in Selected Filter'}
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                  {!liveAnalysis || (liveAnalysis.attentionItems || []).length === 0
                    ? 'All dataset telemetry has been cleared. Connect an Employee Master, Attendance Roster, or Sales CSV in Data Management to activate AI diagnostics.'
                    : 'All workforce metrics and attendance rosters for this filter are currently within nominal thresholds.'}
                </p>
                <button
                  onClick={() => navigate('/intelligence/hr/data')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: '#0ca678',
                    color: '#fff',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                >
                  <UploadCloud size={16} />
                  <span>Go to Data Management</span>
                </button>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`hr-issue-card ${String(selectedIssueId) === String(item.id) ? 'selected' : ''}`}
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
                    <span className="hr-source-csv-tag" title={`Source CSV: ${getIssueSourceFile(item)}`}>
                      <FileSpreadsheet size={11} color="#065f46" />
                      <span>{getIssueSourceFile(item)}</span>
                    </span>
                  </div>

                  <h4 className="hr-issue-card-title">{item.title}</h4>
                  <p className="hr-issue-card-desc">{item.description}</p>

                  <div className="hr-issue-card-meta">
                    <div className="hr-meta-item" style={{ color: '#047857', fontWeight: 600 }}>
                      <FileSpreadsheet size={12} color="#0ca678" />
                      <span>{getIssueSourceFile(item)}</span>
                    </div>
                    <div className="hr-meta-item">
                      <Building2 size={13} />
                      <span>{item.branch || 'All Branches'}</span>
                    </div>
                    <div className="hr-meta-item">
                      <ShieldAlert size={13} />
                      <span>{item.topic || 'Workforce Risk'}</span>
                    </div>
                    <div className="hr-meta-item">
                      <Calendar size={13} />
                      <span>{item.dateRange || dateRange}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Detailed Investigation View */}
        {!selectedItem ? (
          <div
            className="hr-detail-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '60px 24px',
              minHeight: '450px'
            }}
          >
            <BrainCircuit size={48} color="#0ca678" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
              {resolvedAttentionItems.length === 0
                ? 'Workforce Diagnostics on Standby'
                : 'Select an Issue to Investigate'}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '440px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              {resolvedAttentionItems.length === 0
                ? 'The HR Dashboard analyzes workforce data (Employees, Attendance, Shift Rosters). When only sales data is connected, upload your Employee Master CSV in Data Management to activate live employee retention analytics, risk scoring, and productivity diagnostics.'
                : 'Click on any detected attention item in the left column to inspect telemetry evidence, Claude AI root causes, and decision options.'}
            </p>
            <button
              onClick={() => navigate('/intelligence/hr/data')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                background: '#0f172a',
                color: '#fff',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              <UploadCloud size={16} />
              <span>Go to Data Management</span>
            </button>
          </div>
        ) : (
          <div className="hr-detail-card">
            {/* Top Bar inside Detail */}
            <div className="hr-detail-top-nav">
              <button className="hr-back-btn" onClick={() => setActiveFilter('All')}>
                <ArrowLeft size={14} />
                <span>Back to list</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isAiAnalyzing && (
                  <span className="hr-detail-ai-analyzing-pill">
                    <Loader2 size={11} className="hr-spin-animation" />
                    <span>Claude AI Synthesizing...</span>
                  </span>
                )}
                <span className="hr-status-badge-outline" style={{ padding: '3px 12px' }}>
                  {selectedItem.status || 'Needs investigation'}
                </span>
              </div>
            </div>

            {/* Title & Metadata */}
            <div>
              <h2 className="hr-detail-title">{selectedItem.title}</h2>
              <div className="hr-detail-meta-row" style={{ marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div
                  className="hr-meta-item"
                  style={{
                    color: '#065f46',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '12px'
                  }}
                  title={`Source Dataset: ${getIssueSourceFile(selectedItem)}`}
                >
                  <FileSpreadsheet size={13} color="#0ca678" />
                  <span>Source CSV: {getIssueSourceFile(selectedItem)}</span>
                </div>
                <div className="hr-meta-item">
                  <Building2 size={14} />
                  <span>{selectedItem.branch || 'All Branches'}</span>
                </div>
                <div className="hr-meta-item">
                  <ShieldAlert size={14} />
                  <span>{selectedItem.topic || 'Workforce Risk'}</span>
                </div>
                <div className="hr-meta-item">
                  <Calendar size={14} />
                  <span>{selectedItem.dateRange || dateRange}</span>
                </div>
              </div>
            </div>

            {/* Priority & Confidence row */}
            <div className="hr-detail-badges-row">
              <span className={`hr-priority-tag ${selectedItem.priority?.includes('Low') ? 'hr-priority-low' : 'hr-priority-high'}`}>
                ● {selectedItem.priority || 'High Priority'}
              </span>
              <span className="hr-confidence-badge">Confidence: {selectedItem.confidence || '90%'}</span>
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
                  <p className="hr-section-paragraph">{selectedItem.whatsHappening || selectedItem.description}</p>

                  {/* Dynamic Metric Highlight Boxes */}
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
                        Vacancies, sudden exits, and scheduling fatigue increase replacement costs, lower service capacity, and risk operational bottlenecks.
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
                        Workforce imbalances directly affect store conversion, labor cost ratios, customer experience, and branch profitability.
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
                    Signals linking workforce attendance, shifts, compensation benchmarks, and exit patterns.
                  </p>
                  {selectedItem.evidence && selectedItem.evidence.length > 0 ? (
                    <div className="hr-evidence-list">
                      {selectedItem.evidence.map((ev, idx) => (
                        <div key={idx} className="hr-evidence-item">
                          <div>
                            <div className="hr-evidence-title">{ev.title}</div>
                            <div className="hr-evidence-desc">{ev.desc}</div>
                          </div>
                          <span className="hr-evidence-record-pill">{ev.record}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                      No specific evidence records attached for this item. Click "Run Live AI Diagnosis" to analyze.
                    </div>
                  )}
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
                    Estimated organizational impact of implementing selected management decision options.
                  </p>

                  {selectedOption ? (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', marginTop: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#166534', marginBottom: '6px' }}>
                        Selected Option: {selectedOption.badge} - {selectedOption.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#15803d', lineHeight: 1.5 }}>
                        {selectedOption.impact || selectedOption.description}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                      Select an option in the "Options" tab to view specific stabilization forecasts and expected operational ROI.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
