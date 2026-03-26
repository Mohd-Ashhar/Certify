import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Input, Select, Button } from '../../components/ui/FormElements';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { ROLES, ROLE_LABELS, REGIONS, hasPermission, PERMISSIONS, getCreatableRoles } from '../../utils/roles';
import { supabase } from '../../lib/supabase';
import { UserPlus, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import './AdminUsers.css';

export default function AdminUsers() {
  const { user } = useAuth();
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdUsers, setCreatedUsers] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setFetchingUsers(true);
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setCreatedUsers(data);
      setFetchingUsers(false);
    };
    fetchUsers();
  }, []);

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
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', editingUser.id)
        .select();

      if (updateError) throw updateError;

      if (data) {
        setSuccess(`Updated role for ${editingUser.full_name} to ${ROLE_LABELS[newRole]}`);
        setCreatedUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, role: newRole } : u));
        setShowEditModal(false);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
    setLoading(false);
  };

  const columns = [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (val) => <StatusBadge status={val} label={ROLE_LABELS[val] || val} /> },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'created_at', label: 'Joined', render: (val) => new Date(val).toLocaleDateString() },
    {
      key: 'actions', label: 'Action', render: (_, userRow) => (
        <Button size="sm" variant="ghost" onClick={() => {
          setEditingUser(userRow);
          setNewRole(userRow.role);
          setShowEditModal(true);
        }}>
          Edit Role
        </Button>
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
        <Button variant="primary" size="md" onClick={() => alert('To add users, have them register via the Sign Up page first, then update their role here.')}>
          <UserPlus size={18} /> Invite User
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
          data={createdUsers}
          emptyMessage="No users found."
        />
      )}

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
            Updating role for <strong>{editingUser?.full_name}</strong> ({editingUser?.email})
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
