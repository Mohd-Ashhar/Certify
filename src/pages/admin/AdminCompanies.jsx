import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button } from '../../components/ui/FormElements';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import { ROLES, ROLE_LABELS, REGIONS } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { UserPlus, AlertCircle, CheckCircle, Pencil } from 'lucide-react';

export default function AdminCompanies() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const isRegionalAdmin = user?.role === ROLES.REGIONAL_ADMIN;

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState(isRegionalAdmin ? (user.region || '') : '');

  // Create Client modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', password: '', company_name: '', region: '' });

  // Edit Client modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', company_name: '', region: '' });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, [user, isRegionalAdmin]);

  const fetchCompanies = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*').eq('role', ROLES.CLIENT);
    if (isRegionalAdmin && user.region) query = query.eq('region', user.region);
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setCompanies(data);
    setLoading(false);
  };

  const filtered = regionFilter && !isRegionalAdmin
    ? companies.filter(c => c.region === regionFilter)
    : companies;

  // --- Create Client ---
  const handleCreateClient = async (e) => {
    e.preventDefault();
    setError('');
    const { full_name, email, password, company_name, region } = createForm;

    if (!full_name || !email || !password || !company_name) {
      setError(t('admin.fillRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('admin.passwordMinLength'));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name, role: 'client', region, company_name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create client');

      setSuccess(`${t('admin.clientCreated')} ${company_name}`);
      setShowCreateModal(false);
      setCreateForm({ full_name: '', email: '', password: '', company_name: '', region: '' });
      fetchCompanies();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  // --- Edit Client ---
  const openEditModal = (client) => {
    setEditingClient(client);
    setEditForm({
      full_name: client.full_name || '',
      email: client.email || '',
      company_name: client.company_name || '',
      region: client.region || '',
    });
    setError('');
    setShowEditModal(true);
  };

  const handleEditClient = async (e) => {
    e.preventDefault();
    setError('');
    if (!editForm.full_name || !editForm.email || !editForm.company_name) {
      setError(t('admin.namesRequired'));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-profile',
          userId: editingClient.id,
          full_name: editForm.full_name,
          email: editForm.email,
          company_name: editForm.company_name,
          region: editForm.region || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update client');

      setSuccess(`${t('admin.clientUpdated')} ${editForm.company_name}`);
      setShowEditModal(false);
      setCompanies(prev => prev.map(c =>
        c.id === editingClient.id ? { ...c, ...editForm } : c
      ));
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const columns = [
    { key: 'company_name', label: t('admin.companyName'), render: (val) => val || '—' },
    { key: 'full_name', label: t('admin.contactPerson'), render: (val) => val || '—' },
    { key: 'email', label: t('auth.email') },
    { key: 'region', label: t('admin.region'), render: (val) => {
      if (!val) return '—';
      const r = REGIONS.find(reg => reg.id === val);
      return r ? r.label : val;
    }},
    { key: 'created_at', label: t('admin.joined'), render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
    ...(isSuperAdmin ? [{
      key: 'actions', label: t('dashboard.action'), render: (_, row) => (
        <Button size="sm" variant="ghost" onClick={() => openEditModal(row)}>
          <Pencil size={14} /> {t('common.edit')}
        </Button>
      )
    }] : []),
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('admin.companiesTitle')}</h1>
          <p className="page-subtitle">{t('admin.companiesFound', { count: filtered.length })}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!isRegionalAdmin && (
            <Select
              id="filter-region"
              name="region"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="">{t('common.allRegions')}</option>
              {REGIONS.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </Select>
          )}
          {isSuperAdmin && (
            <Button variant="primary" size="md" onClick={() => {
              setError('');
              setCreateForm({ full_name: '', email: '', password: '', company_name: '', region: '' });
              setShowCreateModal(true);
            }}>
              <UserPlus size={18} /> {t('admin.addClient')}
            </Button>
          )}
        </div>
      </div>

      {success && (
        <div className="admin-users__success">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <p>{t('admin.loadingCompanies')}</p>
      ) : (
        <DataTable columns={columns} data={filtered} emptyMessage={t('admin.noCompaniesFound')} />
      )}

      {/* Create Client Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={t('admin.addNewClient')}>
        <form onSubmit={handleCreateClient} className="admin-users__form">
          {error && (
            <div className="auth-form__error"><AlertCircle size={16} /><span>{error}</span></div>
          )}
          <Input label="Company Name *" id="create-client-company" name="company_name"
            placeholder="Company name" value={createForm.company_name}
            onChange={(e) => setCreateForm(p => ({ ...p, company_name: e.target.value }))} required />
          <Input label="Contact Person Name *" id="create-client-name" name="full_name"
            placeholder="Full name" value={createForm.full_name}
            onChange={(e) => setCreateForm(p => ({ ...p, full_name: e.target.value }))} required />
          <Input label="Email *" type="email" id="create-client-email" name="email"
            placeholder="client@company.com" value={createForm.email}
            onChange={(e) => setCreateForm(p => ({ ...p, email: e.target.value }))} required />
          <Input label="Password *" type="password" id="create-client-password" name="password"
            placeholder="Min 6 characters" value={createForm.password}
            onChange={(e) => setCreateForm(p => ({ ...p, password: e.target.value }))} required />
          <Select label="Region" id="create-client-region" name="region"
            value={createForm.region}
            onChange={(e) => setCreateForm(p => ({ ...p, region: e.target.value }))}>
            <option value="">Select a region (optional)</option>
            {REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </Select>
          <div className="admin-users__form-actions">
            <Button type="button" variant="ghost" size="md" onClick={() => setShowCreateModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" size="md" loading={saving}>{t('admin.createClient')}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={t('admin.editClient')}>
        <form onSubmit={handleEditClient} className="admin-users__form">
          {error && (
            <div className="auth-form__error"><AlertCircle size={16} /><span>{error}</span></div>
          )}
          <Input label="Company Name *" id="edit-client-company" name="company_name"
            placeholder="Company name" value={editForm.company_name}
            onChange={(e) => setEditForm(p => ({ ...p, company_name: e.target.value }))} required />
          <Input label="Contact Person Name *" id="edit-client-name" name="full_name"
            placeholder="Full name" value={editForm.full_name}
            onChange={(e) => setEditForm(p => ({ ...p, full_name: e.target.value }))} required />
          <Input label="Email *" type="email" id="edit-client-email" name="email"
            placeholder="client@company.com" value={editForm.email}
            onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} required />
          <Select label="Region" id="edit-client-region" name="region"
            value={editForm.region}
            onChange={(e) => setEditForm(p => ({ ...p, region: e.target.value }))}>
            <option value="">Select a region</option>
            {REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </Select>
          <div className="admin-users__form-actions">
            <Button type="button" variant="ghost" size="md" onClick={() => setShowEditModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" size="md" loading={saving}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
