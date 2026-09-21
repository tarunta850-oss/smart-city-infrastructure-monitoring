import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Mail,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import Navbar from '../../components/shared/Navbar';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import api from '../../api';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users/');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    setModalError('');

    if (newOfficer.password.length < 6) {
      setModalError('Password must be at least 6 characters');
      return;
    }

    setCreating(true);
    try {
      await api.post('/users/officers', newOfficer);
      setShowCreateModal(false);
      setNewOfficer({ name: '', email: '', password: '' });
      fetchUsers();
      alert(`Officer account for ${newOfficer.name} (${newOfficer.email}) created successfully!`);
    } catch (err) {
      setModalError(err.response?.data?.detail || 'Failed to create officer account.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRole = async (userId, targetRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${targetRole.toUpperCase()}?`)) return;
    try {
      await api.patch(`/users/${userId}/role`, { role: targetRole });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  const stats = useMemo(() => {
    return {
      total: users.length,
      citizens: users.filter(u => u.role === 'citizen').length,
      officers: users.filter(u => u.role === 'officer').length,
      admins: users.filter(u => u.role === 'admin').length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role?.toLowerCase() !== roleFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = (u.name || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [users, roleFilter, searchQuery]);

  const getRoleVariant = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'danger';
      case 'officer': return 'warning';
      case 'citizen': return 'success';
      default: return 'neutral';
    }
  };

  return (
    <div className="min-h-screen bg-background admin-users-page">
      <Navbar />

      <main className="container py-lg">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-md mb-lg">
          <div>
            <h1 className="text-2xl font-bold mb-xs">User &amp; Officer Management</h1>
            <p className="text-muted text-sm">
              Control access, provision verified municipal officers, and manage user privileges.
            </p>
          </div>
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => setShowCreateModal(true)}
          >
            + Add New Officer
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="admin-user-stats-grid mb-lg">
          <div className="admin-user-stat-card">
            <div className="stat-icon-circ total">
              <Users size={22} />
            </div>
            <div>
              <p className="stat-label">Total Registered</p>
              <p className="stat-val">{stats.total}</p>
            </div>
          </div>

          <div className="admin-user-stat-card">
            <div className="stat-icon-circ citizens">
              <UserCheck size={22} />
            </div>
            <div>
              <p className="stat-label">Citizens</p>
              <p className="stat-val">{stats.citizens}</p>
            </div>
          </div>

          <div className="admin-user-stat-card">
            <div className="stat-icon-circ officers">
              <Shield size={22} />
            </div>
            <div>
              <p className="stat-label">Verified Officers</p>
              <p className="stat-val">{stats.officers}</p>
            </div>
          </div>

          <div className="admin-user-stat-card">
            <div className="stat-icon-circ admins">
              <Shield size={22} />
            </div>
            <div>
              <p className="stat-label">Administrators</p>
              <p className="stat-val">{stats.admins}</p>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="mb-lg">
          <div className="flex items-center justify-between flex-wrap gap-md">
            <div className="flex items-center gap-sm flex-1 min-w-[280px]">
              <Search size={18} className="text-muted" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="user-search-input"
              />
            </div>

            <div className="flex items-center gap-xs">
              <Filter size={16} className="text-muted" />
              <div className="role-filter-tabs">
                {['all', 'citizen', 'officer', 'admin'].map((r) => (
                  <button
                    key={r}
                    className={`role-tab-btn ${roleFilter === r ? 'active' : ''}`}
                    onClick={() => setRoleFilter(r)}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          {loading ? (
            <div className="text-center py-xl">
              <p className="text-muted">Loading user accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-xl">
              <p className="text-muted">No users found matching your filters.</p>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Role</th>
                    <th>Registered On</th>
                    <th>Permissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-sm">
                          <div className="user-table-avatar">
                            <UserIcon size={16} />
                          </div>
                          <div>
                            <span className="font-semibold block text-sm">{u.name || 'Anonymous User'}</span>
                            <span className="text-xs text-muted block">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={getRoleVariant(u.role)}>
                          {u.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-sm text-secondary">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-muted">
                          {u.role === 'admin' && 'Full System Control & Officer Provisioning'}
                          {u.role === 'officer' && 'Inspect, Start & Resolve Road Reports'}
                          {u.role === 'citizen' && 'Report Issues, Upvote & Verify Work'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-xs flex-wrap">
                          {u.role === 'citizen' && (
                            <button
                              className="role-action-btn promote"
                              onClick={() => handleUpdateRole(u.id, 'officer')}
                              title="Promote this citizen to verified Officer"
                            >
                              <ArrowUpRight size={13} /> Promote to Officer
                            </button>
                          )}
                          {u.role === 'officer' && (
                            <button
                              className="role-action-btn demote"
                              onClick={() => handleUpdateRole(u.id, 'citizen')}
                              title="Demote officer to standard Citizen"
                            >
                              <ArrowDownRight size={13} /> Demote to Citizen
                            </button>
                          )}
                          {u.role !== 'admin' && (
                            <button
                              className="role-action-btn delete"
                              onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                              title="Delete user account"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* Create Officer Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="create-officer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-modal-header">
              <div className="flex items-center gap-xs">
                <Shield size={20} className="text-primary" />
                <h3 className="modal-title">Provision Municipal Officer</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOfficer}>
              <div className="create-modal-body">
                <p className="text-xs text-muted mb-sm">
                  Create an official Municipal Officer account. They will be granted access to the Officer Dashboard to inspect and resolve assigned road repair complaints.
                </p>

                {modalError && (
                  <div className="modal-error-box">
                    {modalError}
                  </div>
                )}

                <div className="form-group mb-sm">
                  <label className="form-label text-xs">Officer Full Name</label>
                  <div className="input-with-icon">
                    <UserIcon size={16} className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Officer John Doe"
                      value={newOfficer.name}
                      onChange={(e) => setNewOfficer(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-sm">
                  <label className="form-label text-xs">Official Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. officer.road@city.gov"
                      value={newOfficer.email}
                      onChange={(e) => setNewOfficer(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-sm">
                  <label className="form-label text-xs">Initial Password</label>
                  <div className="input-with-icon">
                    <Lock size={16} className="input-icon" />
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Min. 6 characters"
                      value={newOfficer.password}
                      onChange={(e) => setNewOfficer(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="create-modal-footer">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={creating}>
                  {creating ? 'Provisioning...' : 'Provision Officer Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
