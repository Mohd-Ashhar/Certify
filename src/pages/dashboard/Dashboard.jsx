import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileCheck2, Clock, UserCheck, Percent, PlusCircle, CheckCircle2, ChevronRight, Upload, FileText, AlertCircle, MessageSquare } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/FormElements';
import { supabase } from '../../lib/supabase';
import { REGIONS, ROLES } from '../../utils/roles';
import { useAuth } from '../../contexts/AuthContext';
import { getPriceForISO, getCountryTier } from '../../utils/pricing';
import './Dashboard.css';

const STEPS = [
  { id: 1, label: 'Submitted', statuses: ['pending', 'awaiting_payment'] },
  { id: 2, label: 'Under Review', statuses: ['in_review'] },
  { id: 3, label: 'Audit Scheduled', statuses: ['audit_scheduled'] },
  { id: 4, label: 'Certified', statuses: ['approved'] }
];

const getCurrentStepIndex = (status) => {
  const stepIndex = STEPS.findIndex(s => s.statuses.includes(status));
  return stepIndex >= 0 ? stepIndex : 0;
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [clientApplications, setClientApplications] = useState([]);
  const [adminApplications, setAdminApplications] = useState([]);
  const [auditorApplications, setAuditorApplications] = useState([]);
  const [cbApplications, setCbApplications] = useState([]);
  const [fetchingApps, setFetchingApps] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

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
        const { data } = await supabase
          .from('applications')
          .select('*, auditor:profiles!assigned_auditor_id(full_name), client:profiles!client_id(region)')
          .order('created_at', { ascending: false });
        if (data) {
          // Fetch CB names separately (assigned_cb_id FK points to certification_bodies, not profiles)
          const cbIds = [...new Set(data.map(a => a.assigned_cb_id).filter(Boolean))];
          let cbMap = {};
          if (cbIds.length > 0) {
            const { data: cbProfiles } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', cbIds);
            if (cbProfiles) cbMap = Object.fromEntries(cbProfiles.map(p => [p.id, p.full_name]));
          }
          let flattened = data.map(app => ({
            ...app,
            auditor_name: app.auditor?.full_name || 'Unassigned',
            cb_name: cbMap[app.assigned_cb_id] || 'Unassigned',
            client_region: app.client?.region || null,
          }));
          // Regional Admin: only show applications from their region
          if (user.role === ROLES.REGIONAL_ADMIN && user.region) {
            flattened = flattened.filter(app => app.client_region === user.region);
          }
          setAdminApplications(flattened);
        }
      } else if (user.role === ROLES.AUDITOR) {
        const { data } = await supabase
          .from('applications')
          .select('*')
          .eq('assigned_auditor_id', user.id)
          .order('created_at', { ascending: false });
        if (data) setAuditorApplications(data);
      } else if (user.role === ROLES.CERTIFICATION_BODY) {
        const { data } = await supabase
          .from('applications')
          .select('*')
          .eq('assigned_cb_id', user.id)
          .order('created_at', { ascending: false });
        if (data) setCbApplications(data);
      }
      setFetchingApps(false);
    };
    fetchApps();
  }, [user]);

  const activeApp = clientApplications[0];

  useEffect(() => {
    if (!activeApp) return;
    const fetchDocs = async () => {
      setFetchingDocs(true);
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('application_id', activeApp.id)
        .order('created_at', { ascending: false });
      if (data) setDocuments(data);
      setFetchingDocs(false);
    };
    fetchDocs();
  }, [activeApp]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeApp) return;
    setUploadingDoc(true);
    
    const { data, error } = await supabase.from('documents').insert([{ 
      application_id: activeApp.id, 
      client_id: user.id, 
      file_name: file.name, 
      file_size: `${(file.size / 1024 / 1024).toFixed(2)}MB` 
    }]).select();
    
    if (data && data.length > 0) {
      setDocuments([data[0], ...documents]);
    }
    setUploadingDoc(false);
  };

  if (!user || loading) return <div className="page-container"><p>Loading dashboard...</p></div>;

  const isClient = user?.role === ROLES.CLIENT;
  const isAdmin = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.REGIONAL_ADMIN;
  const isAuditor = user?.role === ROLES.AUDITOR;
  const isCB = user?.role === ROLES.CERTIFICATION_BODY;

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
        <div className="dashboard__client-layout">
          {!fetchingApps && clientApplications.length === 0 ? (
            <div className="dashboard__empty-state" style={{ textAlign: 'center', padding: '40px', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <FileCheck2 size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              {user?.gap_analysis_score == null ? (
                <>
                  <h3 style={{ marginBottom: '8px' }}>Take Your Free Gap Analysis</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Find out if your organization is ready for ISO certification.</p>
                  <Button onClick={() => navigate('/client/gap-analysis')}>Take Gap Analysis Quiz</Button>
                </>
              ) : user?.gap_analysis_score < 60 ? (
                <>
                  <h3 style={{ marginBottom: '8px' }}>Gap Analysis Completed</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please contact support to improve your readiness before applying.</p>
                </>
              ) : (
                <>
                  <h3 style={{ marginBottom: '8px' }}>No Applications Yet</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Start your ISO certification journey today.</p>
                  <Button onClick={() => navigate('/client/apply')}>Create Application</Button>
                </>
              )}
            </div>
          ) : fetchingApps ? (
            <p>Loading applications...</p>
          ) : (
            <>
              {activeApp && (
                <>
                  <div className="dashboard__section dashboard__tracker-section">
                    <div className="dashboard__section-header" style={{ marginBottom: '2rem' }}>
                      <h2 className="dashboard__section-title">Active Application: {activeApp.recommended_iso || 'Pending ISO Analysis'}</h2>
                      <StatusBadge status={activeApp.status} />
                    </div>
                    
                    {/* Stepper */}
                    <div className="tracker-stepper">
                      {STEPS.map((step, idx) => {
                        const currentIdx = getCurrentStepIndex(activeApp.status);
                        const isCompleted = idx < currentIdx;
                        const isActive = idx === currentIdx;
                        
                        return (
                          <div key={step.id} className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                            <div className="stepper-icon">
                              {isCompleted ? <CheckCircle2 size={20} /> : <span>{step.id}</span>}
                            </div>
                            <div className="stepper-label">{step.label}</div>
                            {idx < STEPS.length - 1 && <div className="stepper-connector" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tasks & Messages Grid */}
                  <div className="dashboard__grid">
                    <div className="dashboard__section">
                      <div className="section-subtitle-container">
                        <AlertCircle size={18}/> <h3 className="section-subtitle">Tasks Required</h3>
                      </div>
                      <div className="tasks-container">
                        {activeApp.status === 'awaiting_payment' ? (
                          <div className="task-card action-required">
                            <h4>Complete Payment for {activeApp.recommended_iso || 'ISO Application'}</h4>
                            <p>Your application is ready for processing. Please complete the payment to proceed.</p>
                            <Button style={{ width: '100%' }} onClick={() => navigate(`/client/checkout/${activeApp.id}`, { state: { price: getPriceForISO(activeApp.recommended_iso, getCountryTier(user?.country)), iso: activeApp.recommended_iso } })}>Pay ${getPriceForISO(activeApp.recommended_iso, getCountryTier(user?.country))?.toLocaleString()}</Button>
                          </div>
                        ) : activeApp.status === 'in_review' ? (
                          <div className="task-card action-required">
                            <h4>Upload required compliance documents</h4>
                            <p>Please upload your compliance procedures and manuals in the Document Management section below.</p>
                          </div>
                        ) : (
                          <div className="task-card success">
                            <CheckCircle2 size={24} style={{ marginBottom: '12px', color: 'var(--color-success)' }} />
                            <h4>You're all set!</h4>
                            <p>No pending tasks at this time. We will notify you when the next step requires action.</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="dashboard__section">
                      <div className="section-subtitle-container">
                        <MessageSquare size={18}/> <h3 className="section-subtitle">Messages & Updates</h3>
                      </div>
                      <ul className="messages-list">
                        <li>
                          <div className="message-icon system"><FileCheck2 size={16}/></div>
                          <div className="message-content">
                            <strong>System:</strong> Application received successfully.
                          </div>
                        </li>
                        {activeApp.recommended_iso && (
                          <li>
                            <div className="message-icon system"><FileCheck2 size={16}/></div>
                            <div className="message-content">
                              <strong>AI Recommendation:</strong> We analyzed your industry and recommended <span>{activeApp.recommended_iso}</span>.
                            </div>
                          </li>
                        )}
                        {getCurrentStepIndex(activeApp.status) >= 1 && (
                          <li>
                            <div className="message-icon admin"><UserCheck size={16}/></div>
                            <div className="message-content">
                              <strong>Admin:</strong> Your application is now under review.
                            </div>
                          </li>
                        )}
                        {getCurrentStepIndex(activeApp.status) >= 2 && (
                          <li>
                            <div className="message-icon admin"><Clock size={16}/></div>
                            <div className="message-content">
                              <strong>Admin:</strong> Your audit has been scheduled. Prepare your documents.
                            </div>
                          </li>
                        )}
                        {getCurrentStepIndex(activeApp.status) === 3 && (
                          <li>
                            <div className="message-icon success"><CheckCircle2 size={16}/></div>
                            <div className="message-content">
                              <strong>Admin:</strong> Congratulations! You are now certified.
                            </div>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Document Management */}
                  <div className="dashboard__section document-section" style={{ marginTop: '2rem' }}>
                    <div className="dashboard__section-header">
                      <div className="section-subtitle-container">
                        <FileText size={18}/> <h3 className="section-subtitle" style={{ margin: 0 }}>Uploaded Documents</h3>
                      </div>
                      <label className="button button--primary button--sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {uploadingDoc ? 'Uploading...' : <><Upload size={16} /> Upload Document</>}
                        <input type="file" style={{ display: 'none' }} disabled={uploadingDoc} onChange={handleFileUpload} />
                      </label>
                    </div>
                    
                    {fetchingDocs ? (
                      <p className="text-muted">Loading documents...</p>
                    ) : documents.length > 0 ? (
                      <div className="documents-list">
                        {documents.map(doc => (
                          <div key={doc.id} className="document-item">
                            <div className="document-info">
                              <FileText size={20} color="var(--color-accent)" />
                              <div>
                                <h4>{doc.file_name}</h4>
                                <span>{new Date(doc.created_at).toLocaleDateString()} • {doc.file_size}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="documents-empty">
                        <p>No documents uploaded yet. Upload your compliance manuals or supporting files here.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Past Applications */}
              <div className="dashboard__section past-applications-section" style={{ marginTop: '2rem' }}>
                <div className="dashboard__section-header">
                  <h2 className="dashboard__section-title">Past Applications</h2>
                  {clientApplications.length > 0 && (user?.gap_analysis_score == null || user?.gap_analysis_score >= 60) && (
                    <Button onClick={() => navigate('/client/apply')} size="sm">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PlusCircle size={16} /> New Application
                      </div>
                    </Button>
                  )}
                </div>
                {clientApplications.length > 0 ? (
                  <DataTable 
                    columns={[
                      { key: 'industry', label: 'Industry' },
                      { key: 'recommended_iso', label: 'Recommended ISO', render: (val) => val ? val : "Analyzing..." },
                      { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
                      { key: 'created_at', label: 'Date', render: (val) => new Date(val).toLocaleDateString() }
                    ]} 
                    data={clientApplications.length > 1 ? clientApplications.slice(1) : clientApplications} 
                    emptyMessage="No past applications found."
                  />
                ) : (
                  <p className="text-muted">No past applications.</p>
                )}
              </div>
            </>
          )}
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
                <h2 className="dashboard__section-title">Recent Applications</h2>
                {adminApplications.length > 5 && (
                  <Button size="sm" variant="outline" onClick={() => navigate('/admin/applications')}>
                    View All <ChevronRight size={14} />
                  </Button>
                )}
              </div>
              {fetchingApps ? (
                <p>Loading applications...</p>
              ) : (
                <DataTable
                  columns={[
                    { key: 'company_name', label: 'Company' },
                    { key: 'recommended_iso', label: 'Certificate' },
                    { key: 'auditor_name', label: 'Assigned Auditor' },
                    { key: 'cb_name', label: 'Assigned CB' },
                    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
                    { key: 'action', label: 'Action', render: (_, row) => (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/applications/${row.id}`)}>Manage</Button>
                    )}
                  ]}
                  data={adminApplications.slice(0, 5)}
                  emptyMessage="No applications found in the database."
                />
              )}
            </div>
          </div>
        </>
      ) : isAuditor ? (
        <>
          <div className="dashboard__stats">
            <StatCard title="Total Assigned" value={auditorApplications.length} icon={UserCheck} iconColor="#A78BFA" />
            <StatCard title="In Review" value={auditorApplications.filter(a => a.status === 'in_review').length} icon={Clock} iconColor="#FBBF24" />
            <StatCard title="Completed" value={auditorApplications.filter(a => a.status === 'audited').length} icon={CheckCircle2} iconColor="#3ECF8E" />
          </div>
          <div className="dashboard__grid" style={{ display: 'block' }}>
            <div className="dashboard__section">
              <div className="dashboard__section-header">
                <h2 className="dashboard__section-title">My Assigned Applications</h2>
              </div>
              {fetchingApps ? (
                <p>Loading applications...</p>
              ) : (
                <DataTable
                  columns={[
                    { key: 'company_name', label: 'Company' },
                    { key: 'scope', label: 'Scope', render: (val) => val || '—' },
                    { key: 'recommended_iso', label: 'Standard' },
                    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
                    { key: 'created_at', label: 'Date', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
                    { key: 'action', label: 'Action', render: (_, row) => (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/applications/${row.id}`)}>Manage</Button>
                    )}
                  ]}
                  data={auditorApplications}
                  emptyMessage="No applications assigned to you yet."
                />
              )}
            </div>
          </div>
        </>
      ) : isCB ? (
        <>
          <div className="dashboard__stats">
            <StatCard title="Assigned Applications" value={cbApplications.length} icon={Building2} iconColor="#3ECF8E" />
            <StatCard title="Awaiting Decision" value={cbApplications.filter(a => a.status === 'audited' || a.status === 'in_review').length} icon={Clock} iconColor="#FBBF24" />
            <StatCard title="Certified" value={cbApplications.filter(a => a.status === 'approved').length} icon={CheckCircle2} iconColor="#60A5FA" />
          </div>
          <div className="dashboard__grid" style={{ display: 'block' }}>
            <div className="dashboard__section">
              <div className="dashboard__section-header">
                <h2 className="dashboard__section-title">My Assigned Applications</h2>
              </div>
              {fetchingApps ? (
                <p>Loading applications...</p>
              ) : (
                <DataTable
                  columns={[
                    { key: 'company_name', label: 'Company' },
                    { key: 'scope', label: 'Scope', render: (val) => val || '—' },
                    { key: 'recommended_iso', label: 'Standard' },
                    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
                    { key: 'created_at', label: 'Date', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
                    { key: 'action', label: 'Action', render: (_, row) => (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/applications/${row.id}`)}>Review</Button>
                    )}
                  ]}
                  data={cbApplications}
                  emptyMessage="No applications assigned to your certification body yet."
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
