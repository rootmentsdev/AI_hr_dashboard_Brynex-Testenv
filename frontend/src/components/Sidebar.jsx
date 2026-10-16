import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Activity,
  UserCheck,
  BarChart3,
  Wallet,
  Clock,
  Send,
  CheckSquare,
  MessageSquare,
  Boxes,
  FileText,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  BrainCircuit,
  Database
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const [hrExpanded, setHrExpanded] = useState(true);

  useEffect(() => {
    if (location.pathname.startsWith('/intelligence/hr') || location.pathname.startsWith('/hr')) {
      setHrExpanded(true);
    }
  }, [location.pathname]);

  const toggleHr = (e) => {
    e.preventDefault();
    setHrExpanded((prev) => !prev);
  };

  const isHrActive = location.pathname.startsWith('/intelligence/hr') || location.pathname.startsWith('/hr');

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <BrainCircuit size={16} color="#ffffff" />
          </div>
          <span className="brand-title">AI Business Brain</span>
        </div>
        <button className="brand-more-btn" title="Options">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        {/* INTELLIGENCE ENGINES */}
        <div className="nav-section-title">INTELLIGENCE ENGINES</div>
        <div className="nav-group">
          <NavLink 
            to="/intelligence/hr" 
            className={`nav-item ${isHrActive && location.pathname === '/intelligence/hr' ? 'active' : ''}`}
          >
            <div className="nav-item-left">
              <UserCheck size={18} className="nav-icon" />
              <span>HR</span>
            </div>
            <button 
              type="button" 
              onClick={toggleHr}
              style={{ background: 'transparent', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '2px' }}
            >
              {hrExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          </NavLink>

          {/* Submenu for HR */}
          {hrExpanded && (
            <div className="nav-sub-menu">
              <NavLink 
                to="/intelligence/hr/data" 
                className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}
              >
                <Database size={14} className="nav-sub-icon" />
                <span>Data</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* AI TOOLS */}
        <div className="nav-section-title" style={{ marginTop: '16px' }}>AI TOOLS</div>
        <NavLink 
          to="/tasks" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-item-left">
            <CheckSquare size={18} className="nav-icon" />
            <span>AI Tasks</span>
          </div>
          <span className="badge badge-green">12</span>
        </NavLink>

        <NavLink 
          to="/assistant" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-item-left">
            <MessageSquare size={18} className="nav-icon" />
            <span>AI Assistant</span>
          </div>
          <span className="badge badge-mint">New</span>
        </NavLink>
      </nav>
    </aside>
  );
}
