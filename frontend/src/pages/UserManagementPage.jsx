import { useEffect, useState } from 'react';
import { usersAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, UserCheck, Mail, Activity, RefreshCw, X } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [toast, setToast] = useState(null);
  const { user: currentUser } = useAuth();

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
    fetchUsers();
  }, []);

  const handleRoleToggle = user => {
    const admin = user.roles?.some(r => r.includes('ADMIN'));
    setConfirmUser({ user, role: admin ? 'ANALYST' : 'ADMIN' });
  };

  const confirmRoleChange = async () => {
    if (!confirmUser) return;

    const { user, role } = confirmUser;
    setConfirmUser(null);
    setUpdatingId(user.id);

    try {
      await usersAPI.updateRole(user.id, role);
      setToast({
        type: 'success',
        message: `@${user.username}'s role was changed to ${role}.`
      });
      await fetchUsers();
    } catch (err) {
      console.error('Failed to update user role:', err);
      setToast({
        type: 'error',
        message: `Failed to change @${user.username}'s role.`
      });
    } finally {
      setUpdatingId(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page-container">

      {confirmUser && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: 420, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Confirm Role Change</h3>
              <button
                onClick={() => setConfirmUser(null)}
                style={{ background: 'none', border: 0, color: '#94a3b8', cursor: 'pointer' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ marginTop: 16, color: '#94a3b8' }}>
              Are you sure you want to change{' '}
              <strong style={{ color: '#f8fafc' }}>@{confirmUser.user.username}</strong>{' '}
              to <strong style={{ color: '#60a5fa' }}>{confirmUser.role}</strong>?
            </p>

            <div style={{
              display: 'flex', justifyContent: 'flex-end',
              gap: 10, marginTop: 20
            }}>
              <button className="btn btn-secondary" onClick={() => setConfirmUser(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirmRoleChange}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1100,
          padding: '12px 18px', borderRadius: 6,
          backgroundColor: toast.type === 'success' ? '#16a34a' : '#dc2626',
          color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,.25)'
        }}>
          {toast.message}
        </div>
      )}

      <div className="page-header" style={{
        marginBottom: 'var(--space-6)', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h1>Admin User Management</h1>
          <p>Manage SOC analyst accounts, assign role permissions, and review active analyst workloads</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchUsers} title="Refresh User List">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <Stat title="Total Registered Users" value={users.length} icon={<Users size={20} />} />
        <Stat
          title="Active Analysts"
          value={users.filter(u => u.roles?.includes('ROLE_ANALYST')).length}
          icon={<UserCheck size={20} />}
        />
        <Stat
          title="System Administrators"
          value={users.filter(u => u.roles?.some(r => r.includes('ADMIN'))).length}
          icon={<Shield size={20} />}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'rgba(15,23,42,.6)'
            }}>
              {['Analyst', 'Role', 'Email', 'Workload (Active / Total)', 'Actions'].map((h, i) => (
                <th key={h} style={{
                  padding: 16, fontSize: 12, color: '#94a3b8',
                  textTransform: 'uppercase',
                  textAlign: i === 4 ? 'right' : 'left'
                }}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                  No users found or connection error. Click "Refresh" above to reload.
                </td>
              </tr>
            ) : users.map(u => {
              const admin = u.roles?.some(r => r.includes('ADMIN'));
              const self = currentUser?.username === u.username;
              const roleLabel = admin ? 'Analyst' : 'Admin';
              return (
                <tr key={u.id} style={{
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'background-color .2s ease'
                }}>
                  <td style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        backgroundColor: admin ? 'rgba(239,68,68,.2)' : 'rgba(59,130,246,.2)',
                        color: admin ? '#ef4444' : '#3b82f6',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 700, fontSize: 14
                      }}>
                        {(u.fullName || u.username).charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div style={{
                          fontWeight: 600, color: '#f8fafc', fontSize: 14
                        }}>
                          {u.fullName || u.username}
                          {self && (
                            <span style={{
                              fontSize: 10, background: '#3b82f6', color: '#fff',
                              padding: '2px 6px', borderRadius: 4, marginLeft: 6
                            }}>YOU</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          @{u.username}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: 16 }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 9999,
                      fontSize: 11, fontWeight: 700,
                      backgroundColor: admin ? 'rgba(239,68,68,.15)' : 'rgba(59,130,246,.15)',
                      color: admin ? '#ef4444' : '#60a5fa',
                      border: `1px solid ${admin ? 'rgba(239,68,68,.3)' : 'rgba(59,130,246,.3)'}`
                    }}>
                      {admin ? 'ADMINISTRATOR' : 'SOC ANALYST'}
                    </span>
                  </td>

                  <td style={{ padding: 16, fontSize: 13, color: '#cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={14} style={{ color: '#64748b' }} />
                      {u.email || 'N/A'}
                    </div>
                  </td>

                  <td style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Activity size={14} style={{
                        color: u.activeAssigned > 0 ? '#f97316' : '#10b981'
                      }} />
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: u.activeAssigned > 0 ? '#f97316' : '#f8fafc'
                      }}>
                        {u.activeAssigned || 0} Active
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        ({u.totalAssigned || 0} Total)
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: 16, textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRoleToggle(u)}
                      disabled={updatingId === u.id || self}
                      title={self ? 'Cannot change own role' : 'Toggle between Analyst & Admin'}
                    >
                      {updatingId === u.id
                      ? 'Updating...'
                      : `Switch to ${roleLabel}`}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ title, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-card-title">{title}</div>
        <div className="stat-card-icon">{icon}</div>
      </div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}
