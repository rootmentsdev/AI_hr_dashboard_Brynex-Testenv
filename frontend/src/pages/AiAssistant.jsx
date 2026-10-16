import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
  Cpu
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
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getStoredModel());
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'connected' | 'checking' | 'offline'
  const chatBottomRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'user',
      text: 'Why is attrition increasing?'
    },
    {
      id: 2,
      sender: 'assistant',
      title: 'Workforce Attrition Analysis (OpenRouter AI)',
      text: 'Based on connected HRMS and Finance telemetry, attrition increased from 5.0% to 7.8% over Q2 2026. Key insights:',
      bullets: [
        'Sales & Retail Frontline roles account for 68% of total exits (14 employees).',
        'Exit interviews highlight compensation disparity (-8.4% vs regional benchmark) and scheduling fatigue during peak shifts.',
        'Immediate cost impact: $42.6k increase in recruitment and overtime replacement costs.'
      ],
      model: 'OpenRouter AI'
    }
  ]);

  // Check OpenRouter connection on mount
  useEffect(() => {
    checkAiStatus().then((res) => {
      if (res && res.connected) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('offline');
      }
    });

    if (location.state?.initialPrompt) {
      handleSend(location.state.initialPrompt);
      window.history.replaceState({}, document.title);
    }
  }, []);

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

  // 4 Prompt Cards
  const promptCards = [
    {
      id: 'attrition',
      icon: <User size={16} />,
      text: 'Why has employee attrition increased and how do we solve it?'
    },
    {
      id: 'productivity',
      icon: <GitBranch size={16} />,
      text: 'Which branches have workforce productivity gaps?'
    },
    {
      id: 'spending',
      icon: <Wallet size={16} />,
      text: 'Are we spending efficiently on employee compensation and overtime?'
    },
    {
      id: 'recruitment',
      icon: <Briefcase size={16} />,
      text: 'Which recruitment vacancies need immediate attention?'
    }
  ];

  // Connected Sources
  const connectedSources = [
    {
      id: 'openrouter',
      name: 'OpenRouter AI',
      desc: 'Liquid LFM 2.5 / Gemma 4 Engine',
      iconClass: 'ai-source-icon-blue',
      icon: <BrainCircuit size={15} />
    },
    {
      id: 'hrms',
      name: 'HRMS Data',
      desc: 'Employees, attrition, performance',
      iconClass: 'ai-source-icon-green',
      icon: <Database size={15} />
    },
    {
      id: 'finance',
      name: 'Finance telemetry',
      desc: 'Costs, payroll, budget',
      iconClass: 'ai-source-icon-orange',
      icon: <Building size={15} />
    }
  ];

  // Suggested Follow-ups
  const suggestedFollowUps = [
    'Which departments have the highest attrition rate?',
    'How does attrition affect our hiring costs?',
    'What is the trend over the last 6 months?',
    'Compare attrition across branches',
    'Show me exit interview insights'
  ];

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
            {/* Model Selector */}
            <div className="ai-model-selector-wrap" title="Active OpenRouter AI Model">
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
            <div className="ai-status-pill-active" title="OpenRouter AI Live">
              <span className="ai-status-pill-dot"></span>
              <span>OpenRouter AI Active</span>
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
              <p>What would you like to understand about your workforce today?</p>
            </div>
          )}

          {/* 4 Prompt Cards Grid */}
          {messages.length <= 2 && (
            <div className="ai-prompt-cards-grid">
              {promptCards.map((card) => (
                <button
                  key={card.id}
                  className="ai-prompt-card"
                  onClick={() => handleSend(card.text)}
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
                        {msg.model || 'OpenRouter AI'}
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
                  <span className="ai-typing-text">OpenRouter AI is reasoning & analyzing data...</span>
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
            title="Attach file or data"
            onClick={() => alert('HRMS & Finance Telemetry connected directly via OpenRouter AI.')}
          >
            <Link2 size={18} />
          </button>
          <input
            type="text"
            className="ai-input-field"
            placeholder={isLoading ? 'AI is processing...' : 'Ask anything about workforce, attrition, roles, or costs...'}
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
        {/* Section 1: Connected Data Sources */}
        <div className="ai-sidebar-section">
          <div className="ai-section-title-sparkle">
            <Sparkles size={14} className="ai-sparkle-icon" />
            <span>Connected AI Engine & Data</span>
          </div>
          <div className="ai-sources-list">
            {connectedSources.map((source) => (
              <div key={source.id} className="ai-source-item">
                <div className="ai-source-left">
                  <div className={`ai-source-icon-wrap ${source.iconClass}`}>
                    {source.icon}
                  </div>
                  <div className="ai-source-info">
                    <h4>{source.name}</h4>
                    <p>{source.desc}</p>
                  </div>
                </div>
                <div className="ai-source-status">
                  <span className="ai-status-dot-green"></span>
                  <span>Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Suggested Follow-ups */}
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

        {/* Section 3: OpenRouter Intelligence Status */}
        <div className="ai-sidebar-section" style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <CheckCircle2 size={16} color="#0ca678" />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>OpenRouter Token Linked</span>
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            Connected to OpenRouter unified AI gateway with automated multi-model redundancy.
          </p>
        </div>

        {/* Footer */}
        <div className="ai-sidebar-footer">
          <span className="ai-last-updated-label">Engine status</span>
          <span className="ai-last-updated-time">Live • Zero Latency Gateway</span>
        </div>
      </aside>
    </div>
  );
}
