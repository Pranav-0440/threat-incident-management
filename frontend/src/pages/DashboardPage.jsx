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
  PieChart,
  BarChart2
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, incidentsRes] = await Promise.all([
          incidentsAPI.getStats(),
          incidentsAPI.getPage({ page: 0, size: 5, sortBy: 'createdAt', direction: 'desc' }),
        ]);
        setStats(statsRes.data);
        setRecentIncidents(incidentsRes.data?.content || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      <div className="page-header">
        <h1>SOC Threat Intelligence Dashboard</h1>
        <p>Real-time overview of active security incidents, SLA metrics, and risk distribution</p>
      </div>

      {/* Interactive Clickable Stats Grid */}
      <div className="stats-grid stagger" style={{ marginBottom: 'var(--space-6)' }}>
        <div onClick={() => navigate('/incidents')} style={{ cursor: 'pointer' }}>
          <StatsCard
            label="Total Incidents"
            value={stats?.total || 0}
            icon={AlertTriangle}
            variant="accent"
          />
        </div>
        <div onClick={() => navigate('/incidents')} style={{ cursor: 'pointer' }}>
          <StatsCard
            label="Open Incidents"
            value={stats?.open || 0}
            icon={ShieldAlert}
            variant="warning"
          />
        </div>
        <div onClick={() => navigate('/incidents')} style={{ cursor: 'pointer' }}>
          <StatsCard
            label="Critical Alerts"
            value={stats?.critical || 0}
            icon={Activity}
            variant="danger"
          />
        </div>
        <div onClick={() => navigate('/incidents')} style={{ cursor: 'pointer' }}>
          <StatsCard
            label="Avg Risk Score"
            value={stats?.averageRiskScore || 0}
            icon={TrendingUp}
            variant="accent"
          />
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {/* Severity Distribution Chart */}
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Severity Breakdown
            </h3>
            <PieChart size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[
              { label: 'Critical (P1)', value: stats?.critical || 0, color: 'var(--color-critical)' },
              { label: 'High (P2)', value: stats?.high || 0, color: 'var(--color-high)' },
              { label: 'Medium (P3)', value: stats?.medium || 0, color: 'var(--color-medium)' },
              { label: 'Low (P4)', value: stats?.low || 0, color: 'var(--color-low)' },
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

        {/* Status Lifecycle Chart */}
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Lifecycle Pipeline
            </h3>
            <BarChart2 size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[
              { label: 'Open', value: stats?.open || 0, color: 'var(--color-open)' },
              { label: 'Investigating', value: stats?.investigating || 0, color: 'var(--color-investigating)' },
              { label: 'Waiting Evidence', value: stats?.waiting_evidence || 0, color: '#f59e0b' },
              { label: 'Resolved', value: stats?.resolved || 0, color: 'var(--color-resolved)' },
              { label: 'Closed', value: stats?.closed || 0, color: '#64748b' },
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
            <StatsCard label="Resolved SLA" value={stats?.resolved || 0} icon={ShieldCheck} variant="success" />
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Active Security Incidents
          </h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/incidents')}
          >
            <Search size={14} />
            View All Incidents
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
            <h3>No active incidents reported</h3>
            <p>Everything looks clear. Click "Report Incident" to log a threat.</p>
          </div>
        )}
      </div>
    </div>
  );
}
