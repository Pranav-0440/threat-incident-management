import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../api/client';
import {
  Shield,
  LayoutDashboard,
  AlertTriangle,
  PlusCircle,
  LogOut,
  Bell,
  CheckCheck
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
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Shield size={20} />
          </div>
          <span>ThreatGuard</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
          <Link to="/incidents" className={isActive('/incidents')}>
            <AlertTriangle size={16} />
            Incidents
          </Link>
          <Link to="/incidents/new" className={isActive('/incidents/new')}>
            <PlusCircle size={16} />
            Report
          </Link>
        </div>

        <div className="navbar-user" style={{ position: 'relative' }}>
          {/* Bell Notification Icon */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
              style={{ position: 'relative', padding: '8px' }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Drawer */}
            {showNotifications && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  width: '320px',
                  backgroundColor: 'var(--color-bg-surface, #1e293b)',
                  border: '1px solid var(--color-border, #334155)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  zIndex: 1000,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-border, #334155)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary, #6366f1)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        to={n.incidentId ? `/incidents/${n.incidentId}` : '#'}
                        onClick={() => setShowNotifications(false)}
                        style={{
                          display: 'block',
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--color-border, #334155)',
                          textDecoration: 'none',
                          color: 'inherit',
                          backgroundColor: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '2px', color: '#f8fafc' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="user-name">{user?.username}</div>
              <span className={`role-badge ${isAdmin() ? 'admin' : 'analyst'}`}>
                {isAdmin() ? 'Admin' : 'Analyst'}
              </span>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={logout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
