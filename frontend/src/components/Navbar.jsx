import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  AlertTriangle,
  PlusCircle,
  LogOut
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

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

        <div className="navbar-user">
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
