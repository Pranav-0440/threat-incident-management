import { useEffect, useState } from 'react';
import { incidentsAPI } from '../api/client';
import { BarChart2, PieChart, TrendingUp, MapPin, CheckCircle, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadAnalytics = async () => {
      try {
        const analyticsRes = await incidentsAPI.getAnalytics();
        if (isMounted) {
          setStats(analyticsRes.data || {});
        }
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadAnalytics();
    return () => { isMounted = false; };
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

  const categoryCounts = stats?.categoryCounts || {};
  const locationCounts = stats?.locationCounts || {};
  const totalIncidents = stats?.total || 0;

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1>Interactive Threat Analytics</h1>
        <p>Real-time telemetry, location heatmaps, SLA compliance metrics, and analyst performance benchmarks</p>
      </div>

      {/* Top SLA & Performance Metrics Grid */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card accent">
          <div className="stat-card-header">
            <div className="stat-card-title">SLA Compliance Rate</div>
            <div className="stat-card-icon" style={{ color: '#10b981' }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="stat-card-value">{Math.round(stats?.slaComplianceRate || 0)}%</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '6px' }}>
            {(100 - (stats?.slaComplianceRate || 0)).toFixed(1)}% outside SLA ({stats?.overdueCount || 0} overdue incidents)
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-card-header">
            <div className="stat-card-title">Avg Resolution Time</div>
            <div className="stat-card-icon" style={{ color: '#3b82f6' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-card-value">{(stats?.averageResolutionHours || 0).toFixed(1)} hrs</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            Calculated from persisted incident timestamps
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-card-header">
            <div className="stat-card-title">Top Threat Vector</div>
            <div className="stat-card-icon" style={{ color: '#f97316' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ fontSize: '1.25rem' }}>{stats?.topThreatVector || 'NONE'}</div>
          <div style={{ fontSize: '12px', color: '#f97316', marginTop: '6px' }}>
            {(stats?.topThreatVectorPercent || 0).toFixed(1)}% of scoped incidents
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* Severity Distribution */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Severity Distribution</h3>
            <PieChart size={18} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Critical (P1)', value: stats?.critical || 0, color: '#ef4444' },
              { label: 'High (P2)', value: stats?.high || 0, color: '#f97316' },
              { label: 'Medium (P3)', value: stats?.medium || 0, color: '#eab308' },
              { label: 'Low (P4)', value: stats?.low || 0, color: '#10b981' },
            ].map(({ label, value, color }) => {
              const total = stats?.total || 1;
              const pct = Math.round((value / total) * 100);
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>{label}</span>
                    <span style={{ fontWeight: 600, color }}>{value} ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '9999px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Threat Category Breakdown</h3>
            <BarChart2 size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = Math.round((count / (totalIncidents || 1)) * 100);
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: '#cbd5e1' }}>{cat}</span>
                    <span style={{ fontWeight: 600, color: '#60a5fa' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#3b82f6', borderRadius: '9999px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Threat Locations Heatmap */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <MapPin size={18} style={{ color: '#f97316' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>High-Risk Incident Locations</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {Object.entries(locationCounts).map(([loc, count]) => (
            <div key={loc} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>{loc}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: count > 3 ? '#ef4444' : '#f8fafc' }}>
                {count} Incidents
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
