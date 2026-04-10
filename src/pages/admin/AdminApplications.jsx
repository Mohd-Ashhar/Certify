import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Select, Button } from '../../components/ui/FormElements';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { ROLES, REGIONS } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AdminApplications() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
        // Fetch CB names from certification_bodies registry
        const cbIds = [...new Set(data.map(a => a.assigned_cb_id).filter(Boolean))];
        let cbMap = {};
        if (cbIds.length > 0) {
          const { data: cbRegistry } = await supabase
            .from('certification_bodies')
            .select('id, name, acronym')
            .in('id', cbIds);
          if (cbRegistry) cbMap = Object.fromEntries(cbRegistry.map(cb => [cb.id, cb.acronym ? `${cb.name} (${cb.acronym})` : cb.name]));
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
    { key: 'company_name', label: t('dashboard.company') },
    { key: 'recommended_iso', label: t('dashboard.certificate') },
    { key: 'auditor_name', label: t('dashboard.assignedAuditor') },
    { key: 'cb_name', label: t('dashboard.assignedCB') },
    { key: 'region', label: t('admin.region'), render: (val) => {
      if (!val) return '—';
      const r = REGIONS.find(reg => reg.id === val);
      return r ? r.label : val;
    }},
    { key: 'status', label: t('dashboard.status'), render: (val) => <StatusBadge status={val} /> },
    { key: 'action', label: t('dashboard.action'), render: (_, row) => (
      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/applications/${row.id}`)}>{t('common.manage')}</Button>
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('admin.allApplications')}</h1>
          <p className="page-subtitle">{t('admin.applicationsFound', { count: filtered.length })}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Select
            id="filter-status"
            name="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">{t('admin.allStatuses')}</option>
            <option value="pending">{t('admin.pending')}</option>
            <option value="awaiting_payment">{t('admin.awaitingPayment')}</option>
            <option value="in_review">{t('admin.inReview')}</option>
            <option value="audit_scheduled">{t('admin.auditScheduled')}</option>
            <option value="audited">{t('admin.audited')}</option>
            <option value="approved">{t('admin.approved')}</option>
            <option value="rejected">{t('admin.rejected')}</option>
          </Select>
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
      </div>

      {loading ? (
        <p>{t('admin.loadingApps')}</p>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage={t('admin.noAppsFound')}
        />
      )}
    </div>
  );
}
