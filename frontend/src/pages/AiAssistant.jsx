import React, { useState } from 'react';
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
  Bot
} from 'lucide-react';
import './AiAssistant.css';

export default function AiAssistant() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'user',
      text: 'Why is attrition increasing?'
    },
    {
      id: 2,
      sender: 'assistant',
      title: 'Workforce Attrition Analysis',
      text: 'Based on connected HRMS and Finance telemetry, attrition increased from 5.0% to 7.8% over Q2 2026. Here are key insights:',
      bullets: [
        'Sales & Retail Frontline roles account for 68% of total exits (14 employees).',
        'Exit interviews highlight compensation disparity (-8.4% vs regional benchmark) and scheduling fatigue during peak shifts.',
        'Immediate cost impact: $42.6k increase in recruitment and overtime replacement costs.'
      ]
    }
  ]);

  // 4 Prompt Cards
  const promptCards = [
    {
      id: 'attrition',
      icon: <User size={16} />,
      text: 'Why has employee attrition increased?'
    },
    {
      id: 'productivity',
      icon: <GitBranch size={16} />,
      text: 'Which branches have workforce productivity gaps?'
    },
    {
      id: 'spending',
      icon: <Wallet size={16} />,
      text: 'Are we spending efficiently on employee costs?'
    },
    {
      id: 'recruitment',
      icon: <Briefcase size={16} />,
      text: 'Which recruitment vacancies need attention?'
    }
  ];

  // Connected Sources
  const connectedSources = [
    {
      id: 'hrms',
      name: 'HRMS',
      desc: 'Employee, attrition, performance',
      iconClass: 'ai-source-icon-blue',
      icon: <Database size={15} />
    },
    {
      id: 'finance',
      name: 'Finance',
      desc: 'Costs, compensation, budget',
      iconClass: 'ai-source-icon-green',
      icon: <Building size={15} />
    },
    {
      id: 'sales',
      name: 'Sales',
      desc: 'Revenue, team performance',
      iconClass: 'ai-source-icon-orange',
      icon: <ShoppingCart size={15} />
    }
  ];

  // Suggested Follow-ups
  const suggestedFollowUps = [
    'Which departments have the highest attrition r...',
    'How does attrition affect our hiring costs?',
    'What is the trend over the last 6 months?',
    'Compare attrition across branches',
    'Show me exit interview insights'
  ];

  const handleSend = (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    // Add user message
    const newMsg = { id: Date.now(), sender: 'user', text: query };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Generate intelligent AI response
    setTimeout(() => {
      let response = {
        id: Date.now() + 1,
        sender: 'assistant',
        title: `Intelligence Insights: ${query}`,
        text: `Cross-referencing real-time telemetry across HRMS, Finance, and Sales records:`,
        bullets: [
          'Calculated 94% correlation between shift overtime spikes and frontline employee retention decline.',
          'Financial model indicates a $1,200 retention stipend could yield $142k in net hiring cost savings.',
          'Auto-generated action item queued in HR Intelligence workstream for executive review.'
        ]
      };
      setMessages((prev) => [...prev, response]);
    }, 600);
  };

  const handleCardClick = (promptText) => {
    handleSend(promptText);
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
          <div className="ai-critical-badge">
            <TriangleAlert size={14} />
            <span>Critical Issue</span>
          </div>
        </div>

        {/* Center Hero / Greeting & Suggestions */}
        <div className="ai-chat-body">
          <div className="ai-welcome-hero">
            {/* Mascot Robot */}
            <div className="ai-mascot-wrapper">
              <img src={botLogo} alt="AI Bot Mascot" className="ai-mascot-img" />
            </div>
            <h3>Hello Good Morning!</h3>
            <p>What would you like to understand about your workforce?</p>
          </div>

          {/* 4 Prompt Cards Grid */}
          <div className="ai-prompt-cards-grid">
            {promptCards.map((card) => (
              <button
                key={card.id}
                className="ai-prompt-card"
                onClick={() => handleCardClick(card.text)}
              >
                <div className="ai-prompt-card-icon">{card.icon}</div>
                <div className="ai-prompt-card-text">{card.text}</div>
                <div className="ai-prompt-card-arrow">
                  <ArrowRight size={14} />
                </div>
              </button>
            ))}
          </div>

          {/* Active Conversation Stream */}
          {messages.length > 0 && (
            <div className="ai-conversation-stream">
              {messages.map((msg) => (
                <div key={msg.id} className={`ai-message-row ${msg.sender}`}>
                  {msg.sender === 'assistant' ? (
                    <div className="ai-assistant-bubble">
                      <h4>{msg.title}</h4>
                      <p>{msg.text}</p>
                      {msg.bullets && (
                        <ul>
                          {msg.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}
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
            </div>
          )}
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
            onClick={() => alert('Attach documents or data sheets for AI analysis')}
          >
            <Link2 size={18} />
          </button>
          <input
            type="text"
            className="ai-input-field"
            placeholder="Ask anything..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            type="button"
            className="ai-input-icon-btn"
            title="Voice Input"
            onClick={() => alert('Listening for voice prompt...')}
          >
            <Mic size={18} />
          </button>
          <button type="submit" className="ai-send-btn" title="Send Message">
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
            <span>Connected Data Sources</span>
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
                  <span>Connected</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Suggested Follow-ups */}
        <div className="ai-sidebar-section">
          <div className="ai-section-title-sparkle">
            <Sparkles size={14} className="ai-sparkle-icon" />
            <span>Suggested Follow-ups</span>
          </div>
          <div className="ai-followups-list">
            {suggestedFollowUps.map((item, idx) => (
              <button
                key={idx}
                className="ai-followup-pill"
                onClick={() => handleSend(item)}
              >
                <span>{item}</span>
                {idx === suggestedFollowUps.length - 1 && <ChevronRight size={14} color="#94a3b8" />}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="ai-sidebar-footer">
          <span className="ai-last-updated-label">Last updated</span>
          <span className="ai-last-updated-time">Sep 19, 2026 • 10:24 AM</span>
        </div>
      </aside>
    </div>
  );
}
