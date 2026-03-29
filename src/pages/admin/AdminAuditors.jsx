import { useState, useEffect } from 'react';
import { Select } from '../../components/ui/FormElements';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { ROLES, ROLE_LABELS, REGIONS } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AdminAuditors() {
  const { user } = useAuth();
  const isRegionalAdmin = user?.role === ROLES.REGIONAL_ADMIN;

  const [auditors, setAuditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState(isRegionalAdmin ? (user.region || '') : '');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from('profiles').select('*').eq('role', ROLES.AUDITOR);
      if (isRegionalAdmin && user.region) query = query.eq('region', user.region);
      const { data } = await query.order('created_at', { ascending: false });
      if (data) setAuditors(data);
      setLoading(false);
    };
    fetch();
  }, [user, isRegionalAdmin]);

  const filtered = regionFilter && !isRegionalAdmin
    ? auditors.filter(a => a.region === regionFilter)
    : auditors;

  const columns = [
    { key: 'full_name', label: 'Name', render: (val) => val || '—' },
    { key: 'email', label: 'Email' },
    { key: 'region', label: 'Region', render: (val) => {
      if (!val) return '—';
      const r = REGIONS.find(reg => reg.id === val);
      return r ? r.label : val;
    }},
    { key: 'role', label: 'Role', render: (val) => <StatusBadge status={val} label={ROLE_LABELS[val] || val} /> },
    { key: 'created_at', label: 'Joined', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Auditors</h1>
          <p className="page-subtitle">{filtered.length} auditor{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
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

      {loading ? (
        <p>Loading auditors...</p>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No auditors found."
        />
      )}
    </div>
  );
}
