import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/FormElements';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '../../utils/roles';
import { Plus, Search } from 'lucide-react';
import './Companies.css';

export default function Companies() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchCompanies = async () => {
      setFetching(true);
      const { data } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setCompanies(data);
      setFetching(false);
    };
    fetchCompanies();
  }, [user]);

  if (!user || loading) return <div className="page-container"><p>Loading dashboard...</p></div>;

  const canManage = hasPermission(user?.role, PERMISSIONS.MANAGE_COMPANIES);

  const filtered = companies.filter(c => {
    const matchesSearch =
      (c.company_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (c.industry?.toLowerCase() || '').includes(search.toLowerCase());
    return matchesSearch;
  });

  const columns = [
    { key: 'company_name', label: 'Company' },
    { key: 'industry', label: 'Industry' },
    { key: 'employee_count', label: 'Employees', render: (val) => val || 0 },
    { key: 'locations_count', label: 'Locations', render: (val) => val || 0 },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'created_at', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">{filtered.length} companies registered</p>
        </div>
        {canManage && (
          <Button variant="primary" size="md" onClick={() => navigate('/client/apply')}>
            <Plus size={16} /> New Application
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
      </div>

      {fetching ? (
        <p>Loading companies...</p>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No companies found"
        />
      )}
    </div>
  );
}
