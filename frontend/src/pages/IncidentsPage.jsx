import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
const PAGE_SIZE = 20;

export default function IncidentsPage() {
  const { user, token } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  // Pagination State (zero-based)
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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
    const controller = new AbortController();
    let isCurrent = true;

    const fetchIncidents = async () => {
      setFetching(true);
      try {
        const params = {
          page,
          size: PAGE_SIZE,
          sortBy: 'createdAt',
          direction: 'desc',
        };

        if (searchQuery && searchQuery.trim()) {
          params.q = searchQuery.trim();
        }

        if (severityFilter && severityFilter !== 'ALL') {
          params.severity = severityFilter;
        }

        if (priorityFilter && priorityFilter !== 'ALL') {
          params.priority = priorityFilter;
        }

        if (statusFilter && statusFilter !== 'ALL') {
          params.status = statusFilter;
        } else if (workspaceTab === 'RESOLVED') {
          params.status = 'RESOLVED';
        }

        if (categoryFilter && categoryFilter !== 'ALL') {
          params.category = categoryFilter;
        }

        if (workspaceTab === 'ASSIGNED_TO_ME' && user?.username && !params.q) {
          params.q = user.username;
        } else if (workspaceTab === 'REPORTED_BY_ME' && user?.username && !params.q) {
          params.q = user.username;
        }

        const res = await incidentsAPI.getPage(params, { signal: controller.signal });
        if (isCurrent && res.data) {
          const pageData = res.data;
          const items = Array.isArray(pageData.content)
            ? pageData.content
            : Array.isArray(pageData)
            ? pageData
            : [];
          setIncidents(items);
          setTotalElements(
            pageData.totalElements !== undefined
              ? pageData.totalElements
              : items.length
          );
          setTotalPages(
            pageData.totalPages !== undefined
              ? pageData.totalPages
              : Math.ceil((pageData.totalElements || items.length) / PAGE_SIZE) || 1
          );
        }
      } catch (err) {
        if (axios.isCancel?.(err) || err.name === 'CanceledError' || err.name === 'AbortError') {
          // Ignore aborted requests to prevent race condition overwrites
          return;
        }
        if (isCurrent) {
          console.error('Failed to fetch incidents:', err);
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
          setFetching(false);
        }
      }
    };

    fetchIncidents();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [page, severityFilter, priorityFilter, statusFilter, categoryFilter, searchQuery, workspaceTab, user]);

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
    setWorkspaceTab('ALL');
    setPage(0);

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

  const handleFilterChange = (setter, val) => {
    setter(val);
    setPage(0);
  };

  const handleWorkspaceTabChange = (tabId) => {
    setWorkspaceTab(tabId);
    setPage(0);
  };

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setPage(0);
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
      <div className="incident-workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>SOC Incident Workspace</h1>
          <p>{totalElements} incident{totalElements !== 1 ? 's' : ''} active in current view</p>
        </div>

        <div className="incident-workspace-actions" style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => exportIncidentsCSV(incidents)}
            title="Export current page list as CSV"
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
        className="workspace-tabs"
        style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 'var(--space-5)',
          paddingBottom: '2px',
          overflowX: 'auto'
        }}
      >
        {[
          { id: 'ALL', label: 'All Incidents' },
          { id: 'ASSIGNED_TO_ME', label: 'Assigned to Me' },
          { id: 'REPORTED_BY_ME', label: 'Reported by Me' },
          { id: 'RESOLVED', label: 'Resolved / Closed' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleWorkspaceTabChange(tab.id)}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: workspaceTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: workspaceTab === tab.id ? '#60a5fa' : '#94a3b8',
              fontWeight: workspaceTab === tab.id ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Starred Saved Search Presets */}
      <div className="saved-presets" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-5)', overflowX: 'auto' }}>
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
              onClick={() => handleFilterChange(setPriorityFilter, f)}
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
              onClick={() => handleFilterChange(setSeverityFilter, f)}
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
              onClick={() => handleFilterChange(setStatusFilter, f)}
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
              onClick={() => handleFilterChange(setCategoryFilter, f)}
            >
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      {incidents.length > 0 ? (
        <div
          className="incident-list stagger"
          style={{
            opacity: fetching ? 0.6 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {incidents.map((incident) => (
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
            {searchQuery || severityFilter !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || workspaceTab !== 'ALL'
              ? 'Try adjusting your filters or search query.'
              : 'No incidents match your current view. Click "Report Incident" to log one.'}
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          className="pagination-controls"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginTop: 'var(--space-8)',
            paddingTop: 'var(--space-6)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0 || fetching}
            id="pagination-prev-btn"
          >
            &larr; Previous
          </button>
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              fontWeight: 500,
            }}
          >
            Page <strong style={{ color: 'var(--color-text-primary)' }}>{page + 1}</strong> of{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{totalPages}</strong>
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
            disabled={page >= totalPages - 1 || fetching}
            id="pagination-next-btn"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
