import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound, Shield } from 'lucide-react';
import { authAPI } from '../api/client';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword(token.trim(), newPassword);
      setSuccess(response.data?.message || 'Password reset successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'The password reset link is invalid or has expired.');
    } finally {
      setLoading(false);
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

        <h1 className="auth-title">Choose a new password</h1>
        <p className="auth-subtitle">Use your one-time reset link to secure your account.</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reset-token">Reset token</label>
            <input
              id="reset-token"
              type="text"
              className="form-input"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
              autoComplete="one-time-code"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-password-confirm">Confirm new password</label>
            <input
              id="reset-password-confirm"
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><KeyRound size={18} /> Reset password</>}
          </button>
        </form>

        <div className="auth-footer">
          Remembered your password? <Link to="/login">Return to sign in</Link>
        </div>
      </div>
    </div>
  );
}
