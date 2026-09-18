import { useEffect, useRef, useState, useCallback } from 'react';
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
  BarChart2,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  // Incrementing this triggers the useEffect to re-run (manual Retry)
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  // Ensure the one-time auto-retry fires exactly once across all renders
  const hasAutoRetried = useRef(false);
  // Keep a reference to the pending retry timer for cleanup on unmount
  const retryTimerRef = useRef(null);

  useEffect(() => {
    let isCurrent = true;

    const fetchData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const [statsRes, incidentsRes] = await Promise.all([
          incidentsAPI.getStats(),
          incidentsAPI.getPage({ page: 0, size: 5, sortBy: 'createdAt', direction: 'desc' }),
        ]);
        if (!isCurrent) return;
        setStats(statsRes.data);
        setRecentIncidents(incidentsRes.data?.content || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        if (!isCurrent) return;
        setFetchError('Failed to load dashboard data. The server may be starting up or unreachable.');

        // Schedule exactly one automatic retry after 3 seconds (initial load failure only)
        if (!hasAutoRetried.current) {
          hasAutoRetried.current = true;
          retryTimerRef.current = setTimeout(() => {
            if (isCurrent) {
              setRetryCount((c) => c + 1);
            }
          }, 3000);
          // Keep the loading spinner up while we wait for the auto-retry
          return;
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isCurrent = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1);
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

      {/* Error banner — shown only when a fetch has failed */}
      {fetchError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            padding: 'var(--space-4) var(--space-5)',
            marginBottom: 'var(--space-6)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-critical-bg)',
            border: '1px solid var(--color-critical-border)',
            color: 'var(--color-critical)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <AlertTriangle size={16} />
            {fetchError}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRetry}
            style={{ flexShrink: 0 }}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

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
