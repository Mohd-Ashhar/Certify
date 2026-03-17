import { useState } from 'react';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { Button, Input, Select } from '../../components/ui/FormElements';
import { mockCompanies } from '../../utils/mockData';
import { REGIONS, ROLES } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '../../utils/roles';
import { Plus, Search } from 'lucide-react';
import './Companies.css';

export default function Companies() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');

  if (!user || loading) return <div className="page-container"><p>Loading dashboard...</p></div>;

  const canManage = hasPermission(user?.role, PERMISSIONS.MANAGE_COMPANIES);
  const isRegionalAdmin = user?.role === ROLES.REGIONAL_ADMIN;

  const filtered = mockCompanies.filter(c => {
    // 1. Role-based region filter (Regional Admin only sees their region)
    if (isRegionalAdmin && c.region !== user.region) return false;

    // 2. User-selected region filter
    const matchesRegion = regionFilter === 'all' || c.region === regionFilter;
    
    // 3. Search text
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.contact.toLowerCase().includes(search.toLowerCase());
                          
    return matchesSearch && matchesRegion;
  });

  const columns = [
    { key: 'name', label: 'Company Name', render: (val) => (
      <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{val}</span>
    )},
    { key: 'region', label: 'Region', render: (val) => {
      const region = REGIONS.find(r => r.id === val);
      return region ? <span>{region.emoji} {region.label}</span> : val;
    }},
    { key: 'certifications', label: 'Certifications', render: (val) => (
      <div className="companies__certs">
        {val.map(c => <span key={c} className="companies__cert-tag">{c}</span>)}
      </div>
    )},
    { key: 'employees', label: 'Employees' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'contact', label: 'Contact', render: (val) => (
      <span style={{ color: 'var(--color-text-secondary)' }}>{val}</span>
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">{filtered.length} companies registered</p>
        </div>
        {canManage && (
          <Button variant="primary" size="md">
            <Plus size={16} /> Add Company
          </Button>
        )}
      </div>

      <div className="companies__filters">
        <div className="companies__search">
          <Search size={16} className="companies__search-icon" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="companies__search-input"
          />
        </div>
        {!isRegionalAdmin && (
          <Select
            id="region-filter"
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
        emptyMessage="No companies found"
      />
    </div>
  );
}
