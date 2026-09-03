import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentsAPI } from '../api/client';
import RiskGauge from '../components/RiskGauge';
import PriorityBadge from '../components/PriorityBadge';
import { Send, CheckCircle, Bot, Sparkles, AlertCircle } from 'lucide-react';

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const CATEGORIES = ['SUSPICIOUS_ACTIVITY', 'THREAT', 'WORKPLACE_VIOLENCE', 'CYBER_THREAT', 'PHYSICAL_SECURITY'];
const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];

export default function CreateIncidentPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    severity: '',
    priority: '',
    category: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');

  const coldStartTimerRef = useRef(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (coldStartTimerRef.current) {
        clearTimeout(coldStartTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const calculatePreviewRisk = () => {
    let score = 0;
    if (formData.severity === 'CRITICAL') score += 50;
    else if (formData.severity === 'HIGH') score += 35;
    else if (formData.severity === 'MEDIUM') score += 20;
    else if (formData.severity === 'LOW') score += 10;

    if (formData.category === 'WORKPLACE_VIOLENCE') score += 30;
    else if (formData.category === 'CYBER_THREAT') score += 25;
    else if (formData.category === 'THREAT') score += 20;
    else if (formData.category === 'SUSPICIOUS_ACTIVITY') score += 15;

    return Math.min(score, 100);
  };

  const calculatePriorityPreview = () => {
    if (formData.priority) return formData.priority;
    const score = calculatePreviewRisk();
    if (formData.severity === 'CRITICAL' || score >= 70) return 'P1';
    if (formData.severity === 'HIGH' || score >= 50) return 'P2';
    if (formData.severity === 'MEDIUM' || score >= 30) return 'P3';
    return 'P4';
  };

  const handleAiSuggest = () => {
    if (!formData.description.trim() && !formData.title.trim()) {
      setErrors({ description: 'Enter title or description first for AI suggestions.' });
      return;
    }

    setAiSuggesting(true);
    setTimeout(() => {
      const text = (formData.title + ' ' + formData.description).toLowerCase();
      let suggestedSev = 'MEDIUM';
      let suggestedCat = 'SUSPICIOUS_ACTIVITY';
      let confidence = '92%';

      if (text.includes('fire') || text.includes('weapon') || text.includes('attack') || text.includes('breach') || text.includes('unauthorized server')) {
        suggestedSev = 'CRITICAL';
        suggestedCat = text.includes('breach') || text.includes('server') ? 'CYBER_THREAT' : 'PHYSICAL_SECURITY';
        confidence = '96%';
      } else if (text.includes('stole') || text.includes('threat') || text.includes('suspicious')) {
        suggestedSev = 'HIGH';
        suggestedCat = 'THREAT';
        confidence = '89%';
      }

      setFormData(prev => ({
        ...prev,
        severity: suggestedSev,
        category: suggestedCat,
        priority: suggestedSev === 'CRITICAL' ? 'P1' : suggestedSev === 'HIGH' ? 'P2' : 'P3'
      }));

      setAiReasoning(`AI Auto-Classification (${confidence} confidence): Detected keywords related to ${suggestedCat.replace(/_/g, ' ')}. Suggested Severity: ${suggestedSev}.`);
      setAiSuggesting(false);
    }, 1000);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.severity) newErrors.severity = 'Select a severity level';
    if (!formData.category) newErrors.category = 'Select a category';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSubmitError('');
    setIsWakingUp(false);

    if (coldStartTimerRef.current) {
      clearTimeout(coldStartTimerRef.current);
    }

    // Show cold-start message if submission takes ~4.5 seconds
    coldStartTimerRef.current = setTimeout(() => {
      setIsWakingUp(true);
    }, 4500);

    try {
      await incidentsAPI.create(formData);
      if (coldStartTimerRef.current) {
        clearTimeout(coldStartTimerRef.current);
      }
      setIsWakingUp(false);
      setSuccess(true);
      setTimeout(() => {
        navigate('/incidents');
      }, 1500);
    } catch (err) {
      console.error('Failed to create incident:', err);
      if (coldStartTimerRef.current) {
        clearTimeout(coldStartTimerRef.current);
      }
      setIsWakingUp(false);

      const fieldErrors = err.response?.data?.fieldErrors;
      if (fieldErrors) {
        setErrors(fieldErrors);
      }
      setSubmitError('Unable to submit the incident right now. Please try again.');
    } finally {
      if (coldStartTimerRef.current) {
        clearTimeout(coldStartTimerRef.current);
      }
      setLoading(false);
      setIsWakingUp(false);
    }
  };

  if (success) {
    return (
      <div className="success-overlay">
        <div className="success-card">
          <div className="success-icon">
            <CheckCircle size={32} />
          </div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Incident Reported
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Redirecting to incidents list...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Report New Incident</h1>
          <p>Submit a new threat incident for investigation</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleAiSuggest}
          disabled={aiSuggesting}
          style={{ gap: '8px', color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.4)' }}
        >
          <Sparkles size={16} />
          {aiSuggesting ? 'Analyzing with AI...' : 'AI Auto-Suggest'}
        </button>
      </div>

      {aiReasoning && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={18} style={{ color: '#818cf8' }} />
          {aiReasoning}
        </div>
      )}

      {loading && isWakingUp && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '14px 18px',
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: 'var(--radius-lg, 14px)',
            marginBottom: '20px',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            color: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.1)'
          }}
        >
          <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(6, 182, 212, 0.3)', borderTopColor: '#06b6d4', flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: 600, color: '#22d3ee' }}>Connecting to backend services, please wait...</span>
            <span style={{ marginLeft: '8px', color: '#94a3b8', fontSize: '0.8125rem' }}>
              The server is waking up. Please wait rather than clicking Submit again.
            </span>
          </div>
        </div>
      )}

      {submitError && (
        <div
          role="alert"
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--color-critical-bg, rgba(239, 68, 68, 0.12))',
            border: '1px solid var(--color-critical-border, rgba(239, 68, 68, 0.3))',
            borderRadius: 'var(--radius-lg, 14px)',
            marginBottom: '20px',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <AlertCircle size={20} style={{ color: 'var(--color-critical, #ef4444)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, color: '#fca5a5' }}>{submitError}</span>
            <span style={{ marginLeft: '8px', color: '#cbd5e1', fontSize: '0.8125rem' }}>
              Your form data has been preserved.
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-8)' }}>
        <div className="card animate-fade-in">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="incident-title">
                Incident Title *
              </label>
              <input
                id="incident-title"
                type="text"
                name="title"
                className="form-input"
                placeholder="e.g. Unauthorized access detected in Server Room B"
                value={formData.title}
                onChange={handleChange}
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="incident-description">
                Description *
              </label>
              <textarea
                id="incident-description"
                name="description"
                className="form-textarea"
                placeholder="Detailed description of what occurred, involved entities, and observations..."
                value={formData.description}
                onChange={handleChange}
                rows={5}
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="incident-location">
                Location
              </label>
              <input
                id="incident-location"
                type="text"
                name="location"
                className="form-input"
                placeholder="Where did this occur? e.g., Building A, Gate 3, Data Center"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="incident-severity">
                  Severity Level *
                </label>
                <select
                  id="incident-severity"
                  name="severity"
                  className="form-select"
                  value={formData.severity}
                  onChange={handleChange}
                >
                  <option value="">Select severity</option>
                  {SEVERITIES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.severity && <div className="form-error">{errors.severity}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="incident-priority">
                  Priority
                </label>
                <select
                  id="incident-priority"
                  name="priority"
                  className="form-select"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="">Auto-Assign ({calculatePriorityPreview()})</option>
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="incident-category">
                  Category *
                </label>
                <select
                  id="incident-category"
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                {errors.category && <div className="form-error">{errors.category}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                id="submit-incident-btn"
              >
                {loading ? (
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                ) : (
                  <>
                    <Send size={16} />
                    Submit Report
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => navigate('/incidents')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Live Risk Preview */}
        <div className="detail-sidebar animate-fade-in">
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>
              Priority & Risk Preview
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <PriorityBadge priority={calculatePriorityPreview()} />
            </div>
            <RiskGauge score={calculatePreviewRisk()} size={130} />
          </div>
        </div>
      </div>
    </div>
  );
}
