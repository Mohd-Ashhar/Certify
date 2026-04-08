import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { Button, Input } from '../../components/ui/FormElements';
import { supabase } from '../../lib/supabase';
import { REGIONS, ROLES } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '../../utils/roles';
import { Plus, Search } from 'lucide-react';

export default function CertificationBodies() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [search, setSearch] = useState('');
  const [bodies, setBodies] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', country: '', website: '' });
  const [adding, setAdding] = useState(false);

  if (!user || loading) return <div className="page-container"><p>{t('common.loadingDashboard')}</p></div>;

  const fetchBodies = async () => {
    setFetching(true);
    const { data } = await supabase.from('certification_bodies').select('*').order('created_at', { ascending: false });
    if (data) setBodies(data);
    setFetching(false);
  };

  useEffect(() => { fetchBodies(); }, []);

  const handleAddBody = async (e) => {
    e.preventDefault();
    setAdding(true);
    const newBody = {
      name: formData.name,
      country: formData.country,
      website: formData.website,
      status: 'active'
    };
    
    const { data, error } = await supabase.from('certification_bodies').insert([newBody]).select();
    
    if (error) {
      console.error('Insert error:', error);
      alert('Failed to add Certification Body: ' + error.message);
    } else if (data) {
      setBodies(prev => [data[0], ...prev]);
    }
    
    setAdding(false);
    setShowModal(false);
    setFormData({ name: '', country: '', website: '' });
  };

  const canManage = hasPermission(user?.role, PERMISSIONS.MANAGE_BODIES);

  const filtered = bodies.filter(b => {
    const matchesSearch = (b.name?.toLowerCase() || '').includes(search.toLowerCase());
    return matchesSearch;
  });

  const columns = [
    { key: 'name', label: t('admin.bodyName'), render: (val) => (
      <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{val || '—'}</span>
    )},
    { key: 'country', label: t('admin.country'), render: (val) => (
      <span style={{ fontWeight: 500, color: 'var(--color-info)' }}>{val || '—'}</span>
    )},
    { key: 'website', label: t('admin.website'), render: (val) => val || '—' },
    { key: 'status', label: t('dashboard.status'), render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('admin.certBodiesTitle')}</h1>
          <p className="page-subtitle">{t('admin.certBodiesFound', { count: filtered.length })}</p>
        </div>
        {canManage && (
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Body
          </Button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
        <div className="companies__search">
          <Search size={16} className="companies__search-icon" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="companies__search-input"
          />
        </div>
      </div>

      {fetching ? (
        <p>{t('admin.loadingCertBodies')}</p>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage={t('admin.noCertBodiesFound')}
        />
      )}

      {/* Create Body Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Certification Body">
        <form onSubmit={handleAddBody} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Body Name *" name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Country *" name="country" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} required />
          <Input label="Website" name="website" type="url" placeholder="https://..." value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" loading={adding}>Add Body</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
