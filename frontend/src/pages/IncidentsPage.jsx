import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentsAPI } from '../api/client';
import IncidentCard from '../components/IncidentCard';
import SearchBar from '../components/SearchBar';
import { PlusCircle, AlertTriangle, Filter } from 'lucide-react';

const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PRIORITY_FILTERS = ['ALL', 'P1', 'P2', 'P3', 'P4'];
const STATUS_FILTERS = ['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED'];
const CATEGORY_FILTERS = ['ALL', 'WORKPLACE_VIOLENCE', 'THREAT', 'SUSPICIOUS_ACTIVITY', 'CYBER_THREAT', 'PHYSICAL_SECURITY'];

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
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

  const filtered = incidents.filter(i => {
    const matchesSeverity = severityFilter === 'ALL' || i.severity === severityFilter;
    const matchesPriority = priorityFilter === 'ALL' || (i.priority || 'P3') === priorityFilter;
    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || i.category === categoryFilter;

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();

      // Advanced syntax parsing support: severity:critical status:open
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
          <h1>Incidents</h1>
          <p>{filtered.length} incident{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/incidents/new')}
          id="create-incident-btn"
        >
          <PlusCircle size={16} />
          Report Incident
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
              {f}
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
              : 'No incidents have been reported yet. Click "Report Incident" to create one.'}
          </p>
        </div>
      )}
    </div>
  );
}
