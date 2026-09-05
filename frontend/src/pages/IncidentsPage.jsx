import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { incidentsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import IncidentCard from '../components/IncidentCard';
import SearchBar from '../components/SearchBar';
import { exportIncidentsCSV } from '../utils/exportUtils';
import { subscribeToIncidentUpdates } from '../utils/incidentCollaboration';
import { PlusCircle, AlertTriangle, Download, Star, X } from 'lucide-react';

const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PRIORITY_FILTERS = ['ALL', 'P1', 'P2', 'P3', 'P4'];
const STATUS_FILTERS = ['ALL', 'OPEN', 'INVESTIGATING', 'WAITING_EVIDENCE', 'RESOLVED', 'CLOSED'];
const CATEGORY_FILTERS = ['ALL', 'WORKPLACE_VIOLENCE', 'THREAT', 'SUSPICIOUS_ACTIVITY', 'CYBER_THREAT', 'PHYSICAL_SECURITY'];

export default function IncidentsPage() {
  const { user, token } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const [workspaceTab, setWorkspaceTab] = useState(() => searchParams.get('tab') || 'ALL');

  // Filter States
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState(() => searchParams.get('priority') || 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [presetFilter, setPresetFilter] = useState(() => searchParams.get('preset') || 'NONE');
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  const navigate = useNavigate();

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await incidentsAPI.getAll();
        const sorted = (res.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setIncidents(sorted);
      } catch (err) {
        console.error('Failed to fetch incidents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  useEffect(() => subscribeToIncidentUpdates(token, (event) => {
    if (event.eventType !== 'INCIDENT_STATUS_CHANGED') return;
    setIncidents((current) => current.map((incident) => (
      incident.id === event.incidentId
        ? { ...incident, status: event.status, updatedAt: event.occurredAt }
        : incident
    )));
  }), [token]);

  const updateUrlParams = (updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (!val || val === 'ALL' || val === 'NONE') {
          next.delete(key);
        } else {
          next.set(key, val);
        }
      });
      return next;
    }, { replace: true });
  };

  const handleWorkspaceTabChange = (tabId) => {
    setWorkspaceTab(tabId);
    updateUrlParams({ tab: tabId });
  };

  const handleApplyPreset = (presetName) => {
    if (presetName === 'P1_CRITICAL') {
      const next = priorityFilter === 'P1' ? 'ALL' : 'P1';
      setPriorityFilter(next);
      updateUrlParams({ priority: next, preset: next === 'P1' ? 'P1_CRITICAL' : 'NONE' });
    } else if (presetName === 'ASSIGNED_ME') {
      const next = workspaceTab === 'ASSIGNED_TO_ME' ? 'ALL' : 'ASSIGNED_TO_ME';
      handleWorkspaceTabChange(next);
    } else if (presetName === 'HIGH_RISK') {
      const next = presetFilter === 'HIGH_RISK' ? 'NONE' : 'HIGH_RISK';
      setPresetFilter(next);
      updateUrlParams({ preset: next });
    } else if (presetName === 'TODAY') {
      const next = presetFilter === 'TODAY' ? 'NONE' : 'TODAY';
      setPresetFilter(next);
      updateUrlParams({ preset: next });
    }
  };

  const clearActivePreset = () => {
    setPresetFilter('NONE');
    setPriorityFilter('ALL');
    updateUrlParams({ preset: 'NONE', priority: 'ALL' });
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

    // 3. Saved preset predicate
    const matchesPreset = presetFilter === 'NONE'
      || (presetFilter === 'HIGH_RISK' && i.riskScore >= 70)
      || (presetFilter === 'TODAY' && i.createdAt && new Date(i.createdAt).toISOString().slice(0, 10) === today);

    // 4. Search Query
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();

      if (q === 'risk:high') {
        matchesSearch = i.riskScore >= 70;
      } else if (q === 'today') {
        const incDateStr = i.createdAt ? new Date(i.createdAt).toISOString().slice(0, 10) : '';
        matchesSearch = incDateStr === today;
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

    return matchesSeverity && matchesPriority && matchesStatus && matchesCategory && matchesPreset && matchesSearch;
  });

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
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
          <p>{filtered.length} incident{filtered.length !== 1 ? 's' : ''} active in current view</p>
        </div>

        <div className="incident-workspace-actions" style={{ display: 'flex', gap: '10px' }}>
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
        className="workspace-tabs"
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
            onClick={() => handleWorkspaceTabChange(tab.id)}
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
      <div className="saved-presets" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', overflowX: 'auto', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Star size={14} style={{ color: '#eab308' }} /> Saved Presets:
        </span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => handleApplyPreset('P1_CRITICAL')}
          style={{
            fontSize: '11px',
            padding: '4px 10px',
            background: priorityFilter === 'P1' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: priorityFilter === 'P1' ? '1px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: priorityFilter === 'P1' ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none'
          }}
        >
          ★ P1 Critical {priorityFilter === 'P1' ? '✓' : ''}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => handleApplyPreset('ASSIGNED_ME')}
          style={{
            fontSize: '11px',
            padding: '4px 10px',
            background: workspaceTab === 'ASSIGNED_TO_ME' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.1)',
            color: '#818cf8',
            border: workspaceTab === 'ASSIGNED_TO_ME' ? '1px solid #818cf8' : '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: workspaceTab === 'ASSIGNED_TO_ME' ? '0 0 8px rgba(99, 102, 241, 0.4)' : 'none'
          }}
        >
          ★ Assigned To Me {workspaceTab === 'ASSIGNED_TO_ME' ? '✓' : ''}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => handleApplyPreset('HIGH_RISK')}
          style={{
            fontSize: '11px',
            padding: '4px 10px',
            background: presetFilter === 'HIGH_RISK' ? 'rgba(249, 115, 22, 0.25)' : 'rgba(249, 115, 22, 0.1)',
            color: '#f97316',
            border: presetFilter === 'HIGH_RISK' ? '1px solid #f97316' : '1px solid rgba(249, 115, 22, 0.3)',
            boxShadow: presetFilter === 'HIGH_RISK' ? '0 0 8px rgba(249, 115, 22, 0.4)' : 'none'
          }}
        >
          ★ High Risk (&ge;70) {presetFilter === 'HIGH_RISK' ? '✓' : ''}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => handleApplyPreset('TODAY')}
          style={{
            fontSize: '11px',
            padding: '4px 10px',
            background: presetFilter === 'TODAY' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
            color: presetFilter === 'TODAY' ? '#10b981' : 'inherit',
            border: presetFilter === 'TODAY' ? '1px solid #10b981' : '1px solid var(--color-border)',
            boxShadow: presetFilter === 'TODAY' ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none'
          }}
        >
          ★ Today's Incidents {presetFilter === 'TODAY' ? '✓' : ''}
        </button>

        {(presetFilter !== 'NONE' || priorityFilter !== 'ALL') && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={clearActivePreset}
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              marginLeft: 'auto',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <X size={12} /> Clear Preset ({filtered.length} matching)
          </button>
        )}
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
              onClick={() => setPriorityFilter(f)}
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
              onClick={() => setSeverityFilter(f)}
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
              onClick={() => setStatusFilter(f)}
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
              onClick={() => setCategoryFilter(f)}
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
    </div>
  );
}
