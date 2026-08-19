import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { incidentsAPI, commentsAPI, attachmentsAPI, auditLogsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import RiskGauge from '../components/RiskGauge';
import { exportIncidentPDF } from '../utils/exportUtils';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Trash2,
  CheckCircle,
  Search,
  AlertTriangle,
  MessageSquare,
  Paperclip,
  History,
  Send,
  UploadCloud,
  FileText,
  Bot,
  UserPlus,
  CheckSquare,
  Square,
  Download,
  Share2
} from 'lucide-react';
import CopyButton from '../components/CopyButton';
import { copyTextToClipboard } from '../utils/clipboard';

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Interactive Tab Data
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [auditLogs, setAuditLogs] = useState([]);
  const [relatedIncidents, setRelatedIncidents] = useState([]);

  // Assignment & Status updating
  const [assignedAnalyst, setAssignedAnalyst] = useState('');
  const [updatingAnalyst, setUpdatingAnalyst] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // AI Summary State
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');



  const fetchComments = async () => {
    try {
      const res = await commentsAPI.getByIncident(id);
      setComments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const fetchAttachments = async () => {
    try {
      const res = await attachmentsAPI.getByIncident(id);
      setAttachments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await auditLogsAPI.getByIncident(id);
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadAllData = async () => {
      try {
        const [incRes, comRes, attRes, logRes, relRes] = await Promise.allSettled([
          incidentsAPI.getById(id),
          commentsAPI.getByIncident(id),
          attachmentsAPI.getByIncident(id),
          auditLogsAPI.getByIncident(id),
          incidentsAPI.getRelated(id),
        ]);

        if (isMounted && incRes.status === 'fulfilled') {
          setIncident(incRes.value.data);
          setAssignedAnalyst(incRes.value.data.assignedTo || '');
          if (incRes.value.data.aiSummary) {
            setAiSummaryText(incRes.value.data.aiSummary);
          }
        } else if (incRes.status === 'rejected') {
          navigate('/incidents');
        }

        if (isMounted && comRes.status === 'fulfilled') setComments(comRes.value.data || []);
        if (isMounted && attRes.status === 'fulfilled') setAttachments(attRes.value.data || []);
        if (isMounted && logRes.status === 'fulfilled') setAuditLogs(logRes.value.data || []);
        if (isMounted && relRes.status === 'fulfilled') setRelatedIncidents(relRes.value.data || []);
      } catch (err) {
        console.error('Failed to load incident detail data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAllData();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await incidentsAPI.updateStatus(id, newStatus);
      setIncident(res.data);
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignAnalyst = async () => {
    if (!assignedAnalyst.trim()) return;
    setUpdatingAnalyst(true);
    try {
      const res = await incidentsAPI.assignAnalyst(id, assignedAnalyst, assignedAnalyst);
      setIncident(res.data);
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to assign analyst:', err);
    } finally {
      setUpdatingAnalyst(false);
    }
  };

  const handleToggleChecklist = async (itemId) => {
    try {
      const res = await incidentsAPI.toggleChecklist(id, itemId);
      setIncident(res.data);
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to toggle checklist:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await commentsAPI.add(id, newComment);
      setNewComment('');
      fetchComments();
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await attachmentsAPI.upload(id, formData);
      fetchAttachments();
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleGenerateAiSummary = () => {
    setGeneratingAi(true);
    setTimeout(() => {
      const summary = `AI Executive Analysis: Incident "${incident.title}" (Severity: ${incident.severity}) involves reported ${incident.category ? incident.category.replace(/_/g, ' ') : 'threat activity'} at location "${incident.location || 'Unspecified'}". Current Risk Score stands at ${incident.riskScore}/100. Immediate containment and network isolation recommended for mitigation.`;
      setAiSummaryText(summary);
      setGeneratingAi(false);
    }, 1200);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusSteps = ['OPEN', 'INVESTIGATING', 'WAITING_EVIDENCE', 'RESOLVED', 'CLOSED'];
  const currentStatusIndex = statusSteps.indexOf(incident?.status || 'OPEN');

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
      {/* Back button & Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/incidents')}
        >
          <ArrowLeft size={16} />
          Back to Incidents
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => exportIncidentPDF(incident)}>
            <Download size={14} /> PDF Report
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={async () => {
              await copyTextToClipboard(window.location.href);
              alert('Incident link copied to clipboard!');
            }}
          >
            <Share2 size={14} /> Share Link
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <PriorityBadge priority={incident.priority || 'P3'} />
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
              <CopyButton
                text={incident.id || id}
                ariaLabel="Copy Incident ID"
                iconSize={13}
                style={{
                  padding: '2px 8px',
                  fontSize: '12px',
                  borderRadius: '6px',
                }}
              >
                {({ copied }) => (
                  <>
                    <span>{incident.id || id}</span>
                    <span style={{ fontSize: '10px', color: copied ? '#10b981' : '#64748b' }}>
                      {copied ? 'Copied!' : 'Copy'}
                    </span>
                  </>
                )}
              </CopyButton>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '4px 0' }}>
              {incident.title}
            </h1>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', color: '#94a3b8', fontSize: '0.875rem' }}>
              <span>Location: <strong>{incident.location || 'Not specified'}</strong></span>
              <span>Reported by: <strong>{incident.reportedBy || 'Unknown'}</strong></span>
              <span>Department: <strong>{incident.department || 'SOC Team'}</strong></span>
              <span>Assigned Analyst: <strong>{incident.assignedToName || incident.assignedTo || 'Unassigned'}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleGenerateAiSummary} disabled={generatingAi}>
              <Bot size={16} /> {generatingAi ? 'Generating AI Summary...' : 'AI Summary'}
            </button>
          </div>
        </div>

        {/* Status Progress Stepper */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>
            Investigation Lifecycle Progress
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {statusSteps.map((st, idx) => {
              const isPassed = idx <= currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;
              return (
                <div
                  key={st}
                  onClick={() => handleStatusUpdate(st)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 2,
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: isPassed ? '#3b82f6' : '#1e293b',
                      color: isPassed ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: isCurrent ? '3px solid #60a5fa' : '2px solid #334155',
                      boxShadow: isCurrent ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none'
                    }}
                  >
                    {idx + 1}
                  </div>
                  <span style={{ fontSize: '11px', marginTop: '6px', fontWeight: isCurrent ? 700 : 500, color: isPassed ? '#f8fafc' : '#64748b' }}>
                    {st.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
            {/* Background Line */}
            <div
              style={{
                position: 'absolute',
                top: '14px',
                left: '20px',
                right: '20px',
                height: '2px',
                backgroundColor: '#334155',
                zIndex: 1
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 'var(--space-6)',
          paddingBottom: '2px',
        }}
      >
        {[
          { id: 'overview', label: 'Overview', icon: FileText },
          { id: 'timeline', label: `Timeline (${auditLogs.length})`, icon: History },
          { id: 'comments', label: `Comments (${comments.length})`, icon: MessageSquare },
          { id: 'evidence', label: `Evidence Files (${attachments.length})`, icon: Paperclip },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '2px solid var(--color-primary, #6366f1)' : '2px solid transparent',
                color: isActive ? 'var(--color-primary, #6366f1)' : 'var(--color-text-muted)',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid View */}
      <div className="detail-grid">
        {/* Main Tab Content */}
        <div className="detail-main">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card">
                {aiSummaryText && (
                  <div
                    style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '24px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#818cf8', marginBottom: '6px' }}>
                      <Bot size={18} /> AI Executive Summary
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>{aiSummaryText}</p>
                  </div>
                )}

                <div className="detail-field">
                  <div className="detail-field-label">Description</div>
                  <div className="detail-field-value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{incident.description}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginTop: '24px' }}>
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
                    <div className="detail-field-label">Created At</div>
                    <div className="detail-field-value" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                      {formatDate(incident.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Investigation Checklist Card */}
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquare size={18} style={{ color: '#3b82f6' }} /> SOC Investigation Checklist
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(incident.checklist || []).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: item.completed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: item.completed ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--color-border)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.completed ? (
                          <CheckSquare size={18} style={{ color: '#10b981' }} />
                        ) : (
                          <Square size={18} style={{ color: '#64748b' }} />
                        )}
                        <span style={{ fontSize: '14px', textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#94a3b8' : '#f8fafc' }}>
                          {item.title}
                        </span>
                      </div>
                      {item.completed && (
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                          Completed by {item.completedBy || 'Analyst'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Incidents Card */}
              {relatedIncidents.length > 0 && (
                <div className="card">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
                    Related Historical Incidents
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {relatedIncidents.map((rel) => (
                      <Link
                        key={rel.id}
                        to={`/incidents/${rel.id}`}
                        style={{
                          display: 'block',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                          <SeverityBadge severity={rel.severity} />
                          <StatusBadge status={rel.status} />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rel.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                          {rel.category ? rel.category.replace(/_/g, ' ') : 'Incident'}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px' }}>Investigation History</h3>
              <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid var(--color-border)' }}>
                {auditLogs.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>No timeline events recorded yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} style={{ marginBottom: '24px', position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '-31px',
                          top: '2px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-primary, #6366f1)',
                          border: '3px solid var(--color-bg-surface, #1e293b)',
                        }}
                      />
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                        {log.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                        By <strong>{log.actorName || log.actorUsername}</strong> • {formatDate(log.timestamp)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMMENTS */}
          {activeTab === 'comments' && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px' }}>Investigation Discussion</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {comments.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>No comments added yet. Start the investigation discussion below.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#6366f1' }}>{c.authorFullName || c.authorUsername}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(c.createdAt)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5 }}>{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment box */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type a comment or status note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" type="submit" disabled={submittingComment || !newComment.trim()}>
                  <Send size={16} /> Post
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: EVIDENCE FILES */}
          {activeTab === 'evidence' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Evidence Attachments</h3>
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                  <UploadCloud size={16} /> {uploadingFile ? 'Uploading...' : 'Upload Evidence'}
                  <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploadingFile} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {attachments.length === 0 ? (
                  <p style={{ color: '#94a3b8', gridColumn: '1/-1' }}>No evidence uploaded yet. Attach logs, screenshots, or reports above.</p>
                ) : (
                  attachments.map((att) => (
                    <div key={att.id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <FileText size={20} style={{ color: '#6366f1' }} />
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: 600 }}>
                          {att.originalName}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px' }}>
                        {(att.fileSize / 1024).toFixed(1)} KB • {att.uploadedBy}
                      </div>
                      <a
                        href={attachmentsAPI.getFileUrl(att.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        View File
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          {/* Risk Score */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>
              Risk Assessment Score
            </h3>
            <RiskGauge score={incident.riskScore} size={130} />
          </div>

          {/* Analyst Assignment Panel */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
              Assign Analyst
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Analyst username..."
                value={assignedAnalyst}
                onChange={(e) => setAssignedAnalyst(e.target.value)}
                style={{ flex: 1, fontSize: '0.85rem' }}
              />
              <button className="btn btn-secondary btn-sm" onClick={handleAssignAnalyst} disabled={updatingAnalyst}>
                <UserPlus size={14} /> Assign
              </button>
            </div>
          </div>

          {/* Admin / Analyst Actions */}
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
              Update Status Pipeline
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {statusSteps.map((st) => (
                <button
                  key={st}
                  className={`btn btn-sm ${incident.status === st ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleStatusUpdate(st)}
                  disabled={updatingStatus || incident.status === st}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {st === 'RESOLVED' && <CheckCircle size={14} />}
                  {st === 'INVESTIGATING' && <Search size={14} />}
                  {st === 'OPEN' && <AlertTriangle size={14} />}
                  {st.replace('_', ' ')}
                </button>
              ))}

              {isAdmin() && (
                <>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '12px 0' }} />
                  <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                    <Trash2 size={14} /> Delete Incident
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
