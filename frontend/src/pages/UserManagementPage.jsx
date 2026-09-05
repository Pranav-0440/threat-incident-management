import { useEffect, useState } from 'react';
import { usersAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, UserCheck, Mail, Activity, RefreshCw } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const { user: currentUser, isSuperAdmin } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await usersAPI.getAll();
        if (isMounted) setUsers(res.data || []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRoleToggle = async (targetUser) => {
    const isCurrentlyAdmin = targetUser.roles?.some(r => r.includes('ADMIN'));
    const newRole = isCurrentlyAdmin ? 'ANALYST' : 'ADMIN';

    setUpdatingId(targetUser.id);
    try {
      await usersAPI.updateRole(targetUser.id, newRole);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user role:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Admin User Management</h1>
          <p>Manage SOC analyst accounts, assign role permissions, and review active analyst workloads</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchUsers} title="Refresh User List">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* User Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Total Registered Users</div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stat-card-value">{users.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Active Analysts</div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <UserCheck size={20} />
            </div>
          </div>
          <div className="stat-card-value">
            {users.filter(u => u.roles?.includes('ROLE_ANALYST')).length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">System Administrators</div>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <Shield size={20} />
            </div>
          </div>
          <div className="stat-card-value">
            {users.filter(u => u.roles?.some(r => r.includes('ADMIN'))).length}
          </div>
          <div style={{ fontSize: '11px', color: '#a855f7', marginTop: '4px' }}>
            {users.filter(u => u.roles?.some(r => r.includes('SUPER_ADMIN'))).length} Super Admins
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Analyst</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Email</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Workload (Active / Total)</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  No users found or connection error. Click "Refresh" above to reload.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSuperAdminUser = Boolean(u.roles?.some(r => r.includes('SUPER_ADMIN')));
                const isAdminUser = Boolean(u.roles?.some(r => r === 'ROLE_ADMIN' || r === 'ADMIN'));
                const isSelf = currentUser?.username === u.username;
                const canModify = !isSelf && (!isSuperAdminUser || isSuperAdmin?.());

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.2s ease' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: isSuperAdminUser
                              ? 'rgba(168, 85, 247, 0.2)'
                              : isAdminUser
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(59, 130, 246, 0.2)',
                            color: isSuperAdminUser
                              ? '#c084fc'
                              : isAdminUser
                              ? '#ef4444'
                              : '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '14px'
                          }}
                        >
                          {(u.fullName || u.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '14px' }}>
                            {u.fullName || u.username} {isSelf && <span style={{ fontSize: '10px', background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>YOU</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: isSuperAdminUser
                            ? 'rgba(168, 85, 247, 0.15)'
                            : isAdminUser
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                          color: isSuperAdminUser
                            ? '#c084fc'
                            : isAdminUser
                            ? '#ef4444'
                            : '#60a5fa',
                          border: isSuperAdminUser
                            ? '1px solid rgba(168, 85, 247, 0.4)'
                            : isAdminUser
                            ? '1px solid rgba(239, 68, 68, 0.3)'
                            : '1px solid rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        {isSuperAdminUser ? 'SUPER ADMINISTRATOR' : (isAdminUser ? 'ADMINISTRATOR' : 'SOC ANALYST')}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#cbd5e1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} style={{ color: '#64748b' }} /> {u.email || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={14} style={{ color: u.activeAssigned > 0 ? '#f97316' : '#10b981' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: u.activeAssigned > 0 ? '#f97316' : '#f8fafc' }}>
                          {u.activeAssigned || 0} Active
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          ({u.totalAssigned || 0} Total)
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRoleToggle(u)}
                        disabled={updatingId === u.id || !canModify || isSuperAdminUser}
                        title={
                          isSelf
                            ? 'Cannot change own role'
                            : isSuperAdminUser
                            ? 'Super Administrator accounts are system protected'
                            : 'Toggle between Analyst & Admin'
                        }
                      >
                        {updatingId === u.id
                          ? 'Updating...'
                          : isSuperAdminUser
                          ? 'Protected Role'
                          : `Switch to ${isAdminUser ? 'Analyst' : 'Admin'}`}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
