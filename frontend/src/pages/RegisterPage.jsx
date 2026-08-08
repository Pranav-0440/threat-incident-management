import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, UserPlus, UserCheck, ShieldAlert } from 'lucide-react';

const ROLE_OPTIONS = [
  {
    id: 'ANALYST',
    title: 'SOC Analyst',
    subtitle: 'Monitor & report threats',
    Icon: UserCheck,
    activeColor: '#60a5fa',
    borderColor: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.12)'
  },
  {
    id: 'ADMIN',
    title: 'Administrator',
    subtitle: 'Full org & user console',
    Icon: ShieldAlert,
    activeColor: '#f87171',
    borderColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.12)'
  }
];

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

  const handleRoleSelect = (selectedRole) => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
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
          <fieldset className="form-group" style={{ marginBottom: 'var(--space-4)', border: 'none', padding: 0, margin: 0 }}>
            <legend className="form-label" style={{ marginBottom: '6px' }}>Select Dashboard Role</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {ROLE_OPTIONS.map(({ id, title, subtitle, Icon, activeColor, borderColor, bgColor }) => {
                const isSelected = formData.role === id;
                return (
                  <button
                    key={id}
                    type="button"
                    id={`role-${id.toLowerCase()}-btn`}
                    onClick={() => handleRoleSelect(id)}
                    aria-pressed={isSelected}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid ${borderColor}` : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? bgColor : 'rgba(15, 23, 42, 0.4)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      outline: 'none'
                    }}
                  >
                    <div style={{ color: isSelected ? activeColor : '#94a3b8', marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>
                      <Icon size={20} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? '#fff' : '#cbd5e1' }}>
                      {title}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      {subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>

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
