import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentsAPI } from '../api/client';
import IncidentCard from '../components/IncidentCard';
import SearchBar from '../components/SearchBar';
import { PlusCircle, AlertTriangle } from 'lucide-react';

const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUS_FILTERS = ['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED'];

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await incidentsAPI.getAll();
      const sorted = (res.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setIncidents(sorted);
      setFiltered(sorted);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let result = [...incidents];

    if (severityFilter !== 'ALL') {
      result = result.filter(i => i.severity === severityFilter);
    }
    if (statusFilter !== 'ALL') {
      result = result.filter(i => i.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [incidents, severityFilter, statusFilter, searchQuery]);

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

      {/* Search & Filters */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <SearchBar onSearch={handleSearch} />
      </div>

      <div className="filter-bar">
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
            {searchQuery || severityFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try adjusting your filters or search query.'
              : 'No incidents have been reported yet. Click "Report Incident" to create one.'}
          </p>
        </div>
      )}
    </div>
  );
}
