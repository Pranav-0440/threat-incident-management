import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, UserPlus, UserCheck } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'ANALYST',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        setError(Object.values(err.response.data.fieldErrors).join('. '));
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(`${err.message}. Check backend connection.`);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-scale-in" style={{ maxWidth: '440px' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Shield size={24} />
          </div>
          <h2>ThreatGuard</h2>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Select account type to start managing incidents</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            marginBottom: 'var(--space-4)'
          }}>
            <div style={{ color: '#60a5fa', flexShrink: 0 }}>
              <UserCheck size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>
                SOC Analyst Registration
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Standard self-registration provisions Analyst permissions. Administrator access is provisioned by SOC Management.
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label" htmlFor="reg-fullname">Full Name</label>
            <input
              id="reg-fullname"
              type="text"
              name="fullName"
              className="form-input"
              placeholder="Your full name"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              type="text"
              name="username"
              className="form-input"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={50}
              autoFocus
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
              Must be between 3 and 50 characters
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              className="form-input"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              name="password"
              className="form-input"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
              Must be at least 6 characters
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
            id="register-submit"
          >
            {loading ? (
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : (
              <>
                <UserPlus size={18} />
                Create {formData.role === 'ADMIN' ? 'Administrator' : 'Analyst'} Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
