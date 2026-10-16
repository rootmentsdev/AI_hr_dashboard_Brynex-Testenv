import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Search,
  Filter,
  Building,
  UserCheck,
  Mail,
  ChevronDown,
  Plus,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react';

export default function TeamRoles() {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch('/api/hr/employees');
        const json = await res.json();
        if (json.data) {
          setEmployees(json.data);
        }
      } catch (err) {
        console.warn('Could not load team data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const departments = ['All', 'Sales', 'Operations', 'Human Resources', 'Finance'];

  const filteredEmployees = employees.filter((emp) => {
    const matchSearch =
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = deptFilter === 'All' || emp.dept?.toLowerCase().includes(deptFilter.toLowerCase());
    return matchSearch && matchDept;
  });

  const getRoleAccessLevel = (role, dept) => {
    const r = (role || '').toLowerCase();
    if (r.includes('lead') || r.includes('manager') || r.includes('director')) return { label: 'Manager / Lead', bg: '#eff6ff', color: '#1d4ed8' };
    if (r.includes('admin') || dept === 'Human Resources') return { label: 'Admin Access', bg: '#faf5ff', color: '#7e22ce' };
    if (r.includes('senior') || r.includes('analyst')) return { label: 'Analyst Tier', bg: '#ecfdf5', color: '#047857' };
    return { label: 'Standard Staff', bg: '#f1f5f9', color: '#475569' };
  };

  const uniqueBranches = [...new Set(employees.map((e) => e.branch).filter(Boolean))];
  const totalPayrollNum = employees.reduce((sum, e) => {
    const val = parseFloat(String(e.salary || '').replace(/[^0-9.]/g, '')) || 0;
    return sum + val;
  }, 0);
  const formattedPayroll = totalPayrollNum >= 1000000 
    ? `$${(totalPayrollNum / 1000000).toFixed(2)}M` 
    : totalPayrollNum > 0 
      ? `$${(totalPayrollNum / 1000).toFixed(1)}k` 
      : '$0';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '4px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
          Team & Role Access Management
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
          Manage employee role permissions, access control tiers, and departmental assignments synchronized with HR records.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Synchronized Workforce</span>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px', borderRadius: '8px' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {employees.length} Members
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: employees.length > 0 ? '#10b981' : '#64748b', fontWeight: 600 }}>
            <UserCheck size={14} />
            <span>{employees.length > 0 ? '100% Active in Directory' : 'Awaiting Roster Ingestion'}</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Operating Branches</span>
            <div style={{ background: '#ecfdf5', color: '#10b981', padding: '6px', borderRadius: '8px' }}>
              <Building size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {uniqueBranches.length} {uniqueBranches.length === 1 ? 'Branch' : 'Branches'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
            <span>{uniqueBranches.length > 0 ? uniqueBranches.join(', ') : 'No branch telemetry'}</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Access Control Tiers</span>
            <div style={{ background: '#faf5ff', color: '#a855f7', padding: '6px', borderRadius: '8px' }}>
              <Shield size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            4 RBAC Tiers
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>
            <ShieldCheck size={14} />
            <span>Enterprise Security</span>
          </div>
        </div>

        <div className="metric-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#64748b' }}>Total Monthly Payroll</span>
            <div style={{ background: '#fff7ed', color: '#f97316', padding: '6px', borderRadius: '8px' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: '10px 0 4px 0' }}>
            {formattedPayroll}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
            <span>{employees.length > 0 ? 'Base + Overtime Estimated' : 'Awaiting Payroll Ingestion'}</span>
          </div>
        </div>
      </div>

      {/* Directory Table Card */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
        {/* Controls Bar: Search & Department Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setDeptFilter(dept)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: deptFilter === dept ? '#0f172a' : '#e2e8f0',
                  background: deptFilter === dept ? '#0f172a' : '#ffffff',
                  color: deptFilter === dept ? '#ffffff' : '#475569',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {dept}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', gap: '8px' }}>
              <Search size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search name, ID or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '220px', color: '#0f172a' }}
              />
            </div>

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={15} />
              <span>Assign Role</span>
            </button>
          </div>
        </div>

        {/* Employees Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Employee</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Department</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Branch</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Base Salary</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Access Tier</th>
                <th style={{ padding: '12px 10px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13.5px' }}>
                    No employee records found. Upload an employee master dataset in Data Management to view staff and assign access tiers.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                const access = getRoleAccessLevel(emp.role, emp.dept);
                return (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#e0e7ff',
                            color: '#4338ca',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '12px'
                          }}
                        >
                          {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px', color: '#334155', fontWeight: 500 }}>{emp.role}</td>
                    <td style={{ padding: '12px 10px', color: '#475569' }}>{emp.dept}</td>
                    <td style={{ padding: '12px 10px', color: '#475569' }}>{emp.branch}</td>
                    <td style={{ padding: '12px 10px', color: '#0f172a', fontWeight: 600 }}>{emp.salary}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: access.bg,
                          color: access.color
                        }}
                      >
                        {access.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: emp.risk?.includes('Critical') ? '#fee2e2' : emp.risk?.includes('High') ? '#fef3c7' : '#ecfdf5',
                          color: emp.risk?.includes('Critical') ? '#b91c1c' : emp.risk?.includes('High') ? '#b45309' : '#047857'
                        }}
                      >
                        {emp.risk?.includes('Critical') ? 'Notice Period' : 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
