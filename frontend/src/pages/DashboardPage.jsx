import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentsAPI } from '../api/client';
import StatsCard from '../components/StatsCard';
import IncidentCard from '../components/IncidentCard';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Activity,
  TrendingUp,
  Search,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, incidentsRes] = await Promise.all([
        incidentsAPI.getStats(),
        incidentsAPI.getAll(),
      ]);
      setStats(statsRes.data);
      // Sort by createdAt descending and take top 5
      const sorted = (incidentsRes.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRecentIncidents(sorted.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="page-header">
        <h1>Threat Dashboard</h1>
        <p>Real-time overview of incident activity and risk levels</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid stagger">
        <StatsCard
          label="Total Incidents"
          value={stats?.total || 0}
          icon={AlertTriangle}
          variant="accent"
        />
        <StatsCard
          label="Open Incidents"
          value={stats?.open || 0}
          icon={ShieldAlert}
          variant="warning"
        />
        <StatsCard
          label="Critical"
          value={stats?.critical || 0}
          icon={Activity}
          variant="danger"
        />
        <StatsCard
          label="Avg Risk Score"
          value={stats?.averageRiskScore || 0}
          icon={TrendingUp}
          variant="accent"
        />
      </div>

      {/* Severity Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="card animate-fade-in">
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 'var(--space-5)', color: 'var(--color-text-primary)' }}>
            Severity Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[
              { label: 'Critical', value: stats?.critical || 0, color: 'var(--color-critical)' },
              { label: 'High', value: stats?.high || 0, color: 'var(--color-high)' },
              { label: 'Medium', value: stats?.medium || 0, color: 'var(--color-medium)' },
              { label: 'Low', value: stats?.low || 0, color: 'var(--color-low)' },
            ].map(({ label, value, color }) => {
              const total = stats?.total || 1;
              const pct = Math.round((value / total) * 100);
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                    <span style={{ fontWeight: 600, color }}>{value} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-glass)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: 'var(--radius-full)',
                      background: color,
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card animate-fade-in">
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 'var(--space-5)', color: 'var(--color-text-primary)' }}>
            Status Overview
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[
              { label: 'Open', value: stats?.open || 0, color: 'var(--color-open)' },
              { label: 'Investigating', value: stats?.investigating || 0, color: 'var(--color-investigating)' },
              { label: 'Resolved', value: stats?.resolved || 0, color: 'var(--color-resolved)' },
            ].map(({ label, value, color }) => {
              const total = stats?.total || 1;
              const pct = Math.round((value / total) * 100);
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                    <span style={{ fontWeight: 600, color }}>{value} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-glass)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: 'var(--radius-full)',
                      background: color,
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
            <StatsCard label="Resolved" value={stats?.resolved || 0} icon={ShieldCheck} variant="success" />
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Recent Incidents
          </h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/incidents')}
          >
            <Search size={14} />
            View All
          </button>
        </div>

        {recentIncidents.length > 0 ? (
          <div className="incident-list stagger">
            {recentIncidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ShieldCheck size={48} />
            </div>
            <h3>No incidents reported</h3>
            <p>Everything looks clear. Create a new incident to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
