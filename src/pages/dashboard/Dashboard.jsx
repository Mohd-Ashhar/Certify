import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileCheck2, Clock, UserCheck, Percent, PlusCircle, CheckCircle2, ChevronRight, Upload, FileText, AlertCircle, MessageSquare, Download, Trash2, Eye, XCircle, Award } from 'lucide-react';
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

const ISO_DOCS = {
  '9001': ['Quality Management System Manual', 'Quality Policy Statement', 'Documented Procedures', 'Process Flow Charts', 'Internal Audit Reports', 'Management Review Minutes'],
  '27001': ['Information Security Policy', 'Risk Assessment Report', 'Statement of Applicability', 'Security Procedures Manual', 'Asset Inventory', 'Business Continuity Plan'],
  '14001': ['Environmental Policy', 'Environmental Aspects Register', 'Legal Compliance Register', 'Environmental Management Program', 'Waste Management Procedures', 'Emergency Preparedness Plan'],
  '45001': ['OH&S Policy', 'Hazard Identification & Risk Assessment', 'Legal Compliance Register', 'Emergency Response Procedures', 'Incident Investigation Reports', 'Worker Consultation Records'],
  '22000': ['Food Safety Policy', 'HACCP Plan', 'Prerequisite Programs', 'Flow Diagrams', 'Hazard Analysis Records', 'Traceability Procedures'],
  '13485': ['Quality Manual for Medical Devices', 'Design & Development Files', 'Risk Management File', 'Regulatory Requirements Register', 'Complaint Handling Procedures', 'Post-Market Surveillance Records'],
};

function getRequiredDocsForISO(isoName) {
  if (!isoName) return [];
  for (const [key, docs] of Object.entries(ISO_DOCS)) {
    if (isoName.includes(key)) return docs;
  }
  return [];
}

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

  const [selectedAppId, setSelectedAppId] = useState(null);
  const activeApp = selectedAppId
    ? clientApplications.find(a => a.id === selectedAppId) || clientApplications[0]
    : clientApplications[0];

  useEffect(() => {
    if (!activeApp) return;
    const fetchDocs = async () => {
      setFetchingDocs(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('application_id', activeApp.id)
        .order('uploaded_at', { ascending: false });
      if (error) {
        console.error('Error fetching documents:', error);
      }
      if (data) setDocuments(data);
      setFetchingDocs(false);
    };
    fetchDocs();
  }, [activeApp]);

  const [docError, setDocError] = useState('');
  const [deletingDocId, setDeletingDocId] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeApp) return;
    setUploadingDoc(true);
    setDocError('');

    try {
      // 1. Create the document record first to get the ID
      const { data, error: insertError } = await supabase.from('documents').insert([{
        application_id: activeApp.id,
        client_id: user.id,
        file_name: file.name,
        file_size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      }]).select();

      if (insertError) throw insertError;

      if (data && data.length > 0) {
        const docRecord = data[0];
        // 2. Upload actual file to Supabase Storage
        const storagePath = `${activeApp.id}/${docRecord.id}`;
        const { error: uploadError } = await supabase.storage
          .from('application-documents')
          .upload(storagePath, file, { upsert: true });

        if (uploadError) {
          // Rollback the DB record if storage upload fails
          await supabase.from('documents').delete().eq('id', docRecord.id);
          throw uploadError;
        }

        setDocuments([docRecord, ...documents]);
      }
    } catch (err) {
      console.error('Document upload error:', err);
      setDocError('Failed to upload document: ' + (err.message || 'Unknown error'));
    }
    setUploadingDoc(false);
    e.target.value = '';
  };

  const handleDocDownload = async (doc) => {
    try {
      const storagePath = `${activeApp.id}/${doc.id}`;
      const { data, error } = await supabase.storage.from('application-documents').download(storagePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name || 'document';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading document:', err);
      setDocError('Failed to download document.');
    }
  };

  const handleDocView = async (doc) => {
    try {
      const storagePath = `${activeApp.id}/${doc.id}`;
      const { data, error } = await supabase.storage.from('application-documents').download(storagePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error viewing document:', err);
      setDocError('Failed to open document.');
    }
  };

  const handleDocDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.file_name}"?`)) return;
    setDeletingDocId(doc.id);
    setDocError('');
    try {
      // Delete from storage first
      const storagePath = `${activeApp.id}/${doc.id}`;
      await supabase.storage.from('application-documents').remove([storagePath]);

      // Delete the DB record
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      if (error) throw error;

      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      console.error('Error deleting document:', err);
      setDocError('Failed to delete document.');
    }
    setDeletingDocId(null);
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
              {user?.gap_analysis_score == null ? (
                <>
                  <FileCheck2 size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ marginBottom: '8px' }}>Take Your Free Gap Analysis</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Find out if your organization is ready for ISO certification.</p>
                  <Button onClick={() => navigate('/client/gap-analysis')}>Take Gap Analysis Quiz</Button>
                </>
              ) : user?.gap_analysis_score < 60 ? (
                <>
                  <AlertCircle size={48} color="var(--color-warning)" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ marginBottom: '8px' }}>Gap Analysis Completed</h3>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-warning)', margin: '12px 0' }}>
                    Your Score: {user.gap_analysis_score}%
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                    Your organization needs some foundational work before starting the certification process. Please contact our support team for guidance.
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ marginBottom: '8px' }}>You are ready for Certification!</h3>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', margin: '12px 0' }}>
                    Your Score: {user.gap_analysis_score}%
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                    Your organization demonstrates strong foundational practices. Choose a certification below to begin your journey.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px', textAlign: 'left' }}>
                    {[
                      { name: 'ISO 9001', desc: 'Quality Management' },
                      { name: 'ISO 14001', desc: 'Environmental Management' },
                      { name: 'ISO 27001', desc: 'Information Security' },
                      { name: 'ISO 45001', desc: 'Occupational Health & Safety' },
                      { name: 'ISO 22000', desc: 'Food Safety Management' },
                      { name: 'ISO 13485', desc: 'Medical Devices Quality' },
                    ].map(iso => (
                      <div key={iso.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <Award size={18} color="var(--color-success)" style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{iso.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{iso.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => navigate('/client/apply')}>Start Your Certification Application</Button>
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

                  {/* Required Documents Guidance */}
                  {activeApp.recommended_iso && (
                    <div className="dashboard__section" style={{ marginTop: '2rem' }}>
                      <div className="section-subtitle-container">
                        <FileCheck2 size={18}/> <h3 className="section-subtitle" style={{ margin: 0 }}>Required Documents for {activeApp.recommended_iso}</h3>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '12px 0' }}>
                        Please upload the following documents for your certification:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {getRequiredDocsForISO(activeApp.recommended_iso).map((docName, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <span style={{ color: 'var(--color-accent, #3ECF8E)' }}>&#x2022;</span> {docName}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

                    {docError && (
                      <div className="doc-error-banner">
                        <AlertCircle size={16} /> <span>{docError}</span>
                        <button onClick={() => setDocError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px' }}><XCircle size={14} /></button>
                      </div>
                    )}

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
                                <span>{new Date(doc.uploaded_at).toLocaleDateString()} • {doc.file_size}</span>
                              </div>
                            </div>
                            <div className="document-actions">
                              {doc.status && doc.status !== 'pending' && (
                                <span className={`doc-status-pill ${doc.status}`}>
                                  {doc.status === 'approved' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                  {doc.status}
                                </span>
                              )}
                              <button className="doc-action-btn" title="View" onClick={() => handleDocView(doc)}>
                                <Eye size={16} />
                              </button>
                              <button className="doc-action-btn" title="Download" onClick={() => handleDocDownload(doc)}>
                                <Download size={16} />
                              </button>
                              <button className="doc-action-btn delete" title="Delete" disabled={deletingDocId === doc.id} onClick={() => handleDocDelete(doc)}>
                                <Trash2 size={16} />
                              </button>
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
                      { key: 'created_at', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
                      { key: 'action', label: '', render: (_, row) => (
                        <Button size="sm" variant="outline" onClick={() => setSelectedAppId(row.id)}>
                          {row.id === activeApp?.id ? 'Viewing' : 'View'}
                        </Button>
                      )}
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
            <StatCard title="Total Applications" value={totalApplications} icon={Building2} iconColor="#3ECF8E" onClick={() => navigate('/admin/applications')} />
            <StatCard title="Approved" value={approvedCertifications} icon={FileCheck2} iconColor="#60A5FA" onClick={() => navigate('/admin/applications?status=approved')} />
            <StatCard title="Pending Processing" value={pendingProcessing} icon={Clock} iconColor="#FBBF24" onClick={() => navigate('/admin/applications?status=pending')} />
            <StatCard title="Active Review" value={activeReview} icon={UserCheck} iconColor="#A78BFA" onClick={() => navigate('/admin/applications?status=in_review')} />
            <StatCard title="Awaiting Payment" value={awaitingPayment} icon={Percent} iconColor="#F87171" onClick={() => navigate('/admin/applications?status=awaiting_payment')} />
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
