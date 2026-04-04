import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Input, Select, Textarea, Button } from '../../components/ui/FormElements';
import './ApplicationForm.css';

const INDUSTRIES = [
  'Manufacturing',
  'IT & Software',
  'Construction',
  'Healthcare',
  'Food & Beverage',
  'Logistics'
];

/** Parse employee range string (e.g. "51-200") into a representative number */
function parseEmployeeRange(range) {
  if (!range) return '';
  if (range.includes('+')) return range.replace('+', '');
  const parts = range.split('-');
  if (parts.length === 2) {
    return String(Math.round((parseInt(parts[0], 10) + parseInt(parts[1], 10)) / 2));
  }
  return range;
}

export default function ApplicationForm() {
  const { user, getRoleDashboard } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPackage = location.state?.package || null;

  const meta = user?.user_metadata || {};

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    scope: '',
    employeeCount: parseEmployeeRange(meta.number_of_employees) || '',
    locationsCount: meta.number_of_locations || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const submittedCompanyName = user?.company_name || formData.companyName;

    if (!submittedCompanyName || !formData.industry || !formData.scope || !formData.employeeCount || !formData.locationsCount) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const { error: submitError } = await supabase
        .from('applications')
        .insert({
          client_id: user.id,
          company_name: submittedCompanyName,
          industry: formData.industry,
          scope: formData.scope,
          employee_count: parseInt(formData.employeeCount, 10),
          locations_count: parseInt(formData.locationsCount, 10),
          status: 'pending',
          selected_package: selectedPackage || 'Standard'
        });

      if (submitError) throw submitError;

      if (!user?.company_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ company_name: formData.companyName })
          .eq('id', user.id);
          
        if (profileError) {
          console.error('Failed to update profile company name:', profileError);
        }
        
        // Force reload to update context and navigate
        window.location.href = getRoleDashboard(user?.role);
        return;
      }

      navigate(getRoleDashboard(user?.role));
    } catch (err) {
      console.error('Application submission error:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">New ISO Certification Application</h1>
          <p className="page-subtitle">Provide details about your organization to get started.</p>
        </div>
      </div>

      <div className="application-form__container">
        <form className="application-form" onSubmit={handleSubmit}>
          {selectedPackage && (
            <div className="alert alert-info" style={{ 
              marginBottom: '20px', 
              display: 'flex', 
              gap: '8px', 
              alignItems: 'center', 
              background: 'rgba(59, 130, 246, 0.1)', 
              color: 'var(--color-accent)', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <CheckCircle2 size={18}/> 
              <span>You are applying for the <strong style={{ fontWeight: 700 }}>{selectedPackage}</strong> package.</span>
            </div>
          )}
          {error && <div className="application-form__error">{error}</div>}
          
          <div className="application-form__row">
            {!user?.company_name && (
              <Input
                id="companyName"
                label="Company Name"
                placeholder="Enter your company name"
                value={formData.companyName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            )}

            <div style={user?.company_name ? { gridColumn: '1 / -1' } : {}}>
              <Select
                id="industry"
                label="Industry"
                value={formData.industry}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="" disabled>Select your industry</option>
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </Select>
            </div>
          </div>

          <Textarea
            id="scope"
            label="Scope of Operations"
            placeholder="Describe your daily business operations"
            rows={4}
            value={formData.scope}
            onChange={handleChange}
            required
            disabled={loading}
          />

          <div className="application-form__row">
            <Input
              id="employeeCount"
              label="Employee Count"
              type="number"
              min="1"
              placeholder="e.g. 50"
              value={formData.employeeCount}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <Input
              id="locationsCount"
              label="Number of Locations"
              type="number"
              min="1"
              placeholder="e.g. 2"
              value={formData.locationsCount}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="application-form__actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(getRoleDashboard(user?.role))}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} variant="primary">
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
