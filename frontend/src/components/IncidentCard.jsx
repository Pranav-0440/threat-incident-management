import { useNavigate } from 'react-router-dom';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';
import { MapPin, Clock, User } from 'lucide-react';

export default function IncidentCard({ incident }) {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="incident-card animate-fade-in"
      onClick={() => navigate(`/incidents/${incident.id}`)}
    >
      <div className={`incident-card-severity-strip ${(incident.severity || '').toLowerCase()}`} />
      <div className="incident-card-body">
        <div className="incident-card-title">{incident.title}</div>
        <div className="incident-card-description">{incident.description}</div>
        <div className="incident-card-meta">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
          {incident.location && (
            <span className="incident-card-meta-item">
              <MapPin size={12} />
              {incident.location}
            </span>
          )}
          <span className="incident-card-meta-item">
            <Clock size={12} />
            {formatDate(incident.createdAt)}
          </span>
          {incident.reportedBy && (
            <span className="incident-card-meta-item">
              <User size={12} />
              {incident.reportedBy}
            </span>
          )}
        </div>
      </div>
      <div className="incident-card-actions">
        <span style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 800,
          color: incident.riskScore >= 70 ? 'var(--color-critical)' :
                 incident.riskScore >= 50 ? 'var(--color-high)' :
                 incident.riskScore >= 30 ? 'var(--color-medium)' :
                 'var(--color-low)',
        }}>
          {incident.riskScore}
        </span>
        <span style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: '0.05em',
        }}>
          Risk
        </span>
      </div>
    </div>
  );
}
