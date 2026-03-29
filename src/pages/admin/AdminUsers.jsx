import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Input, Select, Button } from '../../components/ui/FormElements';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { ROLES, ROLE_LABELS, REGIONS, hasPermission, PERMISSIONS, getCreatableRoles } from '../../utils/roles';
import { supabase } from '../../lib/supabase';
import { UserPlus, AlertCircle, CheckCircle, Shield, Trash2 } from 'lucide-react';
import './AdminUsers.css';

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Edit Role modal
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Delete User modal
  const [deletingUser, setDeletingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Create User modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: '',
    region: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const allowedRoles = getCreatableRoles(user?.role);
  const isRegionalAdmin = user?.role === ROLES.REGIONAL_ADMIN;

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    let query = supabase.from('profiles').select('*');
    // Regional Admin: only see users in their region
    if (isRegionalAdmin && user?.region) {
      query = query.eq('region', user.region);
    }
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setUsers(data);
    setFetchingUsers(false);
  };

  // --- Create User ---
  const handleCreateChange = (e) => {
    setCreateForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { full_name, email, password, role, region } = createForm;

    if (!full_name || !email || !password || !role) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!allowedRoles.includes(role)) {
      setError('You do not have permission to create this role');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name, role, region }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess(`Successfully created ${ROLE_LABELS[role]}: ${full_name}`);
      setShowCreateModal(false);
      setCreateForm({ full_name: '', email: '', password: '', role: '', region: '' });
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  // --- Edit Role ---
  const handleUpdateRole = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!allowedRoles.includes(newRole)) {
      setError('You do not have permission to assign this role');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/update-user-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editingUser.id, newRole }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update role');

      setSuccess(`Updated role for ${editingUser.full_name || editingUser.email} to ${ROLE_LABELS[newRole]}`);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, role: newRole } : u));
      setShowEditModal(false);
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
    setLoading(false);
  };

  // --- Delete User ---
  const handleDeleteUser = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deletingUser.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccess(`Successfully deleted user: ${deletingUser.full_name || deletingUser.email}`);
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      setShowDeleteModal(false);
      setDeletingUser(null);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  const columns = [
    { key: 'full_name', label: 'Name', render: (val) => val || '—' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'System Role', render: (val) => <StatusBadge status={val} label={ROLE_LABELS[val] || val} /> },
    { key: 'region', label: 'Region', render: (val) => {
      if (!val) return '—';
      const r = REGIONS.find(reg => reg.id === val);
      return r ? r.label : val;
    }},
    { key: 'created_at', label: 'Joined', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
    {
      key: 'actions', label: 'Action', render: (_, userRow) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button size="sm" variant="ghost" onClick={() => {
            setEditingUser(userRow);
            setNewRole(userRow.role);
            setError('');
            setShowEditModal(true);
          }}>
            Edit Role
          </Button>
          {userRow.id !== user?.id && (
            <Button size="sm" variant="ghost" onClick={() => {
              setDeletingUser(userRow);
              setError('');
              setShowDeleteModal(true);
            }} style={{ color: 'var(--color-danger, #ef4444)' }}>
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Create and manage platform users</p>
        </div>
        <Button variant="primary" size="md" onClick={() => {
          setError('');
          setCreateForm({ full_name: '', email: '', password: '', role: '', region: '' });
          setShowCreateModal(true);
        }}>
          <UserPlus size={18} /> Create User
        </Button>
      </div>

      {/* Role Info Banner */}
      <div className="admin-users__info">
        <Shield size={18} />
        <span>
          You can create: {allowedRoles.map(r => ROLE_LABELS[r]).join(', ')}
        </span>
      </div>

      {success && (
        <div className="admin-users__success">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Users Table */}
      {fetchingUsers ? (
        <p>Loading users...</p>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          emptyMessage="No users found."
        />
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="admin-users__form">
          {error && (
            <div className="auth-form__error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Full Name *"
            id="create-user-name"
            name="full_name"
            placeholder="Enter full name"
            value={createForm.full_name}
            onChange={handleCreateChange}
            required
          />

          <Input
            label="Email *"
            type="email"
            id="create-user-email"
            name="email"
            placeholder="user@example.com"
            value={createForm.email}
            onChange={handleCreateChange}
            required
          />

          <Input
            label="Password *"
            type="password"
            id="create-user-password"
            name="password"
            placeholder="Min 6 characters"
            value={createForm.password}
            onChange={handleCreateChange}
            required
          />

          <Select
            label="Role *"
            id="create-user-role"
            name="role"
            value={createForm.role}
            onChange={handleCreateChange}
            required
          >
            <option value="">Select a role</option>
            {allowedRoles.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </Select>

          <Select
            label="Region"
            id="create-user-region"
            name="region"
            value={createForm.region}
            onChange={handleCreateChange}
          >
            <option value="">Select a region (optional)</option>
            {REGIONS.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </Select>

          <div className="admin-users__form-actions">
            <Button type="button" variant="ghost" size="md" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
      >
        <div className="admin-users__form">
          {error && (
            <div className="auth-form__error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <p style={{ color: 'var(--color-text-secondary)' }}>
            Are you sure you want to permanently delete <strong>{deletingUser?.full_name || deletingUser?.email}</strong>?
          </p>
          <p style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.85rem', marginTop: '8px' }}>
            This action cannot be undone. The user's account and profile will be permanently removed.
          </p>

          <div className="admin-users__form-actions" style={{ marginTop: '16px' }}>
            <Button type="button" variant="ghost" size="md" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={loading}
              onClick={handleDeleteUser}
              style={{ background: 'var(--color-danger, #ef4444)' }}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User Role"
      >
        <form onSubmit={handleUpdateRole} className="admin-users__form">
          {error && (
            <div className="auth-form__error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
            Updating role for <strong>{editingUser?.full_name || editingUser?.email}</strong> ({editingUser?.email})
          </p>

          <Select
            label="New Role *"
            id="update-user-role"
            name="role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            required
          >
            <option value="">Select a role</option>
            {allowedRoles.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </Select>

          <div className="admin-users__form-actions">
            <Button type="button" variant="ghost" size="md" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Update Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
