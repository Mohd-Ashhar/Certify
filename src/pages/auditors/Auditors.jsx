import { useState, useEffect } from 'react';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { Button, Input } from '../../components/ui/FormElements';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '../../utils/roles';
import { Plus, Search } from 'lucide-react';

export default function Auditors() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState('');
  const [auditors, setAuditors] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [certificationBodies, setCertificationBodies] = useState([]);
  const [showCBModal, setShowCBModal] = useState(false);
  const [editingAuditor, setEditingAuditor] = useState(null);
  const [selectedCbId, setSelectedCbId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchAuditors = async () => {
    setFetching(true);
    const { data } = await supabase
      .from('profiles')
      .select('*, cb:certification_bodies!cb_id(name)')
      .eq('role', 'auditor')
      .order('created_at', { ascending: false });
    if (data) {
      const flattened = data.map(item => ({
        ...item,
        cb_name: item.cb?.name || 'Independent/Unassigned'
      }));
      setAuditors(flattened);
    }
    setFetching(false);
  };

  const fetchCBs = async () => {
    const { data } = await supabase.from('certification_bodies').select('id, name').order('name');
    if (data) setCertificationBodies(data);
  };

  useEffect(() => {
    if (!user) return;
    fetchAuditors();
    fetchCBs();
  }, [user]);

  if (!user || loading) return <div className="page-container"><p>Loading dashboard...</p></div>;

  const canManage = hasPermission(user?.role, PERMISSIONS.MANAGE_AUDITORS);

  const handleAssignCB = async (e) => {
    e.preventDefault();
    setAssigning(true);
    const { error } = await supabase
      .from('profiles')
      .update({ cb_id: selectedCbId || null })
      .eq('id', editingAuditor.id);
      
    if (error) {
       console.error('Update error:', error);
       alert('Failed to assign CB: ' + error.message);
    } else {
       await fetchAuditors();
       setShowCBModal(false);
    }
    setAssigning(false);
  };

  const filtered = auditors.filter(a => {
    const matchesSearch = (a.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
                          (a.email?.toLowerCase() || '').includes(search.toLowerCase());
    return matchesSearch;
  });

  const columns = [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'cb_name', label: 'Assigned CB' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    {
      key: 'actions', label: 'Action', render: (_, row) => (
        <Button size="sm" variant="ghost" onClick={() => {
          setEditingAuditor(row);
          setSelectedCbId(row.cb_id || '');
          setShowCBModal(true);
        }}>
          Assign CB
        </Button>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Auditors</h1>
          <p className="page-subtitle">{filtered.length} auditors registered</p>
        </div>
        {canManage && (
          <Button variant="primary" size="md" onClick={() => alert('To add auditors, have them register via the Sign Up page first, then update their role to Auditor in User Management.')}>
            <Plus size={16} /> Invite Auditor
          </Button>
        )}
      </div>

      <div className="companies__filters" style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
        <div className="companies__search">
          <Search size={16} className="companies__search-icon" />
          <input
            type="text"
            placeholder="Search auditors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="companies__search-input"
          />
        </div>
      </div>

      {fetching ? (
        <p>Loading auditors...</p>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No auditors found"
        />
      )}

      {/* Assign CB Modal */}
      <Modal isOpen={showCBModal} onClose={() => setShowCBModal(false)} title="Assign Certification Body">
        <form onSubmit={handleAssignCB} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Assigning CB to <strong>{editingAuditor?.full_name}</strong>
          </p>
          <Select
            label="Certification Body"
            id="assign-cb-select"
            value={selectedCbId}
            onChange={(e) => setSelectedCbId(e.target.value)}
          >
            <option value="">Unassigned (Independent)</option>
            {certificationBodies.map(cb => (
              <option key={cb.id} value={cb.id}>{cb.name}</option>
            ))}
          </Select>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button type="button" variant="ghost" onClick={() => setShowCBModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={assigning}>Assign CB</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
