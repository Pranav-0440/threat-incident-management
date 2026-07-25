import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Building, Sliders, Bell, Shield, HardDrive, Save } from 'lucide-react';

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileName, setProfileName] = useState(user?.fullName || user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);

  // Risk formula settings
  const [criticalWeight, setCriticalWeight] = useState(50);
  const [highWeight, setHighWeight] = useState(35);
  const [mediumWeight, setMediumWeight] = useState(20);
  const [lowWeight, setLowWeight] = useState(10);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1>System & Profile Settings</h1>
        <p>Configure account profile preferences, security policies, incident risk scoring rules, and integrations</p>
      </div>

      {saved && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontWeight: 600 }}>
          ✓ Settings saved successfully!
        </div>
      )}

      {/* Settings Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-6)', overflowX: 'auto' }}>
        {[
          { id: 'profile', label: 'My Profile', icon: User, adminOnly: false },
          { id: 'rules', label: 'Incident Risk Rules', icon: Sliders, adminOnly: true },
          { id: 'notifications', label: 'Notification Channels', icon: Bell, adminOnly: true },
          { id: 'organization', label: 'Organization & Logo', icon: Building, adminOnly: true },
          { id: 'security', label: 'Security & Auth', icon: Shield, adminOnly: true },
          { id: 'storage', label: 'Evidence Storage', icon: HardDrive, adminOnly: true },
        ].filter(t => !t.adminOnly || isAdmin()).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`btn ${activeTab === id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Profile Settings Form */}
      {activeTab === 'profile' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>User Profile Settings</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Account Role</label>
              <input type="text" className="form-input" value={isAdmin() ? 'ADMINISTRATOR' : 'SOC ANALYST'} disabled style={{ opacity: 0.6 }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Incident Risk Rules (Admin Only) */}
      {activeTab === 'rules' && isAdmin() && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Automated Risk Score Calculator Weights</h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Critical Severity Weight (+pts)</label>
                <input type="number" className="form-input" value={criticalWeight} onChange={(e) => setCriticalWeight(+e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">High Severity Weight (+pts)</label>
                <input type="number" className="form-input" value={highWeight} onChange={(e) => setHighWeight(+e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Medium Severity Weight (+pts)</label>
                <input type="number" className="form-input" value={mediumWeight} onChange={(e) => setMediumWeight(+e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Low Severity Weight (+pts)</label>
                <input type="number" className="form-input" value={lowWeight} onChange={(e) => setLowWeight(+e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> Save Risk Formula
            </button>
          </form>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && isAdmin() && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Alert Channels & Webhooks</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc' }}>
              <input type="checkbox" defaultChecked /> In-App Bell Drawer Notifications
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc' }}>
              <input type="checkbox" defaultChecked /> Email Dispatch for P1 Critical Incidents
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc' }}>
              <input type="checkbox" /> Slack / Microsoft Teams Webhook Integrations
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
