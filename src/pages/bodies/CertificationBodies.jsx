import { useState } from 'react';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { Button, Select } from '../../components/ui/FormElements';
import { mockCertificationBodies } from '../../utils/mockData';
import { REGIONS, ROLES } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '../../utils/roles';
import { Plus, Search } from 'lucide-react';

export default function CertificationBodies() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');

  if (!user || loading) return <div className="page-container"><p>Loading dashboard...</p></div>;

  const canManage = hasPermission(user?.role, PERMISSIONS.MANAGE_BODIES);
  const isRegionalAdmin = user?.role === ROLES.REGIONAL_ADMIN;

  const filtered = mockCertificationBodies.filter(b => {
    // 1. Role-based region filter
    if (isRegionalAdmin && b.region !== user.region) return false;

    // 2. User-selected region filter
    const matchesRegion = regionFilter === 'all' || b.region === regionFilter;
    
    // 3. Search filter
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch && matchesRegion;
  });

  const columns = [
    { key: 'name', label: 'Body Name', render: (val) => (
      <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{val}</span>
    )},
    { key: 'region', label: 'Region', render: (val) => {
      const region = REGIONS.find(r => r.id === val);
      return region ? (
        <span className="companies__cert-tag" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
          {region.emoji} {region.label}
        </span>
      ) : val;
    }},
    { key: 'accreditation', label: 'Accreditation', render: (val) => (
      <span style={{ fontWeight: 500, color: 'var(--color-info)' }}>{val}</span>
    )},
    { key: 'activeCertifications', label: 'Active Certs', render: (val) => (
      <span style={{ fontWeight: 600 }}>{val}</span>
    )},
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Certification Bodies</h1>
          <p className="page-subtitle">{filtered.length} certification bodies registered</p>
        </div>
        {canManage && (
          <Button variant="primary" size="md">
            <Plus size={16} /> Add Body
          </Button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
        <div className="companies__search">
          <Search size={16} className="companies__search-icon" />
          <input
            type="text"
            placeholder="Search certification bodies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="companies__search-input"
          />
        </div>
        {!isRegionalAdmin && (
          <Select
            id="body-region-filter"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="all">All Regions</option>
            {REGIONS.map(r => (
              <option key={r.id} value={r.id}>{r.emoji} {r.label}</option>
            ))}
          </Select>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No certification bodies found"
      />
    </div>
  );
}
