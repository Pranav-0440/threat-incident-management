import { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../api/client";
import { Shield, Mail } from "lucide-react";

function ForgotPasswordPage() {
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMessage("");
    setForgotError("");
    setForgotLoading(true);

    try {
      const response = await authAPI.forgotPassword(forgotIdentifier.trim());
      setForgotMessage(
        response.data?.message ||
          "If an account matches that identifier, a password reset link will be sent.",
      );
    } catch (err) {
      setForgotError(
        err.response?.data?.message ||
          "Unable to process the password reset request. Please try again later.",
      );
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

      <h1 className="auth-title">Forgot your password?</h1>
      <p className="auth-subtitle">Enter your username or email. If an account matches, we will send a reset link.</p>

      {forgotError && <div className="auth-error">{forgotError}</div>}
      {forgotMessage && <div className="auth-success">{forgotMessage}</div>}

      <form onSubmit={handleForgotPassword}>
        <div className="form-group">
          <label className="form-label" htmlFor="forgot-identifier">Username or Email</label>
          <input
            id="forgot-identifier"
            type="text"
            className="form-input"
            placeholder="Enter your username or email address"
            value={forgotIdentifier}
            onChange={(e) => setForgotIdentifier(e.target.value)}
            required
            autoComplete="username"
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={forgotLoading}
          style={{ width: '100%' }}
        >
          {forgotLoading ? (
            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          ) : (
            <>
              <Mail size={18} />
              Send reset link
            </>
          )}
        </button>
      </form>

      <div className="auth-footer">
        <Link to="/login">Back to Sign In</Link>
      </div>
    </div>
  </div>
);
}

export default ForgotPasswordPage;
