import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import StatusBadge from '../../components/ui/StatusBadge';
import { Button, Select } from '../../components/ui/FormElements';
import { ArrowLeft, CheckCircle, FileText, Download, Building, Users, Target, Activity } from 'lucide-react';
import './ApplicationDetails.css';

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState(null);
  const [auditors, setAuditors] = useState([]);
  const [cbs, setCbs] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Form states
  const [status, setStatus] = useState('');
  const [assignedAuditor, setAssignedAuditor] = useState('');
  const [assignedCb, setAssignedCb] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch App + Client
        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select('*, profiles!client_id(full_name, email, phone)')
          .eq('id', id)
          .single();
          
        if (appError) throw appError;

        // 2. Fetch Auditors
        const { data: audData, error: audError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'auditor');

        // 3. Fetch CBs
        const { data: cbData, error: cbError } = await supabase
          .from('certification_bodies')
          .select('id, name')
          .eq('status', 'active');

        // 4. Fetch Documents
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('application_id', id);

        if (appData) {
          setApplication(appData);
          setStatus(appData.status || 'pending');
          setAssignedAuditor(appData.assigned_auditor_id || '');
          setAssignedCb(appData.assigned_cb_id || '');
          setInternalNotes(appData.internal_notes || '');
        }
        
        if (audData) setAuditors(audData);
        if (cbData) setCbs(cbData);
        if (docData) setDocuments(docData);

      } catch (err) {
        console.error('Error fetching application details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status,
          assigned_auditor_id: assignedAuditor || null,
          assigned_cb_id: assignedCb || null,
          internal_notes: internalNotes
        })
        .eq('id', id);
        
      if (error) throw error;

      setApplication(prev => ({
        ...prev,
        status,
        assigned_auditor_id: assignedAuditor || null,
        assigned_cb_id: assignedCb || null,
        internal_notes: internalNotes
      }));

      setToast('Application updated successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error updating application', err);
      alert('Failed to update application');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const { data, error } = await supabase.storage
        .from('application-documents')
        .download(doc.file_path);
        
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

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading application details...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="page-container">
        <p>Application not found.</p>
        <Button variant="outline" onClick={() => navigate('/certification-requests')}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      {toast && (
        <div className="cert-request__toast">
          <CheckCircle size={16} />
          <span>{toast}</span>
        </div>
      )}

      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex' }}>
        <button className="back-btn" onClick={() => navigate('/certification-requests')}>
          <ArrowLeft size={16} /> Back to Requests
        </button>
      </div>
      
      <div className="app-details-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>{application.company_name}</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Application ID: #{application.id.slice(0, 8)}</p>
        </div>
        <div>
          <StatusBadge status={application.status} />
        </div>
      </div>

      <div className="app-details-grid">
        {/* LEFT CARD: Client Details */}
        <div className="app-card">
          <h3 className="app-card-title">Client Details</h3>
          <div className="details-list">
            <div className="detail-item">
              <Building size={16} className="detail-icon" />
              <div>
                <label>Industry</label>
                <p>{application.industry || '—'}</p>
              </div>
            </div>
            <div className="detail-item">
              <Target size={16} className="detail-icon" />
              <div>
                <label>Scope</label>
                <p>{application.scope || '—'}</p>
              </div>
            </div>
            <div className="detail-item">
              <Users size={16} className="detail-icon" />
              <div>
                <label>Employees</label>
                <p>{application.employees || '—'}</p>
              </div>
            </div>
            <div className="detail-item">
              <Activity size={16} className="detail-icon" />
              <div>
                <label>Gap Score</label>
                <p>{application.gap_score !== null ? `${application.gap_score}%` : '—'}</p>
              </div>
            </div>
            <div className="detail-item">
              <FileText size={16} className="detail-icon" />
              <div>
                <label>Selected Package</label>
                <p>{application.selected_package ? application.selected_package.replace(/_/g, ' ') : '—'}</p>
              </div>
            </div>
          </div>
          
          <div className="contact-info">
            <h4>Contact Information</h4>
            <p><strong>Name:</strong> {application.profiles?.full_name || '—'}</p>
            <p><strong>Email:</strong> {application.profiles?.email || '—'}</p>
            <p><strong>Phone:</strong> {application.profiles?.phone || '—'}</p>
          </div>
        </div>

        {/* RIGHT CARD: Workflow Controls */}
        <div className="app-card">
          <h3 className="app-card-title">Workflow Controls</h3>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Application Status</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="awaiting_payment">Awaiting Payment</option>
              <option value="in_review">In Review</option>
              <option value="audit_scheduled">Audit Scheduled</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Assign Auditor</label>
            <Select value={assignedAuditor} onChange={(e) => setAssignedAuditor(e.target.value)}>
              <option value="">-- Select Auditor --</option>
              {auditors.map(aud => (
                <option key={aud.id} value={aud.id}>{aud.full_name}</option>
              ))}
            </Select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Assign Certification Body</label>
            <Select value={assignedCb} onChange={(e) => setAssignedCb(e.target.value)}>
              <option value="">-- Select Certification Body --</option>
              {cbs.map(cb => (
                <option key={cb.id} value={cb.id}>{cb.name}</option>
              ))}
            </Select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Internal Notes</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add admin notes here... (Not visible to client)"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full" style={{ width: '100%', justifyContent: 'center' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* BOTTOM SECTION: Documents */}
      <div className="app-card" style={{ marginTop: '1.5rem' }}>
        <h3 className="app-card-title">Uploaded Documents</h3>
        {documents.length === 0 ? (
          <p className="no-docs">No documents attached to this application.</p>
        ) : (
          <div className="documents-list">
            {documents.map(doc => (
              <div key={doc.id} className="document-item">
                <div className="doc-info">
                  <FileText size={20} className="doc-icon" />
                  <span>{doc.file_name || doc.name || 'Document'}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                  <Download size={14} /> Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
