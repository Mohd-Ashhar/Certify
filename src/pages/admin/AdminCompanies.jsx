import { useState, useEffect } from 'react';
import { Select } from '../../components/ui/FormElements';
import DataTable from '../../components/ui/DataTable';
import { ROLES, REGIONS } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AdminCompanies() {
  const { user } = useAuth();
  const isRegionalAdmin = user?.role === ROLES.REGIONAL_ADMIN;

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState(isRegionalAdmin ? (user.region || '') : '');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', ROLES.CLIENT)
        .not('company_name', 'is', null);

      if (isRegionalAdmin && user.region) {
        query = query.eq('region', user.region);
      }

      const { data } = await query.order('created_at', { ascending: false });
      if (data) setCompanies(data);
      setLoading(false);
    };
    fetch();
  }, [user, isRegionalAdmin]);

  const filtered = regionFilter && !isRegionalAdmin
    ? companies.filter(c => c.region === regionFilter)
    : companies;

  const columns = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'full_name', label: 'Contact Person', render: (val) => val || '—' },
    { key: 'email', label: 'Email' },
    { key: 'region', label: 'Region', render: (val) => {
      if (!val) return '—';
      const r = REGIONS.find(reg => reg.id === val);
      return r ? r.label : val;
    }},
    { key: 'created_at', label: 'Joined', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">{filtered.length} compan{filtered.length !== 1 ? 'ies' : 'y'} found</p>
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
        <p>Loading companies...</p>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No companies found."
        />
      )}
    </div>
  );
}
