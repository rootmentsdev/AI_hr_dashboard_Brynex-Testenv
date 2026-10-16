import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Key,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  Sparkles,
  Sliders,
  ShieldCheck,
  Server
} from 'lucide-react';
import {
  getStoredApiKey,
  setStoredApiKey,
  getStoredModel,
  setStoredModel,
  AVAILABLE_MODELS,
  checkAiStatus,
  sendChatMessage
} from '../services/aiService';

export default function Settings() {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getStoredModel());
  const [temperature, setTemperature] = useState(0.7);
  const [status, setStatus] = useState({ state: 'checking', message: 'Checking OpenRouter connection...' });
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Quick sandbox test state
  const [sandboxPrompt, setSandboxPrompt] = useState('Analyze frontline workforce retention strategy');
  const [sandboxResponse, setSandboxResponse] = useState('');
  const [sandboxLoading, setSandboxLoading] = useState(false);

  useEffect(() => {
    runStatusCheck();
  }, []);

  const runStatusCheck = async () => {
    setStatus({ state: 'checking', message: 'Verifying OpenRouter credentials...' });
    const res = await checkAiStatus();
    if (res && res.connected) {
      setStatus({
        state: 'connected',
        provider: res.provider || 'OpenRouter AI',
        quota: res.data?.free_model_daily_requests
          ? `${res.data.free_model_daily_requests.remaining} / ${res.data.free_model_daily_requests.limit} daily free requests remaining`
          : 'Active Unlimited / Free Tier',
        userId: res.data?.creator_user_id || 'Connected'
      });
    } else {
      setStatus({
        state: 'error',
        message: res?.error || 'Unable to connect to OpenRouter with current credentials.'
      });
    }
  };

  const handleSave = () => {
    setStoredApiKey(apiKey.trim());
    setStoredModel(selectedModel);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
    runStatusCheck();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const startTime = Date.now();
    try {
      const res = await sendChatMessage([{ sender: 'user', text: 'Ping test' }], {
        model: selectedModel,
        temperature: 0.2
      });
      const latency = Date.now() - startTime;
      setTestResult({
        success: true,
        latency,
        model: res.model,
        sample: res.content.slice(0, 100) + '...'
      });
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunSandbox = async (e) => {
    e.preventDefault();
    if (!sandboxPrompt.trim() || sandboxLoading) return;
    setSandboxLoading(true);
    setSandboxResponse('');
    try {
      const res = await sendChatMessage([{ sender: 'user', text: sandboxPrompt }], {
        model: selectedModel,
        temperature
      });
      setSandboxResponse(res.content);
    } catch (err) {
      setSandboxResponse(`Error: ${err.message}`);
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', color: '#1e293b' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 style={{ color: '#0f172a', fontSize: '24px', fontWeight: 600 }}>System Settings & AI Configuration</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Manage OpenRouter AI connection, model parameters, and intelligence gateway.
        </p>
      </div>

      {saveToast && (
        <div
          style={{
            background: '#e6fcf5',
            border: '1px solid #0ca678',
            color: '#0ca678',
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13.5px',
            fontWeight: 500
          }}
        >
          <CheckCircle2 size={16} />
          <span>Configuration saved successfully and applied to AI assistant!</span>
        </div>
      )}

      {/* Main Grid: AI Connection Status + Model Config */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Left Column: OpenRouter Credentials & Parameters */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#e6fcf5',
                color: '#0ca678',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Key size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                OpenRouter AI Token
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Enterprise LLM gateway connecting Liquid, Gemma, Nemotron, and Llama models
              </p>
            </div>
          </div>

          {/* API Key Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              API Token (Bearer Authorization)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    background: '#f8fafc'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Primary Model Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              Default AI Reasoning Engine
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.provider}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Automatic failover is active. If your preferred model is rate-limited, requests route to backup models seamlessly.
            </p>
          </div>

          {/* Temperature Slider */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                Reasoning Temperature: <span style={{ color: '#0ca678' }}>{temperature}</span>
              </label>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {temperature < 0.4 ? 'Strict & Analytical' : temperature > 0.8 ? 'Creative & Exploratory' : 'Balanced'}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#0ca678', cursor: 'pointer' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                background: '#0ca678',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <ShieldCheck size={16} />
              <span>Save & Apply Settings</span>
            </button>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              style={{
                background: '#f1f5f9',
                color: '#334155',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: '1px solid #cbd5e1',
                cursor: isTesting ? 'wait' : 'pointer'
              }}
            >
              <RefreshCw size={15} className={isTesting ? 'spin' : ''} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>

          {/* Test Result Display */}
          {testResult && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: '8px',
                background: testResult.success ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`,
                fontSize: '12px',
                color: testResult.success ? '#166534' : '#991b1b'
              }}
            >
              {testResult.success ? (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                    ✓ OpenRouter Connection Verified ({testResult.latency}ms)
                  </div>
                  <div style={{ color: '#4b5563' }}>Model responded: {testResult.model}</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600 }}>Connection Test Failed</div>
                  <div>{testResult.error}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Connection Health & Live Sandbox */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Health Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={18} color="#0ca678" />
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Gateway Status</h3>
              </div>
              <button
                onClick={runStatusCheck}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                title="Refresh Status"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}
              >
                <span style={{ fontSize: '12px', color: '#64748b' }}>Status</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: status.state === 'connected' ? '#0ca678' : '#e11d48'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: status.state === 'connected' ? '#0ca678' : '#e11d48'
                    }}
                  />
                  {status.state === 'connected' ? 'Connected & Verified' : 'Checking / Standalone'}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}
              >
                <span style={{ fontSize: '12px', color: '#64748b' }}>Provider</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                  {status.provider || 'OpenRouter AI'}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}
              >
                <span style={{ fontSize: '12px', color: '#64748b' }}>Daily Rate Quota</span>
                <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#0ca678' }}>
                  {status.quota || '50 requests / day (Free tier)'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick AI Sandbox Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={16} color="#0ca678" />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Live Test Playground
              </h3>
            </div>
            <form onSubmit={handleRunSandbox} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={sandboxPrompt}
                onChange={(e) => setSandboxPrompt(e.target.value)}
                placeholder="Ask prompt to test..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={sandboxLoading}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: sandboxLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send size={12} />
                <span>{sandboxLoading ? 'Running...' : 'Run'}</span>
              </button>
            </form>

            <div
              style={{
                flex: 1,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                lineHeight: 1.5,
                color: '#334155',
                maxHeight: '160px',
                overflowY: 'auto'
              }}
            >
              {sandboxLoading ? (
                <span style={{ color: '#64748b', fontStyle: 'italic' }}>
                  Streaming response from OpenRouter...
                </span>
              ) : sandboxResponse ? (
                <div style={{ whiteSpace: 'pre-wrap' }}>{sandboxResponse}</div>
              ) : (
                <span style={{ color: '#94a3b8' }}>
                  Submit a prompt above to verify real-time inference on {selectedModel.split('/')[1] || selectedModel}.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
