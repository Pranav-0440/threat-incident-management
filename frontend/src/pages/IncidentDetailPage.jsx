import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { incidentsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import RiskGauge from '../components/RiskGauge';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Trash2,
  CheckCircle,
  Search,
  AlertTriangle,
} from 'lucide-react';

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const fetchIncident = async () => {
    try {
      const res = await incidentsAPI.getById(id);
      setIncident(res.data);
    } catch (err) {
      console.error('Failed to fetch incident:', err);
      navigate('/incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await incidentsAPI.updateStatus(id, newStatus);
      setIncident(res.data);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this incident? This action cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      await incidentsAPI.delete(id);
      navigate('/incidents');
    } catch (err) {
      console.error('Failed to delete incident:', err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (!incident) return null;

  return (
    <div className="page-container">
      {/* Back button */}
      <button
        className="btn btn-ghost"
        onClick={() => navigate('/incidents')}
        style={{ marginBottom: 'var(--space-5)' }}
      >
        <ArrowLeft size={16} />
        Back to Incidents
      </button>

      <div className="detail-grid animate-fade-in">
        {/* Main content */}
        <div className="detail-main">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
              <div>
                <h1 style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-3)',
                }}>
                  {incident.title}
                </h1>
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <SeverityBadge severity={incident.severity} />
                  <StatusBadge status={incident.status} />
                </div>
              </div>
            </div>

            <div className="detail-field">
              <div className="detail-field-label">Description</div>
              <div className="detail-field-value">{incident.description}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
              <div className="detail-field">
                <div className="detail-field-label">Category</div>
                <div className="detail-field-value">
                  {(incident.category || 'N/A').replace(/_/g, ' ')}
                </div>
              </div>

              <div className="detail-field">
                <div className="detail-field-label">Location</div>
                <div className="detail-field-value" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <MapPin size={14} style={{ color: 'var(--color-text-muted)' }} />
                  {incident.location || 'Not specified'}
                </div>
              </div>

              <div className="detail-field">
                <div className="detail-field-label">Reported By</div>
                <div className="detail-field-value" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <User size={14} style={{ color: 'var(--color-text-muted)' }} />
                  {incident.reportedBy || 'Unknown'}
                </div>
              </div>

              <div className="detail-field">
                <div className="detail-field-label">Created</div>
                <div className="detail-field-value" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                  {formatDate(incident.createdAt)}
                </div>
              </div>
            </div>

            {incident.updatedAt && (
              <div className="detail-field">
                <div className="detail-field-label">Last Updated</div>
                <div className="detail-field-value" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                  {formatDate(incident.updatedAt)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          {/* Risk Score */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-8)' }}>
            <h3 style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--space-5)',
            }}>
              Risk Assessment
            </h3>
            <RiskGauge score={incident.riskScore} size={140} />
          </div>

          {/* Admin Actions */}
          {isAdmin() && (
            <div className="card">
              <h3 style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-5)',
              }}>
                Actions
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <label style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 500,
                  marginBottom: 'var(--space-1)',
                }}>
                  Update Status
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {['OPEN', 'INVESTIGATING', 'RESOLVED'].map(status => (
                    <button
                      key={status}
                      className={`btn btn-sm ${incident.status === status ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={updating || incident.status === status}
                    >
                      {status === 'RESOLVED' && <CheckCircle size={12} />}
                      {status === 'INVESTIGATING' && <Search size={12} />}
                      {status === 'OPEN' && <AlertTriangle size={12} />}
                      {status}
                    </button>
                  ))}
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />

                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  id="delete-incident-btn"
                >
                  <Trash2 size={14} />
                  {deleting ? 'Deleting...' : 'Delete Incident'}
                </button>
              </div>
            </div>
          )}

          {/* Incident ID */}
          <div className="card">
            <div className="detail-field" style={{ marginBottom: 0 }}>
              <div className="detail-field-label">Incident ID</div>
              <div className="detail-field-value" style={{
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'monospace',
                color: 'var(--color-text-muted)',
                wordBreak: 'break-all',
              }}>
                {incident.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
