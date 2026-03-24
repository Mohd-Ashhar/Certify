import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileCheck2, Clock, UserCheck, Percent, PlusCircle } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/FormElements';
import { supabase } from '../../lib/supabase';
import { REGIONS, ROLES } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { getPriceForISO } from '../../utils/pricing';
import './Dashboard.css';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [clientApplications, setClientApplications] = useState([]);
  const [adminApplications, setAdminApplications] = useState([]);
  const [fetchingApps, setFetchingApps] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchApps = async () => {
      setFetchingApps(true);
      if (user.role === ROLES.CLIENT) {
        const { data } = await supabase
          .from('applications')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });
        if (data) setClientApplications(data);
      } else if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.REGIONAL_ADMIN) {
        // Fetch all applications for admins
        const { data } = await supabase
          .from('applications')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setAdminApplications(data);
      }
      setFetchingApps(false);
    };
    fetchApps();
  }, [user]);

  if (!user || loading) return <div className="page-container"><p>Loading dashboard...</p></div>;

  const isClient = user?.role === ROLES.CLIENT;
  const isAdmin = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.REGIONAL_ADMIN;

  // Compute Metrics for Admins
  const totalApplications = adminApplications.length;
  const activeReview = adminApplications.filter(r => r.status === 'in_review').length;
  const pendingProcessing = adminApplications.filter(r => r.status === 'pending').length;
  const awaitingPayment = adminApplications.filter(r => r.status === 'awaiting_payment').length;
  const approvedCertifications = adminApplications.filter(r => r.status === 'approved').length;

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
      ) : isAdmin ? (
        <>
          {/* Stat Cards */}
          <div className="dashboard__stats">
            <StatCard title="Total Applications" value={totalApplications} icon={Building2} iconColor="#3ECF8E" />
            <StatCard title="Approved" value={approvedCertifications} icon={FileCheck2} iconColor="#60A5FA" />
            <StatCard title="Pending Processing" value={pendingProcessing} icon={Clock} iconColor="#FBBF24" />
            <StatCard title="Active Review" value={activeReview} icon={UserCheck} iconColor="#A78BFA" />
            <StatCard title="Awaiting Payment" value={awaitingPayment} icon={Percent} iconColor="#F87171" />
          </div>

          {/* Main content grid */}
          <div className="dashboard__grid" style={{ display: 'block' }}>
            <div className="dashboard__section">
              <div className="dashboard__section-header">
                <h2 className="dashboard__section-title">All Applications</h2>
              </div>
              {fetchingApps ? (
                <p>Loading applications...</p>
              ) : (
                <DataTable 
                  columns={[
                    { key: 'company_name', label: 'Company Name' },
                    { key: 'industry', label: 'Industry' },
                    { key: 'recommended_iso', label: 'Recommended ISO', render: (val) => val ? val : "Analyzing..." },
                    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
                    { key: 'created_at', label: 'Date', render: (val) => new Date(val).toLocaleDateString() }
                  ]} 
                  data={adminApplications} 
                  emptyMessage="No applications found in the database."
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ marginBottom: '16px' }}>Welcome to your Portal</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Your portal is currently being set up. Check back later.</p>
        </div>
      )}
    </div>
  );
}
