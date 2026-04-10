import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import MultiSelect from '../../components/ui/MultiSelect';
import { Button, Input, Select } from '../../components/ui/FormElements';
import { supabase } from '../../lib/supabase';
import { ROLES } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { IAF_COUNTRIES } from '../../utils/countries';
import { ISO_STANDARD_OPTIONS } from '../../utils/isoStandards';
import { IAF_SECTOR_CODES } from '../../utils/iafCodes';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  acronym: '',
  website: '',
  country: '',
  accreditation_body_ids: [],
  country_ids: [],
  iso_standards: [],
  iaf_codes: [],
  initial_price: '',
  surveillance_price: '',
  recertification_price: '',
  currency: 'USD',
  status: 'active',
};

export default function CertificationBodies() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const isRegionalAdmin = user?.role === ROLES.REGIONAL_ADMIN;
  const canAdd = isSuperAdmin || isRegionalAdmin;
  const canEditOrDelete = isSuperAdmin;

  const [search, setSearch] = useState('');
  const [bodies, setBodies] = useState([]);
  const [accreditationBodies, setAccreditationBodies] = useState([]);
  const [dbCountries, setDbCountries] = useState([]);
  const [fetching, setFetching] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // --- Fetch CB registry + AB list + countries ---
  const fetchData = async () => {
    setFetching(true);
    try {
      const [cbRes, abRes, countryRes] = await Promise.all([
        supabase
          .from('certification_bodies')
          .select(`
            id, name, acronym, website, country, status,
            initial_price, surveillance_price, recertification_price, currency,
            created_at,
            cb_accreditation_bodies ( accreditation_body_id,
              accreditation_bodies ( id, name, acronym ) ),
            cb_countries ( country_id, countries ( id, name ) ),
            cb_iso_standards ( iso_standard ),
            cb_iaf_codes ( iaf_code )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('accreditation_bodies').select('id, name, acronym').order('name'),
        supabase.from('countries').select('id, name').order('name'),
      ]);

      if (cbRes.data) setBodies(cbRes.data);
      if (abRes.data) setAccreditationBodies(abRes.data);
      if (countryRes.data) setDbCountries(countryRes.data);
    } catch (err) {
      console.error('Failed to load CB registry:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Dropdown option lists ---
  const abOptions = useMemo(
    () => accreditationBodies.map(ab => ({ value: ab.id, label: `${ab.acronym} — ${ab.name}` })),
    [accreditationBodies]
  );

  const countryOptions = useMemo(
    () => dbCountries.map(c => ({ value: c.id, label: c.name })),
    [dbCountries]
  );

  // Fallback: if countries table not populated yet, use the static list (id-less — names only)
  const countryOptionsFallback = useMemo(
    () => IAF_COUNTRIES.map(name => ({ value: name, label: name })),
    []
  );

  const isoOptions = useMemo(
    () => ISO_STANDARD_OPTIONS.map(s => ({ value: s, label: s })),
    []
  );

  const iafOptions = useMemo(
    () => IAF_SECTOR_CODES.map(c => ({ value: c.code, label: `${c.code} — ${c.name}` })),
    []
  );

  // --- Modal actions ---
  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setError('');
    setFormData({
      name: row.name || '',
      acronym: row.acronym || '',
      website: row.website || '',
      country: row.country || '',
      accreditation_body_ids: (row.cb_accreditation_bodies || [])
        .map(x => x.accreditation_body_id),
      country_ids: (row.cb_countries || []).map(x => x.country_id),
      iso_standards: (row.cb_iso_standards || []).map(x => x.iso_standard),
      iaf_codes: (row.cb_iaf_codes || []).map(x => x.iaf_code),
      initial_price: row.initial_price ?? '',
      surveillance_price: row.surveillance_price ?? '',
      recertification_price: row.recertification_price ?? '',
      currency: row.currency || 'USD',
      status: row.status || 'active',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError('');
  };

  // --- Write join tables ---
  const writeJoinRows = async (cbId, data) => {
    // Wipe + re-insert on edit (simple, correct, no diffing).
    if (editingId) {
      await Promise.all([
        supabase.from('cb_accreditation_bodies').delete().eq('cb_id', cbId),
        supabase.from('cb_countries').delete().eq('cb_id', cbId),
        supabase.from('cb_iso_standards').delete().eq('cb_id', cbId),
        supabase.from('cb_iaf_codes').delete().eq('cb_id', cbId),
      ]);
    }

    const abRows = data.accreditation_body_ids.map(id => ({
      cb_id: cbId,
      accreditation_body_id: id,
    }));
    const countryRows = data.country_ids.map(id => ({
      cb_id: cbId,
      country_id: id,
    }));
    const isoRows = data.iso_standards.map(s => ({
      cb_id: cbId,
      iso_standard: s,
    }));
    const iafRows = data.iaf_codes.map(code => ({
      cb_id: cbId,
      iaf_code: code,
    }));

    const writes = [];
    if (abRows.length) writes.push(supabase.from('cb_accreditation_bodies').insert(abRows));
    if (countryRows.length) writes.push(supabase.from('cb_countries').insert(countryRows));
    if (isoRows.length) writes.push(supabase.from('cb_iso_standards').insert(isoRows));
    if (iafRows.length) writes.push(supabase.from('cb_iaf_codes').insert(iafRows));

    const results = await Promise.all(writes);
    for (const r of results) {
      if (r.error) throw r.error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError(t('certBody.nameRequired'));
      return;
    }
    if (formData.accreditation_body_ids.length === 0) {
      setError(t('certBody.selectAtLeastOneAB'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        acronym: formData.acronym.trim() || null,
        website: formData.website.trim() || null,
        country: formData.country || null,
        status: formData.status || 'active',
        initial_price: formData.initial_price ? Number(formData.initial_price) : null,
        surveillance_price: formData.surveillance_price ? Number(formData.surveillance_price) : null,
        recertification_price: formData.recertification_price ? Number(formData.recertification_price) : null,
        currency: formData.currency || 'USD',
      };

      let cbId = editingId;

      if (editingId) {
        const { error: updErr } = await supabase
          .from('certification_bodies')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        if (updErr) throw updErr;
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('certification_bodies')
          .insert([{ ...payload, created_by: user?.id || null }])
          .select()
          .single();
        if (insErr) throw insErr;
        cbId = inserted.id;
      }

      await writeJoinRows(cbId, formData);
      await fetchData();
      closeModal();
    } catch (err) {
      console.error('Save CB error:', err);
      setError(err.message || t('certBody.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!canEditOrDelete) return;
    if (!window.confirm(t('certBody.confirmDelete', { name: row.name }))) return;
    try {
      const { error: delErr } = await supabase
        .from('certification_bodies')
        .delete()
        .eq('id', row.id);
      if (delErr) throw delErr;
      setBodies(prev => prev.filter(b => b.id !== row.id));
    } catch (err) {
      console.error('Delete CB error:', err);
      alert(t('certBody.deleteFailed') + ': ' + err.message);
    }
  };

  if (!user || loading) {
    return <div className="page-container"><p>{t('common.loadingDashboard')}</p></div>;
  }

  const filtered = bodies.filter(b => {
    const q = search.toLowerCase();
    return (
      (b.name || '').toLowerCase().includes(q) ||
      (b.acronym || '').toLowerCase().includes(q) ||
      (b.country || '').toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: 'name',
      label: t('admin.bodyName'),
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{val || '—'}</div>
          {row.acronym && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{row.acronym}</div>
          )}
        </div>
      ),
    },
    {
      key: 'cb_accreditation_bodies',
      label: t('certBody.accreditationBodies'),
      render: (val) => {
        if (!val || val.length === 0) return '—';
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {val.slice(0, 3).map((x, i) => (
              <span key={i} style={{
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(62,207,142,0.12)',
                color: 'var(--color-accent, #3ECF8E)',
                fontWeight: 500,
              }}>
                {x.accreditation_bodies?.acronym || '—'}
              </span>
            ))}
            {val.length > 3 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                +{val.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'cb_countries',
      label: t('certBody.countriesCovered'),
      render: (val) => {
        if (!val || val.length === 0) return '—';
        if (val.length <= 2) {
          return val.map(x => x.countries?.name).filter(Boolean).join(', ');
        }
        return `${val[0].countries?.name || ''}, ${val[1].countries?.name || ''} +${val.length - 2}`;
      },
    },
    {
      key: 'cb_iso_standards',
      label: t('certBody.isoTypes'),
      render: (val) => {
        if (!val || val.length === 0) return '—';
        return val.slice(0, 3).map(x => x.iso_standard).join(', ') + (val.length > 3 ? ` +${val.length - 3}` : '');
      },
    },
    {
      key: 'website',
      label: t('admin.website'),
      render: (val) => val ? (
        <a href={val} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent, #3ECF8E)' }}>
          {val.replace(/^https?:\/\//, '').split('/')[0]}
        </a>
      ) : '—',
    },
    {
      key: 'status',
      label: t('dashboard.status'),
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  if (canEditOrDelete || canAdd) {
    columns.push({
      key: 'actions',
      label: t('common.actions') || 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {canEditOrDelete && (
            <button
              type="button"
              className="icon-btn"
              title={t('common.edit') || 'Edit'}
              onClick={() => openEdit(row)}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: 6,
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Pencil size={14} />
            </button>
          )}
          {canEditOrDelete && (
            <button
              type="button"
              className="icon-btn"
              title={t('common.delete') || 'Delete'}
              onClick={() => handleDelete(row)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 6,
                padding: 6,
                cursor: 'pointer',
                color: '#ef4444',
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    });
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('admin.certBodiesTitle')}</h1>
          <p className="page-subtitle">{t('admin.certBodiesFound', { count: filtered.length })}</p>
        </div>
        {canAdd && (
          <Button variant="primary" size="md" onClick={openCreate}>
            <Plus size={16} /> {t('certBody.addBody')}
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

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? t('certBody.editBody') : t('certBody.addBody')}
        size="lg"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
              borderRadius: 6,
              fontSize: '0.85rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Input
              label={t('certBody.bodyNameRequired')}
              name="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label={t('certBody.acronym')}
              name="acronym"
              value={formData.acronym}
              onChange={e => setFormData({ ...formData, acronym: e.target.value })}
            />
          </div>

          <Input
            label={t('admin.website')}
            name="website"
            type="url"
            placeholder="https://..."
            value={formData.website}
            onChange={e => setFormData({ ...formData, website: e.target.value })}
          />

          <MultiSelect
            label={t('certBody.accreditationBodiesRequired')}
            options={abOptions}
            value={formData.accreditation_body_ids}
            onChange={(ids) => setFormData({ ...formData, accreditation_body_ids: ids })}
            placeholder={t('certBody.selectABs')}
          />

          <MultiSelect
            label={t('certBody.countriesCovered')}
            options={countryOptions.length > 0 ? countryOptions : countryOptionsFallback}
            value={formData.country_ids}
            onChange={(ids) => setFormData({ ...formData, country_ids: ids })}
            placeholder={t('certBody.selectCountries')}
          />

          <MultiSelect
            label={t('certBody.isoTypes')}
            options={isoOptions}
            value={formData.iso_standards}
            onChange={(vals) => setFormData({ ...formData, iso_standards: vals })}
            placeholder={t('certBody.selectISO')}
          />

          <MultiSelect
            label={t('certBody.iafCodes')}
            options={iafOptions}
            value={formData.iaf_codes}
            onChange={(vals) => setFormData({ ...formData, iaf_codes: vals })}
            placeholder={t('certBody.selectIAF')}
          />

          <div style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: 12,
            marginTop: 4,
          }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>
              {t('certBody.pricing')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px', gap: 10 }}>
              <Input
                label={t('certBody.initialPrice')}
                name="initial_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.initial_price}
                onChange={e => setFormData({ ...formData, initial_price: e.target.value })}
              />
              <Input
                label={t('certBody.surveillancePrice')}
                name="surveillance_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.surveillance_price}
                onChange={e => setFormData({ ...formData, surveillance_price: e.target.value })}
              />
              <Input
                label={t('certBody.recertPrice')}
                name="recertification_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.recertification_price}
                onChange={e => setFormData({ ...formData, recertification_price: e.target.value })}
              />
              <Select
                label={t('certBody.currency')}
                name="currency"
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="AED">AED</option>
                <option value="INR">INR</option>
              </Select>
            </div>
          </div>

          <Select
            label={t('dashboard.status')}
            name="status"
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="active">{t('admin.active') || 'Active'}</option>
            <option value="inactive">{t('admin.inactive') || 'Inactive'}</option>
          </Select>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={closeModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editingId ? t('common.save') : t('certBody.addBody')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
