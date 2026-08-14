import { useNavigate } from 'react-router-dom';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { MapPin, Clock, User, Shield, Download, Share2, Eye } from 'lucide-react';
import { exportIncidentPDF } from '../utils/exportUtils';
import CopyButton from './CopyButton';
import { copyTextToClipboard } from '../utils/clipboard';

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

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/incidents/${incident.id}`;
    await copyTextToClipboard(url);
    alert('Incident link copied to clipboard!');
  };

  const handlePDF = (e) => {
    e.stopPropagation();
    exportIncidentPDF(incident);
  };

  return (
    <div
      className="incident-card animate-fade-in"
      onClick={() => navigate(`/incidents/${incident.id}`)}
      style={{ position: 'relative' }}
    >
      <div className={`incident-card-severity-strip ${(incident.severity || '').toLowerCase()}`} />
      <div className="incident-card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <PriorityBadge priority={incident.priority || 'P3'} />
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />

          <CopyButton
            text={incident.id}
            ariaLabel="Copy Incident ID"
            stopPropagation={true}
            iconSize={11}
            style={{
              gap: '4px',
              padding: '2px 6px',
              fontSize: '11px',
              borderRadius: '4px',
            }}
          />
        </div>
        <div className="incident-card-title">{incident.title}</div>
        <div className="incident-card-description">{incident.description}</div>
        <div className="incident-card-meta">
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
              Reporter: {incident.reportedBy}
            </span>
          )}
          {incident.assignedTo && (
            <span className="incident-card-meta-item" style={{ color: '#818cf8', fontWeight: 600 }}>
              <Shield size={12} />
              Assigned: {incident.assignedToName || incident.assignedTo}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
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
            Risk Score
          </span>
        </div>

        {/* Quick Actions Bar */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/incidents/${incident.id}`)}
            className="btn btn-sm"
            title="Open Details Workspace"
            style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}
          >
            <Eye size={12} /> Open
          </button>
          <button
            onClick={handlePDF}
            className="btn btn-sm"
            title="Export PDF Report"
            style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1' }}
          >
            <Download size={12} /> PDF
          </button>
          <button
            onClick={handleShare}
            className="btn btn-sm"
            title="Share Incident Link"
            style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1' }}
          >
            <Share2 size={12} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
