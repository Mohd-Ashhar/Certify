import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '../../components/ui/FormElements';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { ROLES, ROLE_LABELS, REGIONS } from '../../utils/roles';
import { supabase } from '../../lib/supabase';

export default function AdminRegionalAdmins() {
  const { t } = useTranslation();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', ROLES.REGIONAL_ADMIN)
        .order('created_at', { ascending: false });

      if (data) setAdmins(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = regionFilter
    ? admins.filter(a => a.region === regionFilter)
    : admins;

  const columns = [
    { key: 'full_name', label: t('admin.name'), render: (val) => val || '—' },
    { key: 'email', label: t('auth.email') },
    { key: 'region', label: t('admin.region'), render: (val) => {
      if (!val) return '—';
      const r = REGIONS.find(reg => reg.id === val);
      return r ? r.label : val;
    }},
    { key: 'role', label: t('settings.role'), render: (val) => <StatusBadge status={val} label={ROLE_LABELS[val] || val} /> },
    { key: 'created_at', label: t('admin.joined'), render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('admin.regionalAdminsTitle')}</h1>
          <p className="page-subtitle">{t('admin.regionalAdminsFound', { count: filtered.length })}</p>
        </div>
        <Select
          id="filter-region"
          name="region"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="">{t('common.allRegions')}</option>
          {REGIONS.map(r => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p>{t('admin.loadingRegionalAdmins')}</p>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage={t('admin.noRegionalAdminsFound')}
        />
      )}
    </div>
  );
}
