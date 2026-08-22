import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import { Shield, LogIn, Mail } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || !err.response) {
        setError('⚡ Backend server is starting up or compiling after deployment. Please wait 15–30 seconds and click Sign In again!');
      } else if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.retryAfterSeconds;
        setError(retryAfter
          ? `Too many attempts. Please wait ${retryAfter} seconds before trying again.`
          : 'Too many attempts. Please wait before trying again.');
      } else if (err.response?.status === 403 || err.response?.status === 401) {
        setError(err.response?.data?.message || 'Invalid username or password');
      } else {
        setError(err.response?.data?.message || err.message || 'Invalid username or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMessage('');
    setForgotError('');
    setForgotLoading(true);

    try {
      const response = await authAPI.forgotPassword(forgotIdentifier.trim());
      setForgotMessage(response.data?.message || 'If an account matches that identifier, a password reset link will be sent.');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Unable to process the password reset request. Please try again later.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-scale-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Shield size={24} />
          </div>
          <h2>ThreatGuard</h2>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">Username or Email</label>
            <input
              id="login-username"
              type="text"
              className="form-input"
              placeholder="Enter your username or email address"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
            id="login-submit"
          >
            {loading ? (
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          className="auth-link-button"
          onClick={() => {
            setForgotOpen((open) => !open);
            setForgotMessage('');
            setForgotError('');
          }}
          aria-expanded={forgotOpen}
        >
          Forgot password?
        </button>

        {forgotOpen && (
          <div className="auth-reset-panel">
            <h2>Reset your password</h2>
            <p>Enter your username or email. If an account matches, we will send a reset link.</p>
            {forgotError && <div className="auth-error">{forgotError}</div>}
            {forgotMessage && <div className="auth-success">{forgotMessage}</div>}
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-identifier">Username or Email</label>
                <input
                  id="forgot-identifier"
                  type="text"
                  className="form-input"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <button type="submit" className="btn btn-secondary" disabled={forgotLoading} style={{ width: '100%' }}>
                {forgotLoading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Mail size={18} /> Send reset link</>}
              </button>
            </form>
          </div>
        )}

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
