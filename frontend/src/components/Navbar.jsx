import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../api/client';
import {
  Shield,
  LayoutDashboard,
  AlertTriangle,
  PlusCircle,
  Users,
  LogOut,
  Bell,
  CheckCheck,
  FileText,
  Settings,
  BarChart2
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const loadNotifications = async () => {
      try {
        const res = await notificationsAPI.getAll();
        if (isMounted) setNotifications(res.data || []);
        const countRes = await notificationsAPI.getUnreadCount();
        if (isMounted) setUnreadCount(countRes.data?.unreadCount || 0);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  return (
    <aside className="sidebar-nav">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <Link to="/" className="sidebar-brand-link">
          <div className="sidebar-brand-icon">
            <Shield size={20} />
          </div>
          <span className="sidebar-brand-text">ThreatGuard</span>
        </Link>
      </div>

      {/* Main Navigation Links */}
      <div className="sidebar-links">
        <div className="sidebar-section-title">MAIN NAVIGATION</div>
        
        <Link to="/" className={`sidebar-link ${isActive('/')}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>

        <Link to="/incidents" className={`sidebar-link ${isActive('/incidents')}`}>
          <AlertTriangle size={18} />
          <span>Incidents</span>
        </Link>

        <Link to="/incidents/new" className={`sidebar-link ${isActive('/incidents/new')}`}>
          <PlusCircle size={18} />
          <span>Report Incident</span>
        </Link>

        {/* Role-Gated Admin Section */}
        {isAdmin() && (
          <>
            <div className="sidebar-section-title" style={{ marginTop: '16px' }}>ADMINISTRATION</div>
            <Link to="/admin/users" className={`sidebar-link ${isActive('/admin/users')}`}>
              <Users size={18} />
              <span>User Admin</span>
            </Link>
          </>
        )}

        <div className="sidebar-section-title" style={{ marginTop: '16px' }}>REPORTS & ANALYTICS</div>
        <Link to="/reports" className={`sidebar-link ${isActive('/reports')}`}>
          <FileText size={18} />
          <span>Reports</span>
        </Link>

        <Link to="/analytics" className={`sidebar-link ${isActive('/analytics')}`}>
          <BarChart2 size={18} />
          <span>Analytics</span>
        </Link>

        <Link to="/settings" className={`sidebar-link ${isActive('/settings')}`}>
          <Settings size={18} />
          <span>Settings</span>
        </Link>
      </div>

      {/* Notification Drawer Trigger */}
      <div className="sidebar-notifications-wrapper" style={{ position: 'relative', padding: '0 16px', marginBottom: '12px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowNotifications(!showNotifications)}
          style={{ width: '100%', justifyContent: 'space-between', padding: '8px 12px' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} /> Notifications
          </span>
          {unreadCount > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 700 }}>
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '16px',
              right: '16px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              overflow: 'hidden',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #334155' }}>
              <span style={{ fontWeight: 600, fontSize: '12px' }}>Notifications</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '11px' }}>
                  <CheckCheck size={12} /> Mark read
                </button>
              )}
            </div>
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>No notifications</div>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    to={n.incidentId ? `/incidents/${n.incidentId}` : '#'}
                    onClick={() => setShowNotifications(false)}
                    style={{ display: 'block', padding: '10px 14px', borderBottom: '1px solid #334155', textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>{n.title}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{n.message}</div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Footer Snippet */}
      <div className="sidebar-user-footer">
        <div className="user-avatar" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
          {user?.username?.charAt(0) || 'U'}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.username}</div>
          <div className="sidebar-user-role">
            {isAdmin() ? 'Administrator' : 'SOC Analyst'}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout} title="Logout" style={{ padding: '6px' }}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
