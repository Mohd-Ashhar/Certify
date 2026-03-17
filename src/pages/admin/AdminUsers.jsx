import { useState } from 'react';
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
  const [showModal, setShowModal] = useState(false);
  const allowedRoles = getCreatableRoles(user?.role);
  const isRegionalAdmin = user?.role === ROLES.REGIONAL_ADMIN;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    region: isRegionalAdmin ? (user?.region || '') : '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdUsers, setCreatedUsers] = useState([]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      email: '', 
      role: '', 
      region: isRegionalAdmin ? (user?.region || '') : '', 
      password: '' 
    });
    setError('');
    setSuccess('');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.email || !formData.role || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!allowedRoles.includes(formData.role)) {
      setError('You do not have permission to create this role');
      return;
    }

    setLoading(true);

    try {
      // Use Supabase Auth admin API via service role or signUp endpoint
      // Since we're using the anon key, we use signUp (user won't be auto-logged-in
      // because we're creating for someone else)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
            region: formData.region || null,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Track the created user locally
      const newUser = {
        id: data.user?.id || Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        region: formData.region || '—',
        created_at: new Date().toISOString(),
      };
      setCreatedUsers(prev => [newUser, ...prev]);
      setSuccess(`User "${formData.name}" (${ROLE_LABELS[formData.role]}) created successfully`);
      resetForm();
    } catch (err) {
      setError(err.message || 'An error occurred');
    }

    setLoading(false);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role', label: 'Role',
      render: (val) => <StatusBadge status={val} label={ROLE_LABELS[val] || val} />
    },
    { key: 'region', label: 'Region', render: (val) => val || '—' },
    {
      key: 'created_at', label: 'Created',
      render: (val) => new Date(val).toLocaleDateString()
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Create and manage platform users</p>
        </div>
        <Button variant="primary" size="md" onClick={() => { resetForm(); setShowModal(true); }}>
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

      {/* Recently Created Users */}
      <DataTable
        columns={columns}
        data={createdUsers}
        emptyMessage="No users created in this session. Click 'Create User' to add new users."
      />

      {/* Create User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
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
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input
            label="Email *"
            type="email"
            id="create-user-email"
            name="email"
            placeholder="user@certifycx.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Select
            label="Role *"
            id="create-user-role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="">Select a role</option>
            {allowedRoles.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </Select>

          <Select
            label={`Region ${isRegionalAdmin ? '(Locked to your region)' : ''}`}
            id="create-user-region"
            name="region"
            value={formData.region}
            onChange={handleChange}
            disabled={isRegionalAdmin}
          >
            <option value="">No specific region</option>
            {REGIONS.map(r => (
              <option key={r.id} value={r.id}>{r.emoji} {r.label}</option>
            ))}
          </Select>

          <Input
            label="Password *"
            type="password"
            id="create-user-password"
            name="password"
            placeholder="Min 6 characters"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="admin-users__form-actions">
            <Button type="button" variant="ghost" size="md" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
