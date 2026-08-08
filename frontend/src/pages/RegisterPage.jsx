import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, UserPlus, UserCheck, ShieldAlert } from 'lucide-react';

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
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
        const errorMsg = Object.values(err.response.data.fieldErrors).join('. ');
        setError(errorMsg);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(`${err.message}. Check backend API URL and network connection.`);
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
          {/* Account Role Selector */}
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">Select Dashboard Role</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
              <div
                onClick={() => handleRoleSelect('ANALYST')}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: formData.role === 'ANALYST' ? '2px solid #3b82f6' : '1px solid var(--color-border)',
                  backgroundColor: formData.role === 'ANALYST' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(15, 23, 42, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{ color: formData.role === 'ANALYST' ? '#60a5fa' : '#94a3b8', marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>
                  <UserCheck size={20} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: formData.role === 'ANALYST' ? '#fff' : '#cbd5e1' }}>
                  SOC Analyst
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  Monitor & report threats
                </div>
              </div>

              <div
                onClick={() => handleRoleSelect('ADMIN')}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: formData.role === 'ADMIN' ? '2px solid #ef4444' : '1px solid var(--color-border)',
                  backgroundColor: formData.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(15, 23, 42, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{ color: formData.role === 'ADMIN' ? '#f87171' : '#94a3b8', marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>
                  <ShieldAlert size={20} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: formData.role === 'ADMIN' ? '#fff' : '#cbd5e1' }}>
                  Administrator
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  Full org & user console
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
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
