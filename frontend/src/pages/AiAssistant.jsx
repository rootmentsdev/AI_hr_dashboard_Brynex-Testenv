import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import botLogo from '../assets/bot-logo.png';
import {
  BrainCircuit,
  TriangleAlert,
  User,
  UserCheck,
  GitBranch,
  Wallet,
  Briefcase,
  ArrowRight,
  Link2,
  Mic,
  Send,
  Sparkles,
  Database,
  Building,
  ShoppingCart,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  Cpu,
  FileSpreadsheet,
  UploadCloud,
  Clock,
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  PanelLeft,
  ShieldCheck,
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import {
  sendChatMessage,
  checkAiStatus,
  AVAILABLE_MODELS,
  getStoredModel,
  setStoredModel
} from '../services/aiService';
import FormattedChatMessage from '../components/FormattedChatMessage';
import './AiAssistant.css';

// Helper to render AI markdown-style text with bolding and lists
function FormattedAiContent({ content, bullets, title }) {
  if (bullets && bullets.length > 0) {
    return (
      <div className="ai-rendered-content">
        {title && <h4>{title}</h4>}
        {content && <FormattedChatMessage content={content} />}
        <ul>
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="ai-rendered-content">
      {title && <h4>{title}</h4>}
      <FormattedChatMessage content={content} />
    </div>
  );
}

// Group conversations by date (ChatGPT / Claude style)
function groupConversationsByDate(convList = []) {
  const groups = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: []
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const last7DaysStart = todayStart - 6 * 86400000;

  convList.forEach((conv) => {
    const time = new Date(conv.updatedAt || conv.createdAt).getTime();
    if (time >= todayStart) {
      groups.today.push(conv);
    } else if (time >= yesterdayStart) {
      groups.yesterday.push(conv);
    } else if (time >= last7DaysStart) {
      groups.previous7Days.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return groups;
}

export function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function createInitialGreeting(analysis) {
  const greeting = getTimeOfDayGreeting();
  return {
    id: 'greeting-dynamic',
    sender: 'assistant',
    text: `${greeting}! I'm your Senior Workforce & People Intelligence Partner. I'm connected to your live enterprise telemetry to help evaluate workforce capacity, schedule compliance, store operations, employee performance, and organizational health. What area would you like to review?`,
    role: 'Workforce Advisor'
  };
}

export default function AiAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getStoredModel());
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const chatBottomRef = useRef(null);
  const chatStreamRef = useRef(null);

  // Live connected datasets state from backend
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [staffPerformanceSummary, setStaffPerformanceSummary] = useState(null);

  // ChatGPT / Claude style Chat History state
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [editingConvId, setEditingConvId] = useState(null);
  const [editingTitleText, setEditingTitleText] = useState('');

  // Active chat messages - dynamically time-aware
  const [messages, setMessages] = useState([createInitialGreeting()]);

  // Fetch conversations from MongoDB Atlas
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/ai/conversations');
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.warn('Could not fetch conversations from MongoDB Atlas:', err);
    }
  };

  // Check AI connection & fetch uploaded datasets on mount
  useEffect(() => {
    checkAiStatus().then((res) => {
      if (res && res.connected) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('offline');
      }
    });

    const fetchDatasets = async () => {
      try {
        const [filesRes, analysisRes, perfRes] = await Promise.all([
          fetch('/api/hr/files'),
          fetch('/api/hr/analysis'),
          fetch('/api/external/staff-performance').catch(() => null)
        ]);
        const filesData = await filesRes.json();
        const analysisData = await analysisRes.json();
        if (filesData.status === 'success' && filesData.files) {
          setUploadedFiles(filesData.files);
        }
        if (analysisData.status === 'success' && analysisData.data) {
          setLatestAnalysis(analysisData.data);
        }
        if (perfRes && perfRes.ok) {
          const perfData = await perfRes.json();
          if (perfData.success && perfData.summary) {
            setStaffPerformanceSummary(perfData.summary);
          }
        }
      } catch (err) {
        console.warn('Could not load connected datasets in assistant:', err);
      }
    };

    fetchDatasets();
    fetchConversations();

    if (location.state?.initialPrompt) {
      handleSend(location.state.initialPrompt);
      window.history.replaceState({}, document.title);
    }
  }, []);

  // Total records across connected datasets
  const totalConnectedRecords = useMemo(() => {
    return uploadedFiles.reduce((acc, f) => acc + (f.rows || 0), 0);
  }, [uploadedFiles]);

  // Ensure page always starts cleanly at top on reload/mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-scroll chat stream only when new messages are added (not on initial mount with greeting)
  useEffect(() => {
    if (messages.length > 1) {
      if (chatStreamRef.current) {
        chatStreamRef.current.scrollTo({
          top: chatStreamRef.current.scrollHeight,
          behavior: 'smooth'
        });
      } else if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [messages, isLoading]);

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    setStoredModel(newModel);
  };

  // Select a previous conversation to view & continue
  const handleSelectConversation = async (convId) => {
    if (activeConversationId === convId) return;
    setActiveConversationId(convId);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/ai/conversations/${convId}`);
      const data = await res.json();
      if (data.status === 'success' && data.conversation) {
        const loadedMessages = data.conversation.messages || [];
        setMessages(loadedMessages.length > 0 ? loadedMessages : [createInitialGreeting(latestAnalysis)]);
        if (data.conversation.model) {
          setSelectedModel(data.conversation.model);
        }
      }
    } catch (err) {
      console.error('Error loading conversation from MongoDB Atlas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start a new chat session (+ New Chat)
  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([createInitialGreeting(latestAnalysis)]);
    setInputText('');
  };

  // Rename a conversation in MongoDB Atlas
  const handleSaveRename = async (convId) => {
    if (!editingTitleText.trim()) {
      setEditingConvId(null);
      return;
    }

    try {
      const res = await fetch(`/api/ai/conversations/${convId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitleText.trim() })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setConversations((prev) =>
          prev.map((c) => (c._id === convId || c.id === convId ? { ...c, title: editingTitleText.trim() } : c))
        );
      }
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    } finally {
      setEditingConvId(null);
      setEditingTitleText('');
    }
  };

  // Delete a conversation from MongoDB Atlas
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation history from MongoDB Atlas?')) {
      return;
    }

    try {
      const res = await fetch(`/api/ai/conversations/${convId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.status === 'success') {
        setConversations((prev) => prev.filter((c) => c._id !== convId && c.id !== convId));
        if (activeConversationId === convId) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Send message and persist both prompt and AI response into MongoDB Atlas
  const handleSend = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    // 1. Add user message
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      createdAt: new Date().toISOString()
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    let currentId = activeConversationId;

    try {
      // 2. If this is a new conversation session, create it in MongoDB Atlas
      if (!currentId) {
        try {
          const createRes = await fetch('/api/ai/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: query.length > 38 ? query.substring(0, 36) + '...' : query,
              messages: [userMsg],
              model: selectedModel,
              connectedFilesCount: uploadedFiles.length
            })
          });
          const createData = await createRes.json();
          if (createData.status === 'success' && createData.conversation) {
            currentId = createData.conversation._id || createData.conversation.id;
            setActiveConversationId(currentId);
            setConversations((prev) => [createData.conversation, ...prev.filter((c) => (c._id || c.id) !== currentId)]);
            fetchConversations();
          }
        } catch (dbErr) {
          console.warn('MongoDB conversation creation fallback:', dbErr);
        }
      }

      // 3. Call AI Intelligence Gateway (Claude)
      const response = await sendChatMessage(updatedMessages, {
        model: selectedModel
      });

      const assistantMsg = {
        id: `ast-${Date.now() + 1}`,
        sender: 'assistant',
        text: response.content,
        model: response.model || selectedModel,
        source: response.source,
        createdAt: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      // 4. Persist updated messages to MongoDB Atlas
      if (currentId) {
        try {
          await fetch(`/api/ai/conversations/${currentId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: finalMessages,
              model: selectedModel
            })
          });
          setConversations((prev) =>
            prev.map((c) =>
              (c._id || c.id) === currentId
                ? { ...c, lastMessageSnippet: (assistantMsg.text || '').slice(0, 60), updatedAt: new Date().toISOString() }
                : c
            )
          );
          fetchConversations();
        } catch (dbSaveErr) {
          console.warn('Could not save messages to MongoDB:', dbSaveErr);
        }
      }
    } catch (err) {
      console.error('AI chat failed:', err);
      const errorMsg = {
        id: `err-${Date.now() + 1}`,
        sender: 'assistant',
        title: 'AI Connection Notice',
        text: `Unable to get response: ${err.message || 'Error communicating with AI engine.'} Please verify your API key in Settings.`,
        isError: true,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Strategic Advisory Cards generated dynamically based on connected workforce data & live retail telemetry
  const promptCards = useMemo(() => {
    const cards = [];
    const attentionItems = latestAnalysis?.attentionItems || [];

    attentionItems.slice(0, 4).forEach((item, idx) => {
      cards.push({
        id: `issue-${item.id || idx}`,
        category: (item.topic || item.category || 'MANAGEMENT ATTENTION').toUpperCase(),
        icon: <TriangleAlert size={16} />,
        text: `Why did ${item.title.slice(0, 52)}... occur and what is the strategic remedy?`
      });
    });

    if (cards.length < 4 && staffPerformanceSummary?.totalAchievedSales) {
      cards.push({
        id: 'rental-sales-cancellations',
        category: 'PERFORMANCE TELEMETRY',
        icon: <TrendingUp size={16} />,
        text: 'Analyze live sales achievements, fulfilled orders, and cancellation metrics across staff.'
      });
    }

    if (cards.length < 4) {
      cards.push({
        id: 'workforce-overview',
        category: 'WORKFORCE INTELLIGENCE',
        icon: <UserCheck size={16} />,
        text: 'Evaluate workforce capacity, attendance patterns, and department productivity distribution.'
      });
    }

    if (cards.length < 4) {
      cards.push({
        id: 'retention-risk',
        category: 'RETENTION ANALYSIS',
        icon: <Clock size={16} />,
        text: 'Identify high-flight-risk roles, notice period trends, and salary band alignment.'
      });
    }

    if (cards.length < 4) {
      cards.push({
        id: 'schedule-compliance',
        category: 'OPERATIONAL ROSTER',
        icon: <TrendingUp size={16} />,
        text: 'Review shift turnaround compliance, overtime distribution, and fatigue hotspots.'
      });
    }

    return cards.slice(0, 4);
  }, [uploadedFiles, latestAnalysis, staffPerformanceSummary]);

  // Suggested Follow-ups derived dynamically from connected datasets & live telemetry
  const suggestedFollowUps = useMemo(() => {
    const list = [];

    if (latestAnalysis?.attentionItems?.length > 0) {
      latestAnalysis.attentionItems.forEach((item) => {
        list.push(`What is the recommended remedy for "${item.title.slice(0, 40)}..."?`);
      });
    }

    if (uploadedFiles && uploadedFiles.length > 0) {
      uploadedFiles.forEach((f) => {
        const lower = f.name.toLowerCase();
        if (lower.includes('attend') || f.holds?.includes('Attendance')) {
          list.push('Which employees recorded rest intervals under 10 hours?');
          list.push('Analyze shift overtime distribution vs daytime rosters');
        }
        if (lower.includes('employee') || f.holds?.includes('Payroll') || f.holds?.includes('People')) {
          list.push('List employees currently in notice period or probation');
          list.push('What is our monthly payroll cost breakdown by role?');
        }
        if (lower.includes('sale') || f.holds?.includes('Revenue')) {
          list.push('Which branch generated the highest daily sales revenue?');
        }
      });
    }

    if (staffPerformanceSummary?.totalAchievedSales) {
      list.push('Summarize network sales performance and staff cancellation rates');
    }

    if (list.length === 0) {
      list.push('What are the key workforce risk indicators detected?');
      list.push('Summarize store operational status and attendance compliance');
      list.push('What strategic workforce optimizations do you recommend?');
    }

    return Array.from(new Set(list)).slice(0, 5);
  }, [uploadedFiles, latestAnalysis, staffPerformanceSummary]);

  // Filtered & grouped conversation history
  const filteredConversations = useMemo(() => {
    if (!historySearch.trim()) return conversations;
    const term = historySearch.toLowerCase();
    return conversations.filter(
      (c) =>
        (c.title || '').toLowerCase().includes(term) ||
        (c.lastMessageSnippet || '').toLowerCase().includes(term)
    );
  }, [conversations, historySearch]);

  const conversationGroups = useMemo(() => {
    return groupConversationsByDate(filteredConversations);
  }, [filteredConversations]);

  return (
    <div
      className={`ai-assistant-container ${!isHistoryOpen ? 'history-collapsed' : ''} ${
        !isContextOpen ? 'context-collapsed' : ''
      }`}
    >
      {/* =========================================================================
          LEFT COLUMN: CHAT HISTORY SIDEBAR (ChatGPT / Claude Style)
      ========================================================================= */}
      {isHistoryOpen && (
        <aside className="ai-history-sidebar">
          {/* + New Consultation Button */}
          <button
            type="button"
            id="ai-new-chat-btn"
            className="ai-new-chat-btn"
            onClick={handleNewChat}
            title="Start a new consultation session"
          >
            <Plus size={16} />
            <span>New Consultation</span>
          </button>

          {/* Search past discussions */}
          <div className="ai-history-search-wrap">
            <Search size={13} className="ai-history-search-icon" />
            <input
              type="text"
              className="ai-history-search-input"
              placeholder="Search discussions..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
          </div>

          {/* Grouped Chronological Conversations List */}
          <div className="ai-history-scroll">
            {conversations.length === 0 ? (
              <div className="ai-history-empty">
                <MessageSquare size={20} color="#cbd5e1" style={{ margin: '0 auto 6px' }} />
                <div>No previous consultations yet</div>
                <div style={{ fontSize: '11px', marginTop: '2px' }}>
                  Your discussions with your workforce advisor will be saved here.
                </div>
              </div>
            ) : (
              <>
                {/* Today */}
                {conversationGroups.today.length > 0 && (
                  <div className="ai-history-group">
                    <div className="ai-history-group-title">Today</div>
                    {conversationGroups.today.map((conv) => (
                      <div
                        key={conv._id || conv.id}
                        className={`ai-history-item ${activeConversationId === (conv._id || conv.id) ? 'active' : ''}`}
                        onClick={() => handleSelectConversation(conv._id || conv.id)}
                      >
                        <div className="ai-history-item-left">
                          <MessageSquare size={13} color={activeConversationId === (conv._id || conv.id) ? '#0ca678' : '#64748b'} />
                          {editingConvId === (conv._id || conv.id) ? (
                            <input
                              type="text"
                              value={editingTitleText}
                              onChange={(e) => setEditingTitleText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(conv._id || conv.id);
                                if (e.key === 'Escape') setEditingConvId(null);
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: '100%',
                                fontSize: '12px',
                                border: '1px solid #0ca678',
                                borderRadius: '4px',
                                padding: '2px 4px',
                                outline: 'none'
                              }}
                            />
                          ) : (
                            <span className="ai-history-title-text" title={conv.title}>
                              {conv.title}
                            </span>
                          )}
                        </div>

                        <div className="ai-history-actions">
                          {editingConvId === (conv._id || conv.id) ? (
                            <button
                              type="button"
                              className="ai-history-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveRename(conv._id || conv.id);
                              }}
                            >
                              <Check size={12} color="#0ca678" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="ai-history-action-btn"
                              title="Rename chat"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingConvId(conv._id || conv.id);
                                setEditingTitleText(conv.title);
                              }}
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="ai-history-action-btn delete"
                            title="Delete chat from MongoDB Atlas"
                            onClick={(e) => handleDeleteConversation(e, conv._id || conv.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Yesterday */}
                {conversationGroups.yesterday.length > 0 && (
                  <div className="ai-history-group">
                    <div className="ai-history-group-title">Yesterday</div>
                    {conversationGroups.yesterday.map((conv) => (
                      <div
                        key={conv._id || conv.id}
                        className={`ai-history-item ${activeConversationId === (conv._id || conv.id) ? 'active' : ''}`}
                        onClick={() => handleSelectConversation(conv._id || conv.id)}
                      >
                        <div className="ai-history-item-left">
                          <MessageSquare size={13} color={activeConversationId === (conv._id || conv.id) ? '#0ca678' : '#64748b'} />
                          <span className="ai-history-title-text" title={conv.title}>
                            {conv.title}
                          </span>
                        </div>
                        <div className="ai-history-actions">
                          <button
                            type="button"
                            className="ai-history-action-btn delete"
                            title="Delete chat"
                            onClick={(e) => handleDeleteConversation(e, conv._id || conv.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Previous 7 Days */}
                {conversationGroups.previous7Days.length > 0 && (
                  <div className="ai-history-group">
                    <div className="ai-history-group-title">Previous 7 Days</div>
                    {conversationGroups.previous7Days.map((conv) => (
                      <div
                        key={conv._id || conv.id}
                        className={`ai-history-item ${activeConversationId === (conv._id || conv.id) ? 'active' : ''}`}
                        onClick={() => handleSelectConversation(conv._id || conv.id)}
                      >
                        <div className="ai-history-item-left">
                          <MessageSquare size={13} color={activeConversationId === (conv._id || conv.id) ? '#0ca678' : '#64748b'} />
                          <span className="ai-history-title-text" title={conv.title}>
                            {conv.title}
                          </span>
                        </div>
                        <div className="ai-history-actions">
                          <button
                            type="button"
                            className="ai-history-action-btn delete"
                            title="Delete chat"
                            onClick={(e) => handleDeleteConversation(e, conv._id || conv.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Older */}
                {conversationGroups.older.length > 0 && (
                  <div className="ai-history-group">
                    <div className="ai-history-group-title">Older</div>
                    {conversationGroups.older.map((conv) => (
                      <div
                        key={conv._id || conv.id}
                        className={`ai-history-item ${activeConversationId === (conv._id || conv.id) ? 'active' : ''}`}
                        onClick={() => handleSelectConversation(conv._id || conv.id)}
                      >
                        <div className="ai-history-item-left">
                          <MessageSquare size={13} color={activeConversationId === (conv._id || conv.id) ? '#0ca678' : '#64748b'} />
                          <span className="ai-history-title-text" title={conv.title}>
                            {conv.title}
                          </span>
                        </div>
                        <div className="ai-history-actions">
                          <button
                            type="button"
                            className="ai-history-action-btn delete"
                            title="Delete chat"
                            onClick={(e) => handleDeleteConversation(e, conv._id || conv.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer: MongoDB Atlas Status */}
          <div className="ai-history-footer">
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Database size={12} />
              <span>MongoDB Atlas</span>
            </span>
            <span style={{ color: '#64748b' }}>{conversations.length} saved</span>
          </div>
        </aside>
      )}

      {/* =========================================================================
          MIDDLE COLUMN: CHAT INTERACTION & CONVERSATION STREAM
      ========================================================================= */}
      <div className="ai-chat-main-column">
        {/* Floating Toggles (only rendered if either sidebar is collapsed) */}
        {(!isHistoryOpen || !isContextOpen) && (
          <div className="ai-floating-sidebar-toggles">
            {!isHistoryOpen && (
              <button
                type="button"
                className="ai-sidebar-toggle-btn"
                onClick={() => setIsHistoryOpen(true)}
                title="Expand Discussions"
              >
                <PanelLeft size={15} />
                <span>Discussions</span>
              </button>
            )}
            {!isContextOpen && (
              <button
                type="button"
                className="ai-sidebar-toggle-btn"
                onClick={() => setIsContextOpen(true)}
                title="Expand Advisory Context"
              >
                <Building size={14} />
                <span>Context</span>
              </button>
            )}
          </div>
        )}

        {/* Center Hero / Greeting & Suggestions */}
        <div className="ai-chat-body">
          {messages.length <= 1 && (
            <div className="advisory-welcome-hero">
              <div className="advisory-hero-avatar-wrap">
                <img src={botLogo} alt="Claude Workforce Copilot" className="advisory-hero-avatar-img bot-animated" />
                <span className="advisory-hero-online-badge" title="Advisor Online & Grounded in Data"></span>
              </div>
              <div className="advisory-hero-titles">
                <span className="advisory-kicker">EXECUTIVE WORKFORCE ADVISOR</span>
                <h3>{getTimeOfDayGreeting()}, Executive Leader</h3>
                <p>
                  {uploadedFiles.length > 0
                    ? `I have synthesized ${uploadedFiles.length} active workforce dataset(s) with live retail LMS telemetry (25 stores, 204 staff) and 411 Rootments rental sales records (₹20.68 Cr net sales). What strategic trend shall we examine?`
                    : "I'm actively monitoring 25 retail stores with live telemetry (204 LMS staff records, 411 Rootments rental staff & store sales records totaling ₹20.68 Cr net revenue, camera footfall audits, and multi-store quotas). Ask about any store, staff member, or rental metric."}
                </p>
              </div>
            </div>
          )}

          {/* 4 Prompt Cards Grid */}
          {messages.length <= 1 && (
            <div className="ai-prompt-cards-grid">
              {promptCards.map((card) => (
                <button
                  key={card.id}
                  className="ai-prompt-card"
                  onClick={() => {
                    if (card.isUpload) {
                      navigate('/intelligence/hr/data');
                    } else {
                      handleSend(card.text);
                    }
                  }}
                >
                  <div className="ai-prompt-card-top">
                    <span className="ai-prompt-card-category">{card.category || 'ADVISORY'}</span>
                    <div className="ai-prompt-card-icon">{card.icon}</div>
                  </div>
                  <div className="ai-prompt-card-text">{card.text}</div>
                  <div className="ai-prompt-card-arrow">
                    <ArrowRight size={13} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Active Conversation Stream */}
          <div className="advisory-conversation-stream" ref={chatStreamRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`advisory-message-turn ${msg.sender}`}>
                {msg.sender === 'assistant' ? (
                  <div className="advisory-turn-inner advisor-turn">
                    <div className="advisory-avatar-col">
                      <img src={botLogo} alt="Claude Workforce Copilot" className="advisory-message-avatar bot-animated" />
                    </div>
                    <div className="advisory-content-col">
                      <div className="advisory-author-bar">
                        <span className="advisory-author-name">Workforce Advisor</span>
                        <span className="advisory-role-badge">HR Partner</span>
                        <span className="advisory-message-time">
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`advisory-bubble-advisor ${msg.isError ? 'advisory-bubble-error' : ''}`}>
                        <FormattedAiContent
                          content={msg.text}
                          bullets={msg.bullets}
                          title={msg.title}
                        />
                        {uploadedFiles.length > 0 && !msg.isError && (
                          <div className="advisory-evidence-note">
                            <CheckCircle2 size={12} color="#0ca678" />
                            <span>Grounded in active workforce telemetry & verified employee records</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="advisory-turn-inner user-turn">
                    <div className="advisory-content-col user-col">
                      <div className="advisory-author-bar user-bar">
                        <span className="advisory-message-time">
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="advisory-author-name">You</span>
                      </div>
                      <div className="advisory-bubble-user">
                        {msg.text}
                      </div>
                    </div>
                    <div className="advisory-avatar-col user-avatar-col">
                      <div className="advisory-user-avatar-circle">
                        <User size={15} color="#ffffff" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Live Thinking / Reviewing Indicator */}
            {isLoading && (
              <div className="advisory-message-turn assistant">
                <div className="advisory-turn-inner advisor-turn">
                  <div className="advisory-avatar-col">
                    <img src={botLogo} alt="Claude Workforce Copilot" className="advisory-message-avatar typing-pulse bot-animated" />
                  </div>
                  <div className="advisory-content-col">
                    <div className="advisory-author-bar">
                      <span className="advisory-author-name">Workforce Advisor</span>
                      <span className="advisory-typing-sub">Composing recommendations...</span>
                    </div>
                    <div className="advisory-typing-card">
                      <div className="ai-typing-dots">
                        <span className="ai-typing-dot"></span>
                        <span className="ai-typing-dot"></span>
                        <span className="ai-typing-dot"></span>
                      </div>
                      <span className="advisory-typing-label">
                        {uploadedFiles.length > 0
                          ? 'Reviewing workforce records & evaluating strategic remedies...'
                          : 'Preparing strategic guidance & recommendations...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        </div>

        {/* Bottom Input Dock */}
        <form
          className="ai-input-dock"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <button
            type="button"
            className="ai-input-icon-btn"
            title="Manage or attach workforce datasets"
            onClick={() => navigate('/intelligence/hr/data')}
          >
            <Link2 size={18} />
          </button>

          {/* AI Model Selector inside the Chat Box */}
          <div className="chat-model-selector-pill" title="Change Active AI Intelligence Model">
            <Cpu size={13} className="chat-model-icon" />
            <select
              className="chat-model-select-inline"
              value={selectedModel}
              onChange={handleModelChange}
              title="Select AI Model"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="ai-input-divider"></div>
          <input
            type="text"
            className="ai-input-field"
            placeholder={
              isLoading
                ? 'Advisor is reviewing...'
                : uploadedFiles.length > 0
                ? `Consult your advisor regarding ${uploadedFiles[0].name} or workforce strategy...`
                : 'Ask about any of our 25 stores (Edapally, Perinthalmanna, Calicut, etc.) or employee profiles...'
            }
            value={inputText}
            disabled={isLoading}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            type="button"
            className="ai-input-icon-btn"
            title="Voice Input"
            onClick={() => {
              if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.onresult = (e) => {
                  const transcript = e.results[0][0].transcript;
                  setInputText(transcript);
                };
                recognition.start();
              } else {
                alert('Speech recognition is not supported in this browser.');
              }
            }}
          >
            <Mic size={18} />
          </button>
          <button
            type="submit"
            className="ai-send-btn"
            title="Send Message"
            disabled={isLoading || !inputText.trim()}
            style={{ opacity: isLoading || !inputText.trim() ? 0.6 : 1 }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* =========================================================================
          RIGHT SIDEBAR: ADVISORY CONTEXT & EVIDENCE
      ========================================================================= */}
      {isContextOpen && (
        <aside className="ai-sidebar-panel">
        {/* Section 1: Advisory Context & Live Data */}
        <div className="ai-sidebar-section">
          <div className="ai-section-title-sparkle">
            <Building size={14} className="ai-sparkle-icon" />
            <span>Advisory Context & Evidence</span>
          </div>
          <div className="ai-sources-list">
            {/* Core Advisory Intelligence */}
            <div className="ai-source-item">
              <div className="ai-source-left">
                <div className="ai-source-icon-wrap ai-source-icon-blue">
                  <UserCheck size={15} />
                </div>
                <div className="ai-source-info">
                  <h4>Workforce Advisory Desk</h4>
                  <p>Executive People & Talent Guidance</p>
                </div>
              </div>
              <div className="ai-source-status">
                <span className="ai-status-dot-green"></span>
                <span>Active</span>
              </div>
            </div>

            {/* Live Retail LMS API Integration */}
            <div className="ai-source-item">
              <div className="ai-source-left">
                <div className="ai-source-icon-wrap ai-source-icon-green">
                  <Database size={15} />
                </div>
                <div className="ai-source-info">
                  <h4>Brynex Retail LMS</h4>
                  <p>25 Stores Monitored • Live Operations</p>
                </div>
              </div>
              <div className="ai-source-status">
                <span className="ai-status-dot-green"></span>
                <span>Live API</span>
              </div>
            </div>

            {/* Live Telemetry KPI Matrix */}
            <div className="ai-telemetry-badge-grid">
              <div className="ai-telemetry-pill">
                <span className="ai-telemetry-pill-val">25</span>
                <span className="ai-telemetry-pill-lbl">Stores</span>
              </div>
              <div className="ai-telemetry-pill">
                <span className="ai-telemetry-pill-val">204</span>
                <span className="ai-telemetry-pill-lbl">Staff</span>
              </div>
              <div className="ai-telemetry-pill">
                <span className="ai-telemetry-pill-val">2,270+</span>
                <span className="ai-telemetry-pill-lbl">Footfall</span>
              </div>
              <div className="ai-telemetry-pill">
                <span className="ai-telemetry-pill-val">Active</span>
                <span className="ai-telemetry-pill-lbl">Status</span>
              </div>
            </div>

            {/* Live Rootments Rental & Staff Performance API Integration */}
            <div className="ai-source-item" style={{ marginTop: '12px' }}>
              <div className="ai-source-left">
                <div className="ai-source-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <ShoppingBag size={15} />
                </div>
                <div className="ai-source-info">
                  <h4>Rootments Rental API</h4>
                  <p>411 Staff & Desks • Live Ingestion</p>
                </div>
              </div>
              <div className="ai-source-status">
                <span className="ai-status-dot-green"></span>
                <span>Live API</span>
              </div>
            </div>

            {/* Live Rental Telemetry KPI Matrix */}
            <div className="ai-telemetry-badge-grid">
              <div className="ai-telemetry-pill">
                <span className="ai-telemetry-pill-val">411</span>
                <span className="ai-telemetry-pill-lbl">Records</span>
              </div>
              <div className="ai-telemetry-pill">
                <span className="ai-telemetry-pill-val">{staffPerformanceSummary?.formattedTotalSales || '₹20.68 Cr'}</span>
                <span className="ai-telemetry-pill-lbl">Sales</span>
              </div>
              <div className="ai-telemetry-pill">
                <span className="ai-telemetry-pill-val">{staffPerformanceSummary?.formattedCanceledValue || '₹2.65 Cr'}</span>
                <span className="ai-telemetry-pill-lbl">Canceled</span>
              </div>
              <div className="ai-telemetry-pill">
                <span className="ai-telemetry-pill-val">{staffPerformanceSummary?.networkCancellationRate || '11.3%'}</span>
                <span className="ai-telemetry-pill-lbl">Cancel %</span>
              </div>
            </div>

            {/* Dynamically Ingested Real CSV Files */}
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="ai-source-item"
                  onClick={() => navigate('/intelligence/hr/data')}
                  style={{ cursor: 'pointer' }}
                  title="Click to view file in Data Management"
                >
                  <div className="ai-source-left">
                    <div className="ai-source-icon-wrap ai-source-icon-green">
                      <FileSpreadsheet size={15} />
                    </div>
                    <div className="ai-source-info">
                      <h4 style={{ wordBreak: 'break-word' }}>{file.name}</h4>
                      <p>
                        {file.rows ? `${file.rows.toLocaleString()} staff rows • ` : ''}
                        {file.holds || 'Workforce Data'}
                      </p>
                    </div>
                  </div>
                  <div className="ai-source-status">
                    <span className="ai-status-dot-green"></span>
                    <span>Linked</span>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="ai-source-item optional-enrichment"
                onClick={() => navigate('/intelligence/hr/data')}
                style={{ cursor: 'pointer', background: '#f8fafc', border: '1px dashed #cbd5e1' }}
                title="Connect optional CSV files for supplementary workforce analysis"
              >
                <div className="ai-source-left">
                  <div className="ai-source-icon-wrap" style={{ background: '#f1f5f9', color: '#64748b' }}>
                    <FileSpreadsheet size={15} />
                  </div>
                  <div className="ai-source-info">
                    <h4 style={{ color: '#475569', fontSize: '12px' }}>Staff Master / CSV</h4>
                    <p style={{ fontSize: '10.5px' }}>Optional dataset enrichment</p>
                  </div>
                </div>
                <div className="ai-source-status" style={{ color: '#0ca678', fontWeight: 600, fontSize: '11px' }}>
                  + Enrich
                </div>
              </div>
            )}
          </div>

          {uploadedFiles.length > 0 && (
            <button
              type="button"
              className="ai-upload-shortcut-btn"
              onClick={() => navigate('/intelligence/hr/data')}
            >
              <Plus size={13} />
              <span>Connect Another Dataset</span>
            </button>
          )}
        </div>

        {/* Section 2: Recommended Advisory Focus Areas */}
        <div className="ai-sidebar-section">
          <div className="ai-section-title-sparkle">
            <Briefcase size={14} className="ai-sparkle-icon" />
            <span>Advisory Focus Areas</span>
          </div>
          <div className="ai-followups-list">
            {suggestedFollowUps.map((item, idx) => (
              <button
                key={idx}
                className="ai-followup-pill"
                onClick={() => handleSend(item)}
                disabled={isLoading}
              >
                <span>{item}</span>
                <ChevronRight size={14} color="#94a3b8" />
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Grounded Advisory Status */}
        <div className="ai-sidebar-section" style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={16} color="#0ca678" />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
              Live Retail AI Intelligence
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            {uploadedFiles.length > 0
              ? `Guidance is cross-referenced with live LMS telemetry across 2 branches and ${uploadedFiles.length} connected dataset(s).`
              : 'Actively cross-referencing camera footfall telemetry, POS transactions, LMS certifications, and staff performance for Perinthalmanna & Edappally.'}
          </p>
        </div>

        {/* Footer */}
        <div className="ai-sidebar-footer">
          <span className="ai-last-updated-label">Consultation desk</span>
          <span className="ai-last-updated-time">Live • Senior Workforce Advisory Desk</span>
        </div>
        </aside>
      )}
    </div>
  );
}
