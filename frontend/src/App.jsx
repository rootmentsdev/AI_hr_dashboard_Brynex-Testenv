import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Main pages
import AiWorkspace from './pages/AiWorkspace';
import BusinessHealth from './pages/BusinessHealth';

// Intelligence Engines
import HrIntelligence from './pages/HrIntelligence';
import HrData from './pages/HrData';
import SalesIntelligence from './pages/SalesIntelligence';
import FinanceIntelligence from './pages/FinanceIntelligence';
import OperationsIntelligence from './pages/OperationsIntelligence';
import MarketingIntelligence from './pages/MarketingIntelligence';

// AI Tools
import AiTasks from './pages/AiTasks';
import AiAssistant from './pages/AiAssistant';

// System & General
import Integrations from './pages/Integrations';
import Reports from './pages/Reports';
import TeamRoles from './pages/TeamRoles';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/workspace" replace />} />
          <Route path="workspace" element={<AiWorkspace />} />
          <Route path="business-health" element={<BusinessHealth />} />
          
          {/* Intelligence Engines */}
          <Route path="intelligence/hr" element={<HrIntelligence />} />
          <Route path="intelligence/hr/data" element={<HrData />} />
          <Route path="intelligence/sales" element={<SalesIntelligence />} />
          <Route path="intelligence/finance" element={<FinanceIntelligence />} />
          <Route path="intelligence/operations" element={<OperationsIntelligence />} />
          <Route path="intelligence/marketing" element={<MarketingIntelligence />} />
          
          {/* Short aliases for intelligence routes */}
          <Route path="hr/data" element={<Navigate to="/intelligence/hr/data" replace />} />
          <Route path="hr" element={<Navigate to="/intelligence/hr" replace />} />
          <Route path="sales" element={<Navigate to="/intelligence/sales" replace />} />
          <Route path="finance" element={<Navigate to="/intelligence/finance" replace />} />
          <Route path="operations" element={<Navigate to="/intelligence/operations" replace />} />
          <Route path="marketing" element={<Navigate to="/intelligence/marketing" replace />} />

          {/* AI Tools */}
          <Route path="tasks" element={<AiTasks />} />
          <Route path="ai-tasks" element={<Navigate to="/tasks" replace />} />
          <Route path="assistant" element={<AiAssistant />} />
          <Route path="ai-assistant" element={<Navigate to="/assistant" replace />} />

          {/* System & General */}
          <Route path="integrations" element={<Integrations />} />
          <Route path="reports" element={<Reports />} />
          <Route path="team" element={<TeamRoles />} />
          <Route path="team-roles" element={<Navigate to="/team" replace />} />
          <Route path="settings" element={<Settings />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
