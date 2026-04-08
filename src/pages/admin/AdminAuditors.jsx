import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '../../components/ui/FormElements';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { ROLES, ROLE_LABELS, REGIONS } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AdminAuditors() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
          <h1 className="page-title">{t('admin.auditorsTitle')}</h1>
          <p className="page-subtitle">{t('admin.auditorsFound', { count: filtered.length })}</p>
        </div>
        {!isRegionalAdmin && (
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
        )}
      </div>

      {loading ? (
        <p>{t('admin.loadingAuditors')}</p>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage={t('admin.noAuditorsFound')}
        />
      )}
    </div>
  );
}
