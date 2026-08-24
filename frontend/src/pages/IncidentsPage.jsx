import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import IncidentCard from '../components/IncidentCard';
import SearchBar from '../components/SearchBar';
import { exportIncidentsCSV } from '../utils/exportUtils';
import { subscribeToIncidentUpdates } from '../utils/incidentCollaboration';
import { PlusCircle, AlertTriangle, Download, Star } from 'lucide-react';

const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PRIORITY_FILTERS = ['ALL', 'P1', 'P2', 'P3', 'P4'];
const STATUS_FILTERS = ['ALL', 'OPEN', 'INVESTIGATING', 'WAITING_EVIDENCE', 'RESOLVED', 'CLOSED'];
const CATEGORY_FILTERS = ['ALL', 'WORKPLACE_VIOLENCE', 'THREAT', 'SUSPICIOUS_ACTIVITY', 'CYBER_THREAT', 'PHYSICAL_SECURITY'];

export default function IncidentsPage() {
  const { user, token } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true });
  const [loading, setLoading] = useState(true);

  // Workspace Tabs
  const [workspaceTab, setWorkspaceTab] = useState('ALL'); // ALL, ASSIGNED_TO_ME, REPORTED_BY_ME, RESOLVED

  // Filter States
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      try {
        const params = {
          page: pageInfo.page,
          size: pageInfo.size,
          sortBy: 'createdAt',
          direction: 'desc',
        };
        if (searchQuery.trim() && !searchQuery.includes(':')) params.query = searchQuery.trim();
        if (severityFilter !== 'ALL') params.severity = severityFilter;
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (categoryFilter !== 'ALL') params.category = categoryFilter;
        if (priorityFilter !== 'ALL') params.priority = priorityFilter;

        const res = await incidentsAPI.getPage(params);
        const data = res.data || {};
        setIncidents(data.content || []);
        setPageInfo((current) => ({
          ...current,
          page: data.page ?? current.page,
          size: data.size ?? current.size,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 0,
          first: data.first ?? true,
          last: data.last ?? true,
        }));
      } catch (err) {
        console.error('Failed to fetch incidents:', err);
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [pageInfo.page, pageInfo.size, searchQuery, severityFilter, statusFilter, categoryFilter, priorityFilter]);

  const goToPage = (nextPage) => {
    setPageInfo((current) => ({ ...current, page: nextPage }));
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
    setSeverityFilter('ALL');
    setPriorityFilter('ALL');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setSearchQuery('');

    if (presetName === 'P1_CRITICAL') {
      setPriorityFilter('P1');
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

    // 2. Chip Filters
    const matchesSeverity = severityFilter === 'ALL' || i.severity === severityFilter;
    const matchesPriority = priorityFilter === 'ALL' || (i.priority || 'P3') === priorityFilter;
    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || i.category === categoryFilter;

    // 3. Search Query
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();

      if (q === 'risk:high') {
        return i.riskScore >= 70;
      }

      if (q === 'today') {
        const todayStr = new Date().toISOString().slice(0, 10);
        const incDateStr = i.createdAt ? new Date(i.createdAt).toISOString().slice(0, 10) : '';
        return incDateStr === todayStr;
      }

      if (q.includes(':')) {
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
    setPageInfo((current) => ({ ...current, page: 0 }));
  }, []);

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

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-6)' }}>
        <div className="filter-bar">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '70px' }}>
            Priority:
          </span>
          {PRIORITY_FILTERS.map(f => (
            <button
              key={f}
              className={`filter-chip ${priorityFilter === f ? 'active' : ''}`}
              onClick={() => { setPriorityFilter(f); setPageInfo((current) => ({ ...current, page: 0 })); }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="filter-bar">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '70px' }}>
            Severity:
          </span>
          {SEVERITY_FILTERS.map(f => (
            <button
              key={f}
              className={`filter-chip ${severityFilter === f ? 'active' : ''}`}
              onClick={() => { setSeverityFilter(f); setPageInfo((current) => ({ ...current, page: 0 })); }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="filter-bar">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '70px' }}>
            Status:
          </span>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              className={`filter-chip ${statusFilter === f ? 'active' : ''}`}
              onClick={() => { setStatusFilter(f); setPageInfo((current) => ({ ...current, page: 0 })); }}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="filter-bar">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '70px' }}>
            Category:
          </span>
          {CATEGORY_FILTERS.map(f => (
            <button
              key={f}
              className={`filter-chip ${categoryFilter === f ? 'active' : ''}`}
              onClick={() => { setCategoryFilter(f); setPageInfo((current) => ({ ...current, page: 0 })); }}
            >
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

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
            {searchQuery || severityFilter !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL'
              ? 'Try adjusting your filters or search query.'
              : 'No incidents match your current view. Click "Report Incident" to log one.'}
          </p>
        </div>
      )}

      <div className="incident-pagination" aria-label="Incident list pagination">
        <span>
          Showing {incidents.length} of {pageInfo.totalElements} incident{pageInfo.totalElements === 1 ? '' : 's'}
        </span>
        <div className="incident-pagination-controls">
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={() => goToPage(Math.max(pageInfo.page - 1, 0))}
            disabled={pageInfo.first || loading}
          >
            Previous
          </button>
          <span aria-live="polite">
            Page {pageInfo.totalPages > 0 ? pageInfo.page + 1 : 0} of {pageInfo.totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={() => goToPage(pageInfo.page + 1)}
            disabled={pageInfo.last || loading}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
