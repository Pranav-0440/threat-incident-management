import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentsAPI } from '../api/client';
import RiskGauge from '../components/RiskGauge';
import { Send, CheckCircle } from 'lucide-react';

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const CATEGORIES = ['SUSPICIOUS_ACTIVITY', 'THREAT', 'WORKPLACE_VIOLENCE'];

export default function CreateIncidentPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    severity: '',
    category: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Live risk score preview
  const calculatePreviewRisk = () => {
    let score = 0;
    if (formData.severity === 'CRITICAL') score += 50;
    else if (formData.severity === 'HIGH') score += 35;
    else if (formData.severity === 'MEDIUM') score += 20;
    else if (formData.severity === 'LOW') score += 10;

    if (formData.category === 'WORKPLACE_VIOLENCE') score += 30;
    else if (formData.category === 'THREAT') score += 20;
    else if (formData.category === 'SUSPICIOUS_ACTIVITY') score += 15;

    return Math.min(score, 100);
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
    try {
      await incidentsAPI.create(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/incidents');
      }, 2000);
    } catch (err) {
      console.error('Failed to create incident:', err);
      const fieldErrors = err.response?.data?.fieldErrors;
      if (fieldErrors) {
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
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
      <div className="page-header">
        <h1>Report New Incident</h1>
        <p>Submit a new threat incident for investigation</p>
      </div>

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
                placeholder="Brief description of the incident"
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
                placeholder="Detailed description of what occurred..."
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
                placeholder="Where did this occur? e.g., Building A, Gate 3"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
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
        <div className="detail-sidebar animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-8)' }}>
            <h3 style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--space-5)',
            }}>
              Risk Preview
            </h3>
            <RiskGauge score={calculatePreviewRisk()} size={140} />
            <p style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              marginTop: 'var(--space-4)',
              lineHeight: 1.5,
            }}>
              Risk score is auto-calculated based on severity and category selection
            </p>
          </div>

          <div className="card">
            <h3 style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--space-4)',
            }}>
              Risk Scoring Guide
            </h3>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              <div><strong>Severity:</strong></div>
              <div style={{ paddingLeft: 'var(--space-3)' }}>
                Critical = +50 · High = +35<br />
                Medium = +20 · Low = +10
              </div>
              <div style={{ marginTop: 'var(--space-2)' }}><strong>Category:</strong></div>
              <div style={{ paddingLeft: 'var(--space-3)' }}>
                Workplace Violence = +30<br />
                Threat = +20 · Suspicious = +15
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
