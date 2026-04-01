import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import StatusBadge from '../../components/ui/StatusBadge';
import { Button, Select } from '../../components/ui/FormElements';
import { ArrowLeft, CheckCircle, FileText, Download, Building, Users, Target, Activity, Globe, ClipboardCheck, XCircle, CheckCircle2, AlertCircle, Award, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, REGIONS } from '../../utils/roles';
import './ApplicationDetails.css';

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAssign = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.REGIONAL_ADMIN;
  const isRegionalAdmin = user?.role === ROLES.REGIONAL_ADMIN;
  const isAuditor = user?.role === ROLES.AUDITOR;
  const isCB = user?.role === ROLES.CERTIFICATION_BODY;

  const [application, setApplication] = useState(null);
  const [auditors, setAuditors] = useState([]);
  const [cbs, setCbs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [auditReport, setAuditReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Admin form states
  const [status, setStatus] = useState('');
  const [assignedAuditor, setAssignedAuditor] = useState('');
  const [assignedCb, setAssignedCb] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Auditor form states
  const [auditDecision, setAuditDecision] = useState('');
  const [auditComment, setAuditComment] = useState('');
  const [submittingAudit, setSubmittingAudit] = useState(false);
  const [reviewComments, setReviewComments] = useState({});

  // CB form states
  const [cbComment, setCbComment] = useState('');
  const [submittingCbDecision, setSubmittingCbDecision] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select('*, client:profiles!client_id(full_name, email, region)')
          .eq('id', id)
          .single();

        if (appError) throw appError;

        const regionFilter = isRegionalAdmin ? user.region : null;

        let audQuery = supabase.from('profiles').select('id, full_name, region').eq('role', ROLES.AUDITOR);
        if (regionFilter) audQuery = audQuery.eq('region', regionFilter);
        const { data: audData } = await audQuery;

        let cbQuery = supabase.from('profiles').select('id, full_name, region').eq('role', ROLES.CERTIFICATION_BODY);
        if (regionFilter) cbQuery = cbQuery.eq('region', regionFilter);
        const { data: cbData } = await cbQuery;

        const { data: docData } = await supabase
          .from('documents')
          .select('*')
          .eq('application_id', id)
          .order('uploaded_at', { ascending: false });

        // Fetch audit report for this application
        const { data: reportData } = await supabase
          .from('reports')
          .select('*, auditor:profiles!auditor_id(full_name)')
          .eq('application_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (appData) {
          setApplication(appData);
          setStatus(appData.status || 'pending');
          setAssignedAuditor(appData.assigned_auditor_id || '');
          setAssignedCb(appData.assigned_cb_id || '');
          setInternalNotes(appData.internal_notes || '');
        }

        if (audData) setAuditors(audData);
        if (cbData) setCbs(cbData);
        if (reportData) setAuditReport(reportData);
        if (docData) {
          setDocuments(docData);
          const comments = {};
          docData.forEach(d => { comments[d.id] = d.reviewer_comment || ''; });
          setReviewComments(comments);
        }

      } catch (err) {
        console.error('Error fetching application details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, user, isRegionalAdmin]);

  // --- Admin Save ---
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status, assigned_auditor_id: assignedAuditor || null, assigned_cb_id: assignedCb || null, internal_notes: internalNotes })
        .eq('id', id);
      if (error) throw error;
      setApplication(prev => ({ ...prev, status, assigned_auditor_id: assignedAuditor || null, assigned_cb_id: assignedCb || null, internal_notes: internalNotes }));
      showToast('Application updated successfully');
    } catch (err) {
      console.error('Error updating application', err);
      alert('Failed to update application');
    } finally { setSaving(false); }
  };

  // --- Auditor: Review Document ---
  const handleDocumentReview = async (docId, newStatus) => {
    try {
      const { error } = await supabase.from('documents').update({ status: newStatus, reviewer_comment: reviewComments[docId] || null }).eq('id', docId);
      if (error) throw error;
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: newStatus, reviewer_comment: reviewComments[docId] || null } : d));
      showToast(`Document ${newStatus}`);
    } catch (err) {
      console.error('Error reviewing document:', err);
      alert('Failed to update document status');
    }
  };

  // --- Auditor: Submit Audit ---
  const handleSubmitAudit = async () => {
    if (!auditDecision) { alert('Please select an audit decision'); return; }
    setSubmittingAudit(true);
    try {
      const { error: reportError } = await supabase.from('reports').upsert({
        application_id: id, auditor_id: user.id, status: auditDecision, report_url: auditComment || null,
      }, { onConflict: 'application_id,auditor_id', ignoreDuplicates: false });

      if (reportError) {
        const { error: insertError } = await supabase.from('reports').insert({
          application_id: id, auditor_id: user.id, status: auditDecision, report_url: auditComment || null,
        });
        if (insertError) throw insertError;
      }

      const { error: appError } = await supabase.from('applications').update({ status: 'audited' }).eq('id', id);
      if (appError) throw appError;

      setApplication(prev => ({ ...prev, status: 'audited' }));
      setStatus('audited');
      showToast('Audit submitted successfully');
    } catch (err) {
      console.error('Error submitting audit:', err);
      alert('Failed to submit audit: ' + err.message);
    } finally { setSubmittingAudit(false); }
  };

  // --- CB: Certification Decision ---
  const handleCbDecision = async (decision) => {
    setSubmittingCbDecision(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: decision, internal_notes: cbComment ? `[CB Decision] ${cbComment}` : undefined })
        .eq('id', id);

      if (error) throw error;

      setApplication(prev => ({ ...prev, status: decision }));
      setStatus(decision);
      showToast(`Application ${decision === 'approved' ? 'certified' : 'rejected'} successfully`);
    } catch (err) {
      console.error('Error submitting CB decision:', err);
      alert('Failed to submit decision: ' + err.message);
    } finally { setSubmittingCbDecision(false); }
  };

  const handleDownload = async (doc) => {
    try {
      const { data, error } = await supabase.storage.from('application-documents').download(doc.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name || 'document';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading document', err);
      alert('Failed to download document');
    }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const getRegionLabel = (regionId) => {
    if (!regionId) return '—';
    const r = REGIONS.find(reg => reg.id === regionId);
    return r ? r.label : regionId;
  };

  const getDocStatusColor = (s) => {
    if (s === 'approved') return 'var(--color-accent, #3ECF8E)';
    if (s === 'rejected') return '#ef4444';
    return 'var(--color-text-tertiary)';
  };

  const getAuditDecisionLabel = (s) => {
    if (s === 'approved') return 'Approved';
    if (s === 'rejected') return 'Rejected';
    if (s === 'needs_changes') return 'Needs Changes';
    return s || '—';
  };

  if (loading) return <div className="page-container"><p>Loading application details...</p></div>;

  if (!application) {
    return (
      <div className="page-container">
        <p>Application not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const backPath = isAuditor ? '/auditor/dashboard' : isCB ? '/cert-body/dashboard' : '/admin/applications';
  const backLabel = isAuditor ? 'Back to Dashboard' : isCB ? 'Back to Dashboard' : 'Back to Applications';
  const alreadyCertified = application.status === 'approved' || application.status === 'rejected';

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      {toast && (
        <div className="cert-request__toast"><CheckCircle size={16} /><span>{toast}</span></div>
      )}

      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex' }}>
        <button className="back-btn" onClick={() => navigate(backPath)}>
          <ArrowLeft size={16} /> {backLabel}
        </button>
      </div>

      <div className="app-details-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>{application.company_name}</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Application ID: #{application.id.slice(0, 8)}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="app-details-grid">
        {/* LEFT CARD: Client Details */}
        <div className="app-card">
          <h3 className="app-card-title">Client Details</h3>
          <div className="details-list">
            <div className="detail-item"><Building size={16} className="detail-icon" /><div><label>Industry</label><p>{application.industry || '—'}</p></div></div>
            <div className="detail-item"><Target size={16} className="detail-icon" /><div><label>Scope</label><p>{application.scope || '—'}</p></div></div>
            <div className="detail-item"><Users size={16} className="detail-icon" /><div><label>Employees</label><p>{application.employee_count || '—'}</p></div></div>
            <div className="detail-item"><Globe size={16} className="detail-icon" /><div><label>Region</label><p>{getRegionLabel(application.client?.region)}</p></div></div>
            <div className="detail-item"><Activity size={16} className="detail-icon" /><div><label>Recommended ISO</label><p>{application.recommended_iso || '—'}</p></div></div>
            <div className="detail-item"><FileText size={16} className="detail-icon" /><div><label>Selected Package</label><p>{application.selected_package ? application.selected_package.replace(/_/g, ' ') : '—'}</p></div></div>
          </div>
          <div className="contact-info">
            <h4>Contact Information</h4>
            <p><strong>Name:</strong> {application.client?.full_name || '—'}</p>
            <p><strong>Email:</strong> {application.client?.email || '—'}</p>
          </div>
        </div>

        {/* RIGHT CARD: Role-specific controls */}
        <div className="app-card">

          {/* ===== AUDITOR CONTROLS ===== */}
          {isAuditor && (
            <>
              <h3 className="app-card-title">Audit Controls</h3>
              {application.status === 'audited' ? (
                <div className="audit-completed-banner"><CheckCircle2 size={20} /><span>Audit has been submitted for this application.</span></div>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Audit Decision *</label>
                    <Select value={auditDecision} onChange={(e) => setAuditDecision(e.target.value)}>
                      <option value="">-- Select Decision --</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="needs_changes">Needs Changes</option>
                    </Select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Auditor Comments</label>
                    <textarea className="form-textarea" rows={4} value={auditComment} onChange={(e) => setAuditComment(e.target.value)} placeholder="Add your audit findings and comments..." />
                  </div>
                  <Button variant="primary" onClick={handleSubmitAudit} disabled={submittingAudit || !auditDecision} className="w-full" style={{ width: '100%', justifyContent: 'center' }}>
                    <ClipboardCheck size={18} /> {submittingAudit ? 'Submitting...' : 'Submit Audit'}
                  </Button>
                </>
              )}
            </>
          )}

          {/* ===== CB CONTROLS ===== */}
          {isCB && (
            <>
              <h3 className="app-card-title">Certification Decision</h3>

              {/* Audit Report Summary */}
              <div className="cb-audit-summary">
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Auditor Report
                </h4>
                {auditReport ? (
                  <div className="cb-audit-report-card">
                    <div className="cb-report-row">
                      <span>Auditor</span>
                      <strong>{auditReport.auditor?.full_name || '—'}</strong>
                    </div>
                    <div className="cb-report-row">
                      <span>Decision</span>
                      <StatusBadge status={auditReport.status} label={getAuditDecisionLabel(auditReport.status)} />
                    </div>
                    {auditReport.report_url && (
                      <div className="cb-report-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span>Comments</span>
                        <p style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>{auditReport.report_url}</p>
                      </div>
                    )}
                    <div className="cb-report-row">
                      <span>Date</span>
                      <strong>{auditReport.created_at ? new Date(auditReport.created_at).toLocaleDateString() : '—'}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="cb-no-report">
                    <AlertCircle size={16} />
                    <span>No audit report submitted yet.</span>
                  </div>
                )}
              </div>

              {/* Certification Decision Actions */}
              {alreadyCertified ? (
                <div className="audit-completed-banner" style={application.status === 'rejected' ? { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#ef4444' } : {}}>
                  {application.status === 'approved' ? <Award size={20} /> : <XCircle size={20} />}
                  <span>Certification {application.status === 'approved' ? 'approved' : 'rejected'}.</span>
                </div>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: '1.25rem', marginTop: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Comments (optional)</label>
                    <textarea className="form-textarea" rows={3} value={cbComment} onChange={(e) => setCbComment(e.target.value)} placeholder="Add certification decision notes..." />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Button
                      variant="primary"
                      onClick={() => handleCbDecision('approved')}
                      disabled={submittingCbDecision}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <ShieldCheck size={18} /> {submittingCbDecision ? 'Processing...' : 'Approve Certification'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCbDecision('rejected')}
                      disabled={submittingCbDecision}
                      style={{ flex: 1, justifyContent: 'center', color: '#ef4444', borderColor: '#ef4444' }}
                    >
                      <XCircle size={18} /> Reject
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ===== ADMIN CONTROLS ===== */}
          {canAssign && (
            <>
              <h3 className="app-card-title">Workflow Controls</h3>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Application Status</label>
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="awaiting_payment">Awaiting Payment</option>
                  <option value="in_review">In Review</option>
                  <option value="audit_scheduled">Audit Scheduled</option>
                  <option value="audited">Audited</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                  Assign Auditor {isRegionalAdmin && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>({getRegionLabel(user.region)} only)</span>}
                </label>
                <Select value={assignedAuditor} onChange={(e) => setAssignedAuditor(e.target.value)}>
                  <option value="">-- Select Auditor --</option>
                  {auditors.map(aud => (
                    <option key={aud.id} value={aud.id}>{aud.full_name || aud.id.slice(0, 8)}{aud.region ? ` (${getRegionLabel(aud.region)})` : ''}</option>
                  ))}
                </Select>
              </div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                  Assign Certification Body {isRegionalAdmin && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>({getRegionLabel(user.region)} only)</span>}
                </label>
                <Select value={assignedCb} onChange={(e) => setAssignedCb(e.target.value)}>
                  <option value="">-- Select Certification Body --</option>
                  {cbs.map(cb => (
                    <option key={cb.id} value={cb.id}>{cb.full_name || cb.id.slice(0, 8)}{cb.region ? ` (${getRegionLabel(cb.region)})` : ''}</option>
                  ))}
                </Select>
              </div>
              {/* Audit Report visible to admin */}
              {auditReport && (
                <div className="cb-audit-summary" style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Auditor Report
                  </h4>
                  <div className="cb-audit-report-card">
                    <div className="cb-report-row">
                      <span>Auditor</span>
                      <strong>{auditReport.auditor?.full_name || '—'}</strong>
                    </div>
                    <div className="cb-report-row">
                      <span>Decision</span>
                      <StatusBadge status={auditReport.status} label={getAuditDecisionLabel(auditReport.status)} />
                    </div>
                    {auditReport.report_url && (
                      <div className="cb-report-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span>Comments</span>
                        <p style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>{auditReport.report_url}</p>
                      </div>
                    )}
                    <div className="cb-report-row">
                      <span>Date</span>
                      <strong>{auditReport.created_at ? new Date(auditReport.created_at).toLocaleDateString() : '—'}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Internal Notes</label>
                <textarea className="form-textarea" rows={4} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Add admin notes here... (Not visible to client)" />
              </div>
              <Button variant="primary" onClick={handleSave} disabled={saving} className="w-full" style={{ width: '100%', justifyContent: 'center' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* DOCUMENTS SECTION */}
      <div className="app-card" style={{ marginTop: '1.5rem' }}>
        <h3 className="app-card-title">{isAuditor ? 'Document Review' : 'Uploaded Documents'}</h3>
        {documents.length === 0 ? (
          <p className="no-docs">No documents attached to this application.</p>
        ) : (
          <div className="documents-review-list">
            {documents.map(doc => (
              <div key={doc.id} className="document-review-card">
                <div className="document-review-header">
                  <div className="doc-info">
                    <FileText size={20} className="doc-icon" />
                    <div>
                      <span className="doc-name">{doc.file_name || 'Document'}</span>
                      <span className="doc-meta">{doc.file_size || '—'} {doc.document_type ? `· ${doc.document_type}` : ''}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {doc.status && (
                      <span className="doc-status-badge" style={{ color: getDocStatusColor(doc.status) }}>
                        {doc.status === 'approved' && <CheckCircle2 size={14} />}
                        {doc.status === 'rejected' && <XCircle size={14} />}
                        {doc.status === 'pending' && <AlertCircle size={14} />}
                        {doc.status || 'pending'}
                      </span>
                    )}
                    {doc.file_path && (
                      <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}><Download size={14} /> Download</Button>
                    )}
                  </div>
                </div>

                {isAuditor && application.status !== 'audited' && (
                  <div className="document-review-actions">
                    <div style={{ flex: 1 }}>
                      <input className="form-input" style={{ width: '100%', fontSize: '0.8rem' }} placeholder="Add review comment (optional)..."
                        value={reviewComments[doc.id] || ''} onChange={(e) => setReviewComments(prev => ({ ...prev, [doc.id]: e.target.value }))} />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleDocumentReview(doc.id, 'approved')} style={{ color: 'var(--color-accent, #3ECF8E)', borderColor: 'var(--color-accent, #3ECF8E)' }}>
                      <CheckCircle2 size={14} /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDocumentReview(doc.id, 'rejected')} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                      <XCircle size={14} /> Reject
                    </Button>
                  </div>
                )}

                {doc.reviewer_comment && (
                  <div className="doc-reviewer-comment"><strong>Review comment:</strong> {doc.reviewer_comment}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
