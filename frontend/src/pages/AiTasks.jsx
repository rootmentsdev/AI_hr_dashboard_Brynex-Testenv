import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Sparkles,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  Bot
} from 'lucide-react';
import { sendChatMessage, getDeployedTasks } from '../services/aiService';

export default function AiTasks() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Analyze frontline retail shift attrition patterns',
      category: 'HR Intelligence',
      status: 'pending',
      priority: 'High',
      aiOutput: null
    },
    {
      id: 2,
      title: 'Benchmark Q3 sales compensation against regional industry average',
      category: 'Compensation',
      status: 'completed',
      priority: 'Medium',
      aiOutput: 'Telemetry confirmed 8.4% compensation delta in Sales Retail. Recommended $1,200 retention incentive.'
    },
    {
      id: 3,
      title: 'Generate exit interview sentiment synthesis for West Branch',
      category: 'HR Operations',
      status: 'pending',
      priority: 'Urgent',
      aiOutput: null
    },
    {
      id: 4,
      title: 'Evaluate shift scheduling fatigue vs overtime expenditure',
      category: 'Workforce Planning',
      status: 'pending',
      priority: 'Medium',
      aiOutput: null
    }
  ]);

  useEffect(() => {
    const deployed = getDeployedTasks();
    if (deployed && deployed.length > 0) {
      setTasks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const newItems = deployed.filter((t) => !existingIds.has(t.id));
        return [...newItems, ...prev];
      });
    }
  }, []);
  const [activeRunningId, setActiveRunningId] = useState(null);
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);

  const handleRunTask = async (task) => {
    setActiveRunningId(task.id);
    try {
      const res = await sendChatMessage([
        {
          sender: 'user',
          text: `Execute AI analysis for workforce task: "${task.title}". Provide: 1. Core Finding, 2. Root Cause, 3. Immediate Recommended Action.`
        }
      ]);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: 'completed',
                aiOutput: res.content
              }
            : t
        )
      );
    } catch (err) {
      alert(`Error running AI task: ${err.message}`);
    } finally {
      setActiveRunningId(null);
    }
  };

  const handleGenerateAiTasks = async () => {
    setIsGeneratingNew(true);
    try {
      const res = await sendChatMessage([
        {
          sender: 'user',
          text: 'Generate 2 new high-priority, realistic HR/workforce intelligence task action items for our corporate dashboard. Format each task as: "Task: [Title] | Category: [Category]". Keep it concise.'
        }
      ]);

      const lines = res.content.split('\n').filter((l) => l.includes('Task:'));
      const newItems = lines.map((l, i) => {
        const parts = l.split('|');
        const title = parts[0]?.replace(/^[-*•\d.\s]*Task:\s*/i, '').trim() || 'Workforce AI Audit Task';
        const category = parts[1]?.replace(/Category:\s*/i, '').trim() || 'Workforce Analytics';
        return {
          id: Date.now() + i,
          title,
          category,
          status: 'pending',
          priority: 'High',
          aiOutput: null
        };
      });

      if (newItems.length > 0) {
        setTasks((prev) => [...newItems, ...prev]);
      } else {
        setTasks((prev) => [
          {
            id: Date.now(),
            title: 'Audit frontline manager retention coaching impact',
            category: 'Leadership HR',
            status: 'pending',
            priority: 'High',
            aiOutput: null
          },
          ...prev
        ]);
      }
    } catch (err) {
      alert(`Error generating tasks: ${err.message}`);
    } finally {
      setIsGeneratingNew(false);
    }
  };

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#1e293b' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ color: '#0f172a', fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
            AI Task Automation Queue
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Automated intelligence tasks executed directly via OpenRouter AI engine.
          </p>
        </div>

        <button
          onClick={handleGenerateAiTasks}
          disabled={isGeneratingNew}
          style={{
            background: '#0ca678',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isGeneratingNew ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(12, 166, 120, 0.25)'
          }}
        >
          <Sparkles size={16} />
          <span>{isGeneratingNew ? 'Reasoning with OpenRouter...' : 'Generate AI Action Tasks'}</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Pending AI Execution
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
            {pendingCount}
          </div>
          <span style={{ fontSize: '11px', color: '#eab308', background: '#fef9c3', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '6px' }}>
            Ready to execute
          </span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            AI Completed Today
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0ca678', marginTop: '6px' }}>
            {completedCount}
          </div>
          <span style={{ fontSize: '11px', color: '#0ca678', background: '#e6fcf5', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '6px' }}>
            Success (100%)
          </span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Connected Engine
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginTop: '8px' }}>
            OpenRouter AI
          </div>
          <span style={{ fontSize: '11px', color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '6px' }}>
            Multi-model failover active
          </span>
        </div>
      </div>

      {/* Task List */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Task Queue & Agent Execution
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Click "Execute with AI" to run real-time inference on any task
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tasks.map((task) => {
            const isRunning = activeRunningId === task.id;
            return (
              <div
                key={task.id}
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: task.status === 'completed' ? '#e6fcf5' : '#f1f5f9',
                        color: task.status === 'completed' ? '#0ca678' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {task.status === 'completed' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                        {task.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{task.category}</span>
                        <span style={{ fontSize: '10px', color: '#cbd5e1' }}>•</span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            color: task.priority === 'Urgent' ? '#ef4444' : task.priority === 'High' ? '#f97316' : '#64748b'
                          }}
                        >
                          {task.priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {task.status === 'completed' ? (
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#0ca678',
                          background: '#e6fcf5',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle2 size={13} /> Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRunTask(task)}
                        disabled={isRunning}
                        style={{
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '7px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: isRunning ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Play size={12} fill="#ffffff" />
                        <span>{isRunning ? 'Processing...' : 'Execute with AI'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Output preview */}
                {task.aiOutput && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      color: '#334155',
                      whiteSpace: 'pre-wrap',
                      marginLeft: '44px'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#0ca678', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={12} /> OpenRouter AI Telemetry Synthesis:
                    </div>
                    {task.aiOutput}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
