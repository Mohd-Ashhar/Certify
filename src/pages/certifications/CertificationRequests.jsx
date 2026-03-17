import { useState } from 'react';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { Button, Select } from '../../components/ui/FormElements';
import { mockCertificationRequests, mockAuditors } from '../../utils/mockData';
import { REGIONS, CERTIFICATION_STATUSES } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, PERMISSIONS, ROLES } from '../../utils/roles';
import { Plus, Search, CheckCircle } from 'lucide-react';
import './CertificationRequests.css';

const priorityBadge = (priority) => {
  const variants = { high: 'danger', medium: 'warning', low: 'neutral' };
  const labels = { high: 'High', medium: 'Medium', low: 'Low' };
  return <StatusBadge variant={variants[priority]} label={labels[priority]} />;
};

export default function CertificationRequests() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [requests, setRequests] = useState(mockCertificationRequests);
  const [toast, setToast] = useState(null);

  if (!user || loading) return <div className="page-container"><p>Loading dashboard...</p></div>;

  const canManage = hasPermission(user?.role, PERMISSIONS.MANAGE_CERTIFICATIONS);
  const isRegionalAdmin = user?.role === ROLES.REGIONAL_ADMIN;

  const handleAssignAuditor = (requestId, auditorName) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      const updates = { assigned_auditor: auditorName || null };
      // Auto-transition: pending → audit_scheduled when auditor is assigned
      if (auditorName && r.status === CERTIFICATION_STATUSES.PENDING) {
        updates.status = CERTIFICATION_STATUSES.AUDIT_SCHEDULED;
      }
      // If auditor is removed and status is audit_scheduled, revert to pending
      if (!auditorName && r.status === CERTIFICATION_STATUSES.AUDIT_SCHEDULED) {
        updates.status = CERTIFICATION_STATUSES.PENDING;
      }
      return { ...r, ...updates };
    }));

    if (auditorName) {
      setToast(`Auditor "${auditorName}" assigned to ${requestId}`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filtered = requests.filter(r => {
    // 1. Role-based region filter
    if (isRegionalAdmin && r.region !== user.region) return false;

    // 2. User-selected region filter
    const matchesRegion = regionFilter === 'all' || r.region === regionFilter;
    
    // 3. Search and status filters
    const matchesSearch = r.company.toLowerCase().includes(search.toLowerCase()) ||
                          r.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const columns = [
    { key: 'id', label: 'Request ID', render: (val) => (
      <span style={{ fontFamily: 'monospace', color: 'var(--color-accent)', fontWeight: 500 }}>{val}</span>
    )},
    { key: 'company', label: 'Company', render: (val) => (
      <span style={{ fontWeight: 500 }}>{val}</span>
    )},
    { key: 'iso_standard', label: 'Standard', render: (val) => (
      <span className="cert-request__standard-tag">{val}</span>
    )},
    { key: 'region', label: 'Region', render: (val) => {
      const region = REGIONS.find(r => r.id === val);
      return region ? `${region.emoji} ${region.label}` : val;
    }},
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'priority', label: 'Priority', render: (val) => priorityBadge(val) },
    { key: 'assigned_auditor', label: 'Assigned Auditor', render: (val, row) => {
      // If the user can manage certifications and the request is not completed
      if (canManage && !['approved', 'rejected'].includes(row.status)) {
        // Filter auditors to match the request's region
        const regionalAuditors = mockAuditors.filter(a => a.region === row.region);
        
        return (
          <select 
            className="cert-request__auditor-select"
            value={val || ''}
            onChange={(e) => handleAssignAuditor(row.id, e.target.value)}
          >
            <option value="">Unassigned</option>
            {regionalAuditors.map(auditor => (
              <option key={auditor.id} value={auditor.name}>{auditor.name}</option>
            ))}
          </select>
        );
      }
      return (
        <span style={{ color: !val ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)' }}>
          {val || 'Unassigned'}
        </span>
      );
    }},
    { key: 'created_at', label: 'Date' },
  ];

  return (
    <div className="page-container">
      {/* Toast notification */}
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
        {canManage && (
          <Button variant="primary" size="md">
            <Plus size={16} /> New Request
          </Button>
        )}
      </div>

      <div className="cert-request__filters">
        <div className="companies__search">
          <Search size={16} className="companies__search-icon" />
          <input
            type="text"
            placeholder="Search by company or ID..."
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
          <option value="audit_scheduled">Audit Scheduled</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
        {!isRegionalAdmin && (
          <Select
            id="region-filter-cert"
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
        emptyMessage="No certification requests found"
      />
    </div>
  );
}
