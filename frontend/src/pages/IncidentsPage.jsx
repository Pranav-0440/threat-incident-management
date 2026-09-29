import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import IncidentCard from '../components/IncidentCard';
import SearchBar from '../components/SearchBar';
import { exportIncidentsCSV } from '../utils/exportUtils';
import { subscribeToIncidentUpdates } from '../utils/incidentCollaboration';
import { PlusCircle, AlertTriangle, Download, Star, Filter, RotateCcw } from 'lucide-react';

const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PRIORITY_FILTERS = ['ALL', 'P1', 'P2', 'P3', 'P4'];
const STATUS_FILTERS = ['ALL', 'OPEN', 'INVESTIGATING', 'WAITING_EVIDENCE', 'RESOLVED', 'CLOSED'];
const CATEGORY_FILTERS = ['ALL', 'WORKPLACE_VIOLENCE', 'THREAT', 'SUSPICIOUS_ACTIVITY', 'CYBER_THREAT', 'PHYSICAL_SECURITY'];

export default function IncidentsPage() {
  const { user, token } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Workspace Tabs
  const [workspaceTab, setWorkspaceTab] = useState('ALL'); // ALL, ASSIGNED_TO_ME, REPORTED_BY_ME, RESOLVED

  // Filter States
  const [severityFilters, setSeverityFilters] = useState([]);
  const [priorityFilters, setPriorityFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState([]);
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      try {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        const serverQuery = normalizedQuery.includes(':') || normalizedQuery === 'today'
          ? ''
          : searchQuery;
        const res = await incidentsAPI.getFiltered({
          query: serverQuery,
          severities: severityFilters,
          priorities: priorityFilters,
          statuses: statusFilters,
          categories: categoryFilters,
          startDate,
          endDate,
        });
        const sorted = (res.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setIncidents(sorted);
      } catch (err) {
        console.error('Failed to fetch filtered incidents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [searchQuery, severityFilters, priorityFilters, statusFilters, categoryFilters, startDate, endDate]);

  const resetFilters = () => {
    setSeverityFilters([]);
    setPriorityFilters([]);
    setStatusFilters([]);
    setCategoryFilters([]);
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setWorkspaceTab('ALL');
  };

  const updateMultiSelect = (event, setter) => {
    setter(Array.from(event.target.selectedOptions, (option) => option.value));
  };

  useEffect(() => subscribeToIncidentUpdates(token, (event) => {
    if (event.eventType !== 'INCIDENT_STATUS_CHANGED') return;
    setIncidents((current) => current.map((incident) => (
      incident.id === event.incidentId
        ? { ...incident, status: event.status, updatedAt: event.occurredAt }
        : incident
    )));
  }), [token]);

  const handleApplyPreset = (presetName) => {
    resetFilters();

    if (presetName === 'P1_CRITICAL') {
      setPriorityFilters(['P1']);
    } else if (presetName === 'ASSIGNED_ME') {
      setWorkspaceTab('ASSIGNED_TO_ME');
    } else if (presetName === 'HIGH_RISK') {
      setSearchQuery('risk:high');
    } else if (presetName === 'TODAY') {
      setSearchQuery('today');
    }
  };

  const filtered = incidents.filter(i => {
    // 1. Workspace Tab Filter
    if (workspaceTab === 'ASSIGNED_TO_ME' && user) {
      if (i.assignedTo !== user.username) return false;
    } else if (workspaceTab === 'REPORTED_BY_ME' && user) {
      if (i.reportedBy !== user.username) return false;
    } else if (workspaceTab === 'RESOLVED') {
      if (i.status !== 'RESOLVED' && i.status !== 'CLOSED') return false;
    }

    // 2. Multi-select Filters (also protects the view if the API returns stale data)
    const matchesSeverity = severityFilters.length === 0 || severityFilters.includes(i.severity);
    const matchesPriority = priorityFilters.length === 0 || priorityFilters.includes(i.priority || 'P3');
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(i.status);
    const matchesCategory = categoryFilters.length === 0 || categoryFilters.includes(i.category);

    // 3. Search Query
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();

      if (q === 'risk:high') {
        matchesSearch = i.riskScore >= 70;
      } else if (q === 'today') {
        const todayStr = new Date().toISOString().slice(0, 10);
        const incDateStr = i.createdAt ? new Date(i.createdAt).toISOString().slice(0, 10) : '';
        matchesSearch = incDateStr === todayStr;
      }

      else if (q.includes(':')) {
        const parts = q.split(' ');
        matchesSearch = parts.every(part => {
          if (part.startsWith('severity:')) {
            const val = part.split(':')[1];
            return i.severity?.toLowerCase() === val;
          }
          if (part.startsWith('status:')) {
            const val = part.split(':')[1];
            return i.status?.toLowerCase() === val;
          }
          if (part.startsWith('priority:')) {
            const val = part.split(':')[1];
            return (i.priority || 'p3').toLowerCase() === val;
          }
          if (part.startsWith('category:')) {
            const val = part.split(':')[1];
            return i.category?.toLowerCase().includes(val);
          }
          if (part.startsWith('assigned:')) {
            const val = part.split(':')[1];
            return i.assignedTo?.toLowerCase().includes(val);
          }
          return (
            i.title?.toLowerCase().includes(part) ||
            i.description?.toLowerCase().includes(part) ||
            i.location?.toLowerCase().includes(part)
          );
        });
      } else {
        matchesSearch = (
          i.title?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.location?.toLowerCase().includes(q) ||
          i.reportedBy?.toLowerCase().includes(q) ||
          i.assignedTo?.toLowerCase().includes(q)
        );
      }
    }

    return matchesSeverity && matchesPriority && matchesStatus && matchesCategory && matchesSearch;
  });

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const renderMultiSelect = (label, id, value, setter, options) => (
    <label className="incident-filter-field" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        className="form-select incident-multi-select"
        multiple
        value={value}
        onChange={(event) => updateMultiSelect(event, setter)}
        aria-label={`Filter by ${label}`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
      <small>Use Ctrl/Cmd-click to select multiple values.</small>
    </label>
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>SOC Incident Workspace</h1>
          <p>{filtered.length} incident{filtered.length !== 1 ? 's' : ''} active in current view</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => exportIncidentsCSV(filtered)}
            title="Export filtered list as CSV"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/incidents/new')}
            id="create-incident-btn"
          >
            <PlusCircle size={16} />
            Report Incident
          </button>
        </div>
      </div>

      {/* Workspace Sub-Header Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 'var(--space-5)',
          paddingBottom: '2px'
        }}
      >
        {[
          { id: 'ALL', label: `All Incidents (${incidents.length})` },
          { id: 'ASSIGNED_TO_ME', label: `Assigned to Me (${incidents.filter(i => user && i.assignedTo === user.username).length})` },
          { id: 'REPORTED_BY_ME', label: `Reported by Me (${incidents.filter(i => user && i.reportedBy === user.username).length})` },
          { id: 'RESOLVED', label: `Resolved / Closed (${incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setWorkspaceTab(tab.id)}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: workspaceTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: workspaceTab === tab.id ? '#60a5fa' : '#94a3b8',
              fontWeight: workspaceTab === tab.id ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Starred Saved Search Presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-5)', overflowX: 'auto' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Star size={14} style={{ color: '#eab308' }} /> Saved Presets:
        </span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => handleApplyPreset('P1_CRITICAL')}
          style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
        >
          ★ P1 Critical Incidents
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => handleApplyPreset('ASSIGNED_ME')}
          style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}
        >
          ★ Assigned To Me
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => handleApplyPreset('HIGH_RISK')}
          style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.3)' }}
        >
          ★ High Risk (&ge;70)
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => handleApplyPreset('TODAY')}
          style={{ fontSize: '11px', padding: '4px 10px' }}
        >
          ★ Today's Incidents
        </button>
      </div>

      {/* Search & Syntax support */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <SearchBar onSearch={handleSearch} placeholder="Search by text or syntax (e.g. severity:critical status:open category:threat)..." />
      </div>

      <div className="incident-filter-layout">
        <aside className="incident-filter-sidebar" aria-label="Advanced incident filters">
          <div className="incident-filter-sidebar-header">
            <div>
              <Filter size={16} />
              <h2>Advanced filters</h2>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={resetFilters}>
              <RotateCcw size={14} /> Clear
            </button>
          </div>
          <p className="incident-filter-help">Combine multiple values and date bounds to narrow the incident workspace.</p>
          {renderMultiSelect('Severity', 'severity-filter', severityFilters, setSeverityFilters, SEVERITY_FILTERS.slice(1))}
          {renderMultiSelect('Status', 'status-filter', statusFilters, setStatusFilters, STATUS_FILTERS.slice(1))}
          {renderMultiSelect('Category', 'category-filter', categoryFilters, setCategoryFilters, CATEGORY_FILTERS.slice(1))}
          {renderMultiSelect('Priority', 'priority-filter', priorityFilters, setPriorityFilters, PRIORITY_FILTERS.slice(1))}
          <div className="incident-filter-date-grid">
            <label className="incident-filter-field" htmlFor="start-date-filter">
              <span>Start date</span>
              <input id="start-date-filter" className="form-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label className="incident-filter-field" htmlFor="end-date-filter">
              <span>End date</span>
              <input id="end-date-filter" className="form-input" type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
            </label>
          </div>
        </aside>

        <section className="incident-results" aria-label="Filtered incidents">
          {/* Incident List */}
          {filtered.length > 0 ? (
            <div className="incident-list stagger">
              {filtered.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <AlertTriangle size={48} />
              </div>
              <h3>No incidents found</h3>
              <p>
                {searchQuery || severityFilters.length > 0 || statusFilters.length > 0 || priorityFilters.length > 0 || categoryFilters.length > 0 || startDate || endDate
                  ? 'Try adjusting your filters or search query.'
                  : 'No incidents match your current view. Click "Report Incident" to log one.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
