import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import botLogo from '../assets/bot-logo.png';
import {
  BrainCircuit,
  TriangleAlert,
  User,
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
  Bot,
  RotateCcw,
  Cpu,
  FileSpreadsheet,
  UploadCloud,
  Clock,
  Plus
} from 'lucide-react';
import {
  sendChatMessage,
  checkAiStatus,
  AVAILABLE_MODELS,
  getStoredModel,
  setStoredModel
} from '../services/aiService';
import './AiAssistant.css';

// Helper to render AI markdown-style text with bolding and lists
function FormattedAiContent({ content, bullets, title }) {
  if (bullets && bullets.length > 0) {
    return (
      <div className="ai-rendered-content">
        {title && <h4>{title}</h4>}
        {content && <p>{content}</p>}
        <ul>
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
    );
  }

  // Parse lines for markdown-style bullets and bold
  const lines = (content || '').split('\n');
  const renderedElements = [];
  let currentBullets = [];

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      renderedElements.push(
        <ul key={`ul-${renderedElements.length}`}>
          {currentBullets.map((b, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: b }} />
          ))}
        </ul>
      );
      currentBullets = [];
    }
  };

  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBullets();
      return;
    }

    // Check if line is bullet list or numbered list
    const isBullet = /^[-*•]\s+(.+)/.exec(trimmed);
    const isNumbered = /^\d+\.\s+(.+)/.exec(trimmed);

    if (isBullet) {
      currentBullets.push(formatText(isBullet[1]));
    } else if (isNumbered) {
      currentBullets.push(formatText(isNumbered[1]));
    } else {
      flushBullets();
      renderedElements.push(
        <p
          key={`p-${index}`}
          dangerouslySetInnerHTML={{ __html: formatText(trimmed) }}
        />
      );
    }
  });

  flushBullets();

  return (
    <div className="ai-rendered-content">
      {title && <h4>{title}</h4>}
      {renderedElements}
    </div>
  );
}

export default function AiAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getStoredModel());
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'connected' | 'checking' | 'offline'
  const chatBottomRef = useRef(null);

  // Live connected datasets state from backend
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [latestAnalysis, setLatestAnalysis] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Hello! I am your Brynex AI Workforce Intelligence Copilot powered by Claude. How can I assist you with your workforce analytics, shift telemetry, or labor optimization today?',
      model: 'Claude 4.5 Haiku'
    }
  ]);

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
        const [filesRes, analysisRes] = await Promise.all([
          fetch('/api/hr/files'),
          fetch('/api/hr/analysis')
        ]);
        const filesData = await filesRes.json();
        const analysisData = await analysisRes.json();
        if (filesData.status === 'success' && filesData.files) {
          setUploadedFiles(filesData.files);
        }
        if (analysisData.status === 'success' && analysisData.data) {
          setLatestAnalysis(analysisData.data);
        }
      } catch (err) {
        console.warn('Could not load connected datasets in assistant:', err);
      }
    };
    fetchDatasets();

    if (location.state?.initialPrompt) {
      handleSend(location.state.initialPrompt);
      window.history.replaceState({}, document.title);
    }
  }, []);

  // Total records across connected datasets
  const totalConnectedRecords = useMemo(() => {
    return uploadedFiles.reduce((acc, f) => acc + (f.rows || 0), 0);
  }, [uploadedFiles]);

  // Auto-scroll chat stream
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    setStoredModel(newModel);
  };

  // 4 Prompt Cards generated dynamically based on connected CSV data
  const promptCards = useMemo(() => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return [
        {
          id: 'upload-dataset',
          icon: <UploadCloud size={16} />,
          text: 'Upload workforce or attendance CSV in Data Management to analyze company numbers',
          isUpload: true
        },
        {
          id: 'retention-best-practice',
          icon: <User size={16} />,
          text: 'What are proven management strategies to reduce frontline employee attrition?'
        },
        {
          id: 'labor-cost-calc',
          icon: <Wallet size={16} />,
          text: 'How do I calculate labor cost percentage and overtime efficiency?'
        },
        {
          id: 'shift-turnaround-rules',
          icon: <Clock size={16} />,
          text: 'What are standard legal regulations for shift turnaround rest intervals?'
        }
      ];
    }

    const cards = [];
    const attentionItems = latestAnalysis?.attentionItems || [];

    if (attentionItems.length > 0) {
      const item1 = attentionItems[0];
      cards.push({
        id: 'issue-1',
        icon: <TriangleAlert size={16} />,
        text: `Why did "${item1.title.slice(0, 52)}..." occur and what is the recommended remedy?`
      });

      if (attentionItems.length > 1) {
        const item2 = attentionItems[1];
        cards.push({
          id: 'issue-2',
          icon: <GitBranch size={16} />,
          text: `Analyze "${item2.title.slice(0, 52)}..." across affected departments`
        });
      }
    }

    const hasAttendance = uploadedFiles.some((f) =>
      f.name.toLowerCase().includes('attend') || f.name.toLowerCase().includes('roster') || f.holds?.includes('Attendance')
    );
    const hasEmployees = uploadedFiles.some((f) =>
      f.name.toLowerCase().includes('employee') || f.name.toLowerCase().includes('staff') || f.holds?.includes('Payroll') || f.holds?.includes('People')
    );
    const hasSales = uploadedFiles.some((f) =>
      f.name.toLowerCase().includes('sale') || f.name.toLowerCase().includes('revenue') || f.holds?.includes('Revenue')
    );

    if (hasAttendance && cards.length < 4) {
      cards.push({
        id: 'att-rest',
        icon: <Clock size={16} />,
        text: 'Which employees have rest turnaround intervals under 10 hours or overtime spikes in our roster?'
      });
    }

    if (hasEmployees && cards.length < 4) {
      cards.push({
        id: 'emp-retention',
        icon: <User size={16} />,
        text: 'Which employees are currently in notice period or at critical retention risk?'
      });
    }

    if (hasSales && cards.length < 4) {
      cards.push({
        id: 'sales-productivity',
        icon: <ShoppingCart size={16} />,
        text: 'Compare sales revenue vs labor payroll expenditure across our store branches'
      });
    }

    if (cards.length < 4) {
      cards.push({
        id: 'gen-summary',
        icon: <Sparkles size={16} />,
        text: `Summarize key executive risks and opportunities across our ${uploadedFiles.length} connected dataset(s)`
      });
    }

    return cards.slice(0, 4);
  }, [uploadedFiles, latestAnalysis]);

  // Suggested Follow-ups derived dynamically from connected datasets
  const suggestedFollowUps = useMemo(() => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return [
        'How does employee turnover impact organizational hiring costs?',
        'What are standard shift rest turnaround compliance benchmarks?',
        'How to calculate optimal payroll to gross revenue ratio?',
        'Best management practices for reducing closing shift fatigue',
        'Connect a CSV in Data Management for live file analysis'
      ];
    }

    const list = [];
    if (latestAnalysis?.attentionItems?.length > 0) {
      latestAnalysis.attentionItems.forEach((item) => {
        list.push(`What is Option A vs Option B for ${item.title.slice(0, 36)}...?`);
      });
    }

    uploadedFiles.forEach((f) => {
      const lower = f.name.toLowerCase();
      if (lower.includes('attend') || f.holds?.includes('Attendance')) {
        list.push('Which employees recorded rest intervals under 10 hours?');
        list.push('Analyze closing shift productivity (82%) vs morning shifts');
      }
      if (lower.includes('employee') || f.holds?.includes('Payroll') || f.holds?.includes('People')) {
        list.push('List employees currently in notice period or probation');
        list.push('What is our monthly payroll cost breakdown by role?');
      }
      if (lower.includes('sale') || f.holds?.includes('Revenue')) {
        list.push('Which branch generated the highest daily sales revenue?');
      }
    });

    list.push('Give me an executive bullet-point summary of our connected data');
    return Array.from(new Set(list)).slice(0, 5);
  }, [uploadedFiles, latestAnalysis]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    // Add user message
    const userMsg = { id: Date.now(), sender: 'user', text: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(updatedMessages, {
        model: selectedModel
      });

      const assistantMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: response.content,
        model: response.model || selectedModel,
        source: response.source
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('AI chat failed:', err);
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        title: 'AI Connection Notice',
        text: `Unable to get response: ${err.message || 'Error communicating with OpenRouter.'} Please verify your API key in Settings or check model status.`,
        isError: true
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'assistant',
        title: 'New Conversation Started',
        text: 'How can I assist with your workforce, HR telemetry, or enterprise analytics today?',
        model: selectedModel
      }
    ]);
  };

  return (
    <div className="ai-assistant-container">
      {/* Left Main Column: Chat + Hero + Prompts + Input */}
      <div className="ai-chat-main-column">
        {/* Top Header */}
        <div className="ai-assistant-header">
          <div className="ai-header-left">
            <div className="ai-header-icon-pill">
              <BrainCircuit size={20} />
            </div>
            <div className="ai-header-text">
              <h2>AI Assistant</h2>
              <p>Understand your workforce. Discover what matters. Decide what to do next.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Connected Dataset Indicator Pill */}
            <button
              type="button"
              className={`ai-dataset-header-pill ${uploadedFiles.length > 0 ? 'has-data' : ''}`}
              onClick={() => navigate('/intelligence/hr/data')}
              title={uploadedFiles.length > 0 ? 'Click to manage connected datasets' : 'Click to connect a CSV or Excel file'}
            >
              <FileSpreadsheet size={13} color={uploadedFiles.length > 0 ? '#0ca678' : '#64748b'} />
              <span>
                {uploadedFiles.length > 0
                  ? `${uploadedFiles.length} Connected CSV (${totalConnectedRecords.toLocaleString()} records)`
                  : 'No CSV Connected (Click to upload)'}
              </span>
            </button>

            {/* Model Selector */}
            <div className="ai-model-selector-wrap" title="Active AI Intelligence Engine">
              <Cpu size={14} color="#0ca678" />
              <select
                className="ai-model-select"
                value={selectedModel}
                onChange={handleModelChange}
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Connection Status Badge */}
            <div
              className={connectionStatus === 'offline' ? 'ai-status-pill-offline' : 'ai-status-pill-active'}
              title="Intelligence Gateway Live"
            >
              <span className="ai-status-pill-dot"></span>
              <span>{selectedModel.startsWith('claude') ? 'Claude AI Live' : 'OpenRouter Live'}</span>
            </div>

            {/* Reset Chat */}
            <button
              onClick={handleClearChat}
              style={{
                background: 'transparent',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
              title="Clear & Reset Conversation"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Center Hero / Greeting & Suggestions */}
        <div className="ai-chat-body">
          {messages.length <= 2 && (
            <div className="ai-welcome-hero">
              {/* Mascot Robot */}
              <div className="ai-mascot-wrapper">
                <img src={botLogo} alt="AI Bot Mascot" className="ai-mascot-img" />
              </div>
              <h3>Hello Good Morning!</h3>
              <p>
                {uploadedFiles.length > 0
                  ? `Connected to ${uploadedFiles.map((f) => `"${f.name}"`).join(', ')}. Ask anything about your data, or chat generally.`
                  : 'What would you like to understand about your workforce today?'}
              </p>
            </div>
          )}

          {/* 4 Prompt Cards Grid */}
          {messages.length <= 2 && (
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
                  <div className="ai-prompt-card-icon">{card.icon}</div>
                  <div className="ai-prompt-card-text">{card.text}</div>
                  <div className="ai-prompt-card-arrow">
                    <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Active Conversation Stream */}
          <div className="ai-conversation-stream" style={{ maxHeight: messages.length > 2 ? '540px' : '320px' }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-message-row ${msg.sender}`}>
                {msg.sender === 'assistant' ? (
                  <div className={`ai-assistant-bubble ${msg.isError ? 'ai-bubble-error' : ''}`}>
                    <FormattedAiContent
                      content={msg.text}
                      bullets={msg.bullets}
                      title={msg.title}
                    />
                    <div className="ai-rendered-footer">
                      <span className="ai-model-tag">
                        <Sparkles size={11} color="#0ca678" />
                        {msg.model || 'Claude AI'}
                      </span>
                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="ai-user-bubble">{msg.text}</div>
                    <div className="ai-user-avatar">
                      <User size={16} />
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Live Typing / Thinking Indicator */}
            {isLoading && (
              <div className="ai-message-row assistant">
                <div className="ai-typing-indicator">
                  <div className="ai-typing-dots">
                    <span className="ai-typing-dot"></span>
                    <span className="ai-typing-dot"></span>
                    <span className="ai-typing-dot"></span>
                  </div>
                  <span className="ai-typing-text">
                    {uploadedFiles.length > 0
                      ? 'Claude is analyzing your connected datasets & reasoning...'
                      : 'Claude AI is reasoning & composing response...'}
                  </span>
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
            title="Manage or attach CSV datasets"
            onClick={() => navigate('/intelligence/hr/data')}
          >
            <Link2 size={18} />
          </button>
          <input
            type="text"
            className="ai-input-field"
            placeholder={
              isLoading
                ? 'Claude is analyzing...'
                : uploadedFiles.length > 0
                ? `Ask Claude about "${uploadedFiles[0].name}" or general topics...`
                : 'Ask anything about workforce, attrition, roles, or general questions...'
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

      {/* Right Sidebar: Connected Data Sources & Suggested Follow-ups */}
      <aside className="ai-sidebar-panel">
        {/* Section 1: Connected AI Engine & Live Uploaded CSV Data */}
        <div className="ai-sidebar-section">
          <div className="ai-section-title-sparkle">
            <Sparkles size={14} className="ai-sparkle-icon" />
            <span>Connected AI Engine & Data</span>
          </div>
          <div className="ai-sources-list">
            {/* Core AI Intelligence Engine */}
            <div className="ai-source-item">
              <div className="ai-source-left">
                <div className="ai-source-icon-wrap ai-source-icon-blue">
                  <BrainCircuit size={15} />
                </div>
                <div className="ai-source-info">
                  <h4>Anthropic Claude AI</h4>
                  <p>Claude 4.5 Haiku & Sonnet Core</p>
                </div>
              </div>
              <div className="ai-source-status">
                <span className="ai-status-dot-green"></span>
                <span>Active</span>
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
                        {file.rows ? `${file.rows.toLocaleString()} rows • ` : ''}
                        {file.holds || 'Dataset'}
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
                style={{
                  background: '#f8fafc',
                  padding: '14px 12px',
                  borderRadius: '10px',
                  border: '1px dashed #cbd5e1',
                  textAlign: 'center'
                }}
              >
                <Database size={20} color="#94a3b8" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                  No CSV Connected
                </div>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                  Connect employee master, attendance, or sales CSV to query live numbers.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/intelligence/hr/data')}
                  style={{
                    background: '#0ca678',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={13} />
                  <span>Connect CSV</span>
                </button>
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
              <span>Connect Another CSV</span>
            </button>
          )}
        </div>

        {/* Section 2: Dynamically Generated Suggested Inquiries */}
        <div className="ai-sidebar-section">
          <div className="ai-section-title-sparkle">
            <Sparkles size={14} className="ai-sparkle-icon" />
            <span>Suggested Inquiries</span>
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

        {/* Section 3: Grounded AI Status */}
        <div className="ai-sidebar-section" style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <CheckCircle2 size={16} color="#0ca678" />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
              {uploadedFiles.length > 0 ? 'Document Context Active' : 'Conversational AI Ready'}
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            {uploadedFiles.length > 0
              ? `Queries are cross-referenced with your ${uploadedFiles.length} connected dataset(s) for evidence-backed answers.`
              : 'Ask general business, management, HR, or operational questions, or upload a dataset to enable document grounding.'}
          </p>
        </div>

        {/* Footer */}
        <div className="ai-sidebar-footer">
          <span className="ai-last-updated-label">Engine status</span>
          <span className="ai-last-updated-time">Live • Claude AI Enterprise Brain</span>
        </div>
      </aside>
    </div>
  );
}
