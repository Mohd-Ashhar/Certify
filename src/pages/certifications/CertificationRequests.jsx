import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { Button, Select } from '../../components/ui/FormElements';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '../../utils/roles';
import { Plus, Search, CheckCircle } from 'lucide-react';
import './CertificationRequests.css';

export default function CertificationRequests() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requests, setRequests] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      setFetching(true);
      const { data } = await supabase
        .from('applications')
        .select('*, profiles(email), auditor:profiles!assigned_auditor_id(full_name), cb:certification_bodies!assigned_cb_id(name)')
        .order('created_at', { ascending: false });
      if (data) {
        const flattened = data.map(app => ({
          ...app,
          client_email: app.profiles?.email || '—',
          auditor_name: app.auditor?.full_name || 'Unassigned',
          cb_name: app.cb?.name || 'Unassigned'
        }));
        setRequests(flattened);
      }
      setFetching(false);
    };
    fetchRequests();
  }, [user]);

  if (!user || loading) return <div className="page-container"><p>Loading dashboard...</p></div>;

  const canManage = hasPermission(user?.role, PERMISSIONS.MANAGE_CERTIFICATIONS);

  const filtered = requests.filter(r => {
    const matchesSearch =
      (r.company_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (r.client_email?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: 'company_name', label: 'Company' },
    { key: 'recommended_iso', label: 'Certificate' },
    { key: 'auditor_name', label: 'Assigned Auditor' },
    { key: 'cb_name', label: 'Assigned CB' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { 
      key: 'actions', 
      label: 'Action', 
      render: (_, row) => (
        <Button size="sm" onClick={() => navigate(`/admin/applications/${row.id}`)}>
          Manage
        </Button>
      ) 
    },
  ];

  return (
    <div className="page-container">
      {toast && (
        <div className="cert-request__toast">
          <CheckCircle size={16} />
          <span>{toast}</span>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Certification Requests</h1>
          <p className="page-subtitle">{filtered.length} requests found</p>
        </div>
      </div>

      <div className="cert-request__filters">
        <div className="companies__search">
          <Search size={16} className="companies__search-icon" />
          <input
            type="text"
            placeholder="Search by company or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="companies__search-input"
          />
        </div>
        <Select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="awaiting_payment">Awaiting Payment</option>
          <option value="audit_scheduled">Audit Scheduled</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {fetching ? (
        <p>Loading certification requests...</p>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No certification requests found"
        />
      )}
    </div>
  );
}
