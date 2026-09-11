import { useEffect, useState } from 'react';
import { usersAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Shield,
  UserCheck,
  Mail,
  Activity,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Confirmation modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  // Toast state
  const [toast, setToast] = useState(null);

  const { user: currentUser } = useAuth();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      showToast('Failed to fetch users. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const res = await usersAPI.getAll();

        if (isMounted) {
          setUsers(res.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);

        if (isMounted) {
          showToast('Failed to fetch users. Please try again.', 'error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Opens the confirmation modal instead of immediately changing the role
  const handleRoleToggle = (targetUser) => {
    const isCurrentlyAdmin = targetUser.roles?.some(r =>
      r.includes('ADMIN')
    );

    const newRole = isCurrentlyAdmin ? 'ANALYST' : 'ADMIN';

    setSelectedUser(targetUser);
    setSelectedRole(newRole);
  };

  // Closes the confirmation modal
  const handleCancelRoleChange = () => {
    setSelectedUser(null);
    setSelectedRole(null);
  };

  // Performs the actual role change after confirmation
  const confirmRoleChange = async () => {
    if (!selectedUser || !selectedRole) {
      return;
    }

    const targetUser = selectedUser;
    const newRole = selectedRole;

    setUpdatingId(targetUser.id);

    // Close the modal before making the request
    setSelectedUser(null);
    setSelectedRole(null);

    try {
      await usersAPI.updateRole(targetUser.id, newRole);

      await fetchUsers();

      showToast(
        `@${targetUser.username}'s role was changed to ${newRole}.`,
        'success'
      );
    } catch (err) {
      console.error('Failed to update user role:', err);

      showToast(
        `Failed to change @${targetUser.username}'s role. Please try again.`,
        'error'
      );
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
      {/* Toast Notification */}
      {toast && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 1000,
            minWidth: '300px',
            maxWidth: '420px',
            padding: '14px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor:
              toast.type === 'success'
                ? 'rgba(16, 185, 129, 0.95)'
                : 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span style={{ flex: 1 }}>{toast.message}</span>

          <button
            onClick={() => setToast(null)}
            aria-label="Close notification"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div
        className="page-header"
        style={{
          marginBottom: 'var(--space-6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h1>Admin User Management</h1>
          <p>
            Manage SOC analyst accounts, assign role permissions, and review
            active analyst workloads
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchUsers}
          title="Refresh User List"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* User Stats Grid */}
      <div
        className="stats-grid"
        style={{ marginBottom: 'var(--space-6)' }}
      >
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">
              Total Registered Users
            </div>

            <div
              className="stat-card-icon"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6'
              }}
            >
              <Users size={20} />
            </div>
          </div>

          <div className="stat-card-value">{users.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">Active Analysts</div>

            <div
              className="stat-card-icon"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981'
              }}
            >
              <UserCheck size={20} />
            </div>
          </div>

          <div className="stat-card-value">
            {users.filter(u =>
              u.roles?.includes('ROLE_ANALYST')
            ).length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-title">
              System Administrators
            </div>

            <div
              className="stat-card-icon"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444'
              }}
            >
              <Shield size={20} />
            </div>
          </div>

          <div className="stat-card-value">
            {users.filter(u =>
              u.roles?.some(r => r.includes('ADMIN'))
            ).length}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div
        className="card"
        style={{ padding: 0, overflow: 'hidden' }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left'
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'rgba(15, 23, 42, 0.6)'
              }}
            >
              <th
                style={{
                  padding: '16px',
                  fontSize: '12px',
                  color: '#94a3b8',
                  textTransform: 'uppercase'
                }}
              >
                Analyst
              </th>

              <th
                style={{
                  padding: '16px',
                  fontSize: '12px',
                  color: '#94a3b8',
                  textTransform: 'uppercase'
                }}
              >
                Role
              </th>

              <th
                style={{
                  padding: '16px',
                  fontSize: '12px',
                  color: '#94a3b8',
                  textTransform: 'uppercase'
                }}
              >
                Email
              </th>

              <th
                style={{
                  padding: '16px',
                  fontSize: '12px',
                  color: '#94a3b8',
                  textTransform: 'uppercase'
                }}
              >
                Workload (Active / Total)
              </th>

              <th
                style={{
                  padding: '16px',
                  fontSize: '12px',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  textAlign: 'right'
                }}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '32px',
                    textAlign: 'center',
                    color: '#94a3b8'
                  }}
                >
                  No users found or connection error. Click "Refresh" above
                  to reload.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isAdminUser = u.roles?.some(r =>
                  r.includes('ADMIN')
                );

                const isSelf =
                  currentUser?.username === u.username;

                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom:
                        '1px solid var(--color-border)',
                      transition:
                        'background-color 0.2s ease'
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: isAdminUser
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(59, 130, 246, 0.2)',
                            color: isAdminUser
                              ? '#ef4444'
                              : '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '14px'
                          }}
                        >
                          {(u.fullName || u.username)
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: '#f8fafc',
                              fontSize: '14px'
                            }}
                          >
                            {u.fullName || u.username}

                            {isSelf && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  background: '#3b82f6',
                                  color: '#fff',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  marginLeft: '6px'
                                }}
                              >
                                YOU
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              fontSize: '12px',
                              color: '#64748b'
                            }}
                          >
                            @{u.username}
                          </div>
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
                          backgroundColor: isAdminUser
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                          color: isAdminUser
                            ? '#ef4444'
                            : '#60a5fa',
                          border: isAdminUser
                            ? '1px solid rgba(239, 68, 68, 0.3)'
                            : '1px solid rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        {isAdminUser
                          ? 'ADMINISTRATOR'
                          : 'SOC ANALYST'}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        fontSize: '13px',
                        color: '#cbd5e1'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Mail
                          size={14}
                          style={{ color: '#64748b' }}
                        />

                        {u.email || 'N/A'}
                      </div>
                    </td>

                    <td style={{ padding: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Activity
                          size={14}
                          style={{
                            color:
                              u.activeAssigned > 0
                                ? '#f97316'
                                : '#10b981'
                          }}
                        />

                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color:
                              u.activeAssigned > 0
                                ? '#f97316'
                                : '#f8fafc'
                          }}
                        >
                          {u.activeAssigned || 0} Active
                        </span>

                        <span
                          style={{
                            fontSize: '12px',
                            color: '#64748b'
                          }}
                        >
                          ({u.totalAssigned || 0} Total)
                        </span>
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '16px',
                        textAlign: 'right'
                      }}
                    >
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRoleToggle(u)}
                        disabled={
                          updatingId === u.id || isSelf
                        }
                        title={
                          isSelf
                            ? 'Cannot change own role'
                            : 'Toggle between Analyst & Admin'
                        }
                      >
                        {updatingId === u.id
                          ? 'Updating...'
                          : `Switch to ${
                              isAdminUser
                                ? 'Analyst'
                                : 'Admin'
                            }`}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {selectedUser && selectedRole && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-change-title"
          onClick={handleCancelRoleChange}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            padding: '20px'
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#0f172a',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}
            >
              <div>
                <h2
                  id="role-change-title"
                  style={{
                    margin: 0,
                    color: '#f8fafc',
                    fontSize: '20px'
                  }}
                >
                  Confirm Role Change
                </h2>
              </div>

              <button
                onClick={handleCancelRoleChange}
                aria-label="Close confirmation dialog"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p
              style={{
                margin: '0 0 24px',
                color: '#cbd5e1',
                lineHeight: 1.6,
                fontSize: '14px'
              }}
            >
              Are you sure you want to change{' '}
              <strong style={{ color: '#f8fafc' }}>
                @{selectedUser.username}
              </strong>
              's role to{' '}
              <strong style={{ color: '#60a5fa' }}>
                {selectedRole}
              </strong>
              ?
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={handleCancelRoleChange}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={confirmRoleChange}
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
