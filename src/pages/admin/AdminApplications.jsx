import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Select, Button } from '../../components/ui/FormElements';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { ROLES, REGIONS } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AdminApplications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRegionalAdmin = user?.role === ROLES.REGIONAL_ADMIN;

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState(isRegionalAdmin ? (user.region || '') : '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('applications')
        .select('*, auditor:profiles!assigned_auditor_id(full_name), client:profiles!client_id(region)')
        .order('created_at', { ascending: false });

      if (data) {
        // Fetch CB names separately (assigned_cb_id FK points to certification_bodies, not profiles)
        const cbIds = [...new Set(data.map(a => a.assigned_cb_id).filter(Boolean))];
        let cbMap = {};
        if (cbIds.length > 0) {
          const { data: cbProfiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', cbIds);
          if (cbProfiles) cbMap = Object.fromEntries(cbProfiles.map(p => [p.id, p.full_name]));
        }
        setApplications(data.map(app => ({
          ...app,
          auditor_name: app.auditor?.full_name || 'Unassigned',
          cb_name: cbMap[app.assigned_cb_id] || 'Unassigned',
          region: app.client?.region || null,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  let filtered = applications;
  if (regionFilter) filtered = filtered.filter(a => a.region === regionFilter);
  if (statusFilter) filtered = filtered.filter(a => a.status === statusFilter);

  const columns = [
    { key: 'company_name', label: 'Company' },
    { key: 'recommended_iso', label: 'Certificate' },
    { key: 'auditor_name', label: 'Assigned Auditor' },
    { key: 'cb_name', label: 'Assigned CB' },
    { key: 'region', label: 'Region', render: (val) => {
      if (!val) return '—';
      const r = REGIONS.find(reg => reg.id === val);
      return r ? r.label : val;
    }},
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'action', label: 'Action', render: (_, row) => (
      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/applications/${row.id}`)}>Manage</Button>
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Applications</h1>
          <p className="page-subtitle">{filtered.length} application{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Select
            id="filter-status"
            name="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="awaiting_payment">Awaiting Payment</option>
            <option value="in_review">In Review</option>
            <option value="audit_scheduled">Audit Scheduled</option>
            <option value="audited">Audited</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
          {!isRegionalAdmin && (
            <Select
              id="filter-region"
              name="region"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              style={{ width: '200px' }}
            >
              <option value="">All Regions</option>
              {REGIONS.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {loading ? (
        <p>Loading applications...</p>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No applications found."
        />
      )}
    </div>
  );
}
