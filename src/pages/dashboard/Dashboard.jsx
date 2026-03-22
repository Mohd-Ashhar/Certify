import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileCheck2, Clock, UserCheck, Percent, PlusCircle } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/FormElements';
import { supabase } from '../../lib/supabase';
import { 
  mockCertificationRequests, 
  mockCompanies, 
  mockAuditors 
} from '../../utils/mockData';
import { REGIONS, ROLES } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { getPriceForISO } from '../../utils/pricing';
import './Dashboard.css';

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'company', label: 'Company' },
  { key: 'iso_standard', label: 'Standard' },
  { key: 'region', label: 'Region', render: (val) => {
    const region = REGIONS.find(r => r.id === val);
    return region ? `${region.emoji} ${region.label}` : val;
  }},
  { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  { key: 'created_at', label: 'Date' },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [clientApplications, setClientApplications] = useState([]);
  const [fetchingApps, setFetchingApps] = useState(false);

  useEffect(() => {
    if (user?.role === ROLES.CLIENT) {
      const fetchApps = async () => {
        setFetchingApps(true);
        const { data } = await supabase
          .from('applications')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });
        if (data) setClientApplications(data);
        setFetchingApps(false);
      };
      fetchApps();
    }
  }, [user]);

  if (!user || loading) return <div className="page-container"><p>Loading dashboard...</p></div>;

  const isClient = user?.role === ROLES.CLIENT;
  const isRegionalAdmin = user?.role === ROLES.REGIONAL_ADMIN;

  // Filter data based on role
  const filteredRequests = mockCertificationRequests.filter(r => 
    !isRegionalAdmin || r.region === user.region
  );
  const filteredCompanies = mockCompanies.filter(c => 
    !isRegionalAdmin || c.region === user.region
  );
  const filteredAuditors = mockAuditors.filter(a => 
    !isRegionalAdmin || a.region === user.region
  );

  // Compute Metrics
  const totalCompanies = filteredCompanies.length;
  const activeCertifications = filteredRequests.filter(r => r.status === 'approved').length;
  const pendingRequests = filteredRequests.filter(r => r.status === 'pending').length;
  const activeAuditors = filteredAuditors.filter(a => a.status === 'active').length;
  
  const totalRequests = filteredRequests.length;
  const approvalRate = totalRequests > 0 
    ? Math.round((activeCertifications / totalRequests) * 100) 
    : 0;

  const recentRequests = filteredRequests.slice(0, 5);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{isClient ? 'Manage your applications' : 'Overview of your certification platform'}</p>
        </div>
      </div>

      {isClient ? (
        <div className="dashboard__grid" style={{ display: 'block' }}>
          <div className="dashboard__section">
            <div className="dashboard__section-header">
              <h2 className="dashboard__section-title">Your Applications</h2>
              {clientApplications.length > 0 && (
                <Button onClick={() => navigate('/client/apply')} size="sm">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlusCircle size={16} /> New Application
                  </div>
                </Button>
              )}
            </div>
            {fetchingApps ? (
              <p>Loading applications...</p>
            ) : clientApplications.length > 0 ? (
              <DataTable 
                columns={[
                  { key: 'company_name', label: 'Company Name' },
                  { key: 'industry', label: 'Industry' },
                  { key: 'recommended_iso', label: 'Recommended ISO', render: (val) => val ? val : "Analyzing..." },
                  { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
                  { 
                    key: 'id', 
                    label: 'Action', 
                    render: (id, row) => row.status === 'awaiting_payment' 
                      ? <Button size="sm" variant="primary" onClick={() => navigate(`/client/checkout/${id}`, { state: { price: getPriceForISO(row.recommended_iso), iso: row.recommended_iso } })}>Pay ${getPriceForISO(row.recommended_iso).toLocaleString()}</Button> 
                      : <span style={{ color: 'var(--text-muted)' }}>Pending</span> 
                  }
                ]} 
                data={clientApplications} 
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <FileCheck2 size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ marginBottom: '8px' }}>No Applications Yet</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Start your ISO certification journey today.</p>
                <Button onClick={() => navigate('/client/apply')}>Create Application</Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="dashboard__stats">
        <StatCard
          title="Total Companies"
          value={totalCompanies}
          icon={Building2}
          iconColor="#3ECF8E"
        />
        <StatCard
          title="Active Certifications"
          value={activeCertifications}
          icon={FileCheck2}
          iconColor="#60A5FA"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          icon={Clock}
          iconColor="#FBBF24"
        />
        <StatCard
          title="Active Auditors"
          value={activeAuditors}
          icon={UserCheck}
          iconColor="#A78BFA"
        />
         <StatCard
          title="Approval Rate"
          value={`${approvalRate}%`}
          icon={Percent}
          iconColor="#F87171"
        />
      </div>

      {/* Main content grid */}
      <div className="dashboard__grid">
        {/* Recent Requests */}
        <div className="dashboard__section">
          <div className="dashboard__section-header">
            <h2 className="dashboard__section-title">Recent Certification Requests</h2>
            <a href="/certification-requests" className="dashboard__section-link">View all →</a>
          </div>
          <DataTable columns={columns} data={recentRequests} emptyMessage="No recent requests found." />
        </div>

        {/* Region Breakdown */}
        <div className="dashboard__sidebar-section">
          {!isRegionalAdmin && (
            <>
              <h2 className="dashboard__section-title">Region Breakdown</h2>
              <div className="dashboard__regions">
                {REGIONS.map((region) => {
                  const regionCompanies = mockCompanies.filter(c => c.region === region.id).length;
                  const percentage = totalCompanies > 0 ? Math.round((regionCompanies / totalCompanies) * 100) : 0;
                  return (
                    <div key={region.id} className="dashboard__region-item">
                      <div className="dashboard__region-info">
                        <span className="dashboard__region-emoji">{region.emoji}</span>
                        <span className="dashboard__region-label">{region.label}</span>
                      </div>
                      <div className="dashboard__region-stats">
                        <span className="dashboard__region-count">{regionCompanies} companies</span>
                        <div className="dashboard__region-bar">
                          <div
                            className="dashboard__region-bar-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <h2 className="dashboard__section-title" style={{ marginTop: isRegionalAdmin ? 0 : 'var(--spacing-lg)' }}>
            Certification Status
          </h2>
          <div className="dashboard__status-breakdown">
            <div className="dashboard__status-item">
              <StatusBadge status="approved" />
              <span className="dashboard__status-count">
                {filteredRequests.filter(r => r.status === 'approved').length}
              </span>
            </div>
            <div className="dashboard__status-item">
              <StatusBadge status="pending" />
              <span className="dashboard__status-count">
                {filteredRequests.filter(r => r.status === 'pending').length}
              </span>
            </div>
            <div className="dashboard__status-item">
              <StatusBadge status="audit_scheduled" />
              <span className="dashboard__status-count">
                {filteredRequests.filter(r => r.status === 'audit_scheduled').length}
              </span>
            </div>
            <div className="dashboard__status-item">
              <StatusBadge status="in_review" />
              <span className="dashboard__status-count">
                {filteredRequests.filter(r => r.status === 'in_review').length}
              </span>
            </div>
             <div className="dashboard__status-item">
              <StatusBadge status="rejected" />
              <span className="dashboard__status-count">
                {filteredRequests.filter(r => r.status === 'rejected').length}
              </span>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
