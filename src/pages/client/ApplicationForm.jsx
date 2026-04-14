import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Input, Select, Textarea, Button } from '../../components/ui/FormElements';
import './ApplicationForm.css';

const INDUSTRIES = [
  { value: 'Manufacturing', key: 'manufacturing' },
  { value: 'IT & Software', key: 'itSoftware' },
  { value: 'Construction', key: 'construction' },
  { value: 'Healthcare', key: 'healthcare' },
  { value: 'Food & Beverage', key: 'foodBeverage' },
  { value: 'Logistics', key: 'logistics' },
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
  const { t } = useTranslation();
  const location = useLocation();
  const selectedPackage = location.state?.package || null;

  const meta = user?.user_metadata || {};
  const prefilledEmployees = parseEmployeeRange(meta.number_of_employees);
  const prefilledLocations = meta.number_of_locations ? String(meta.number_of_locations) : '';
  const hasPrefilledEmployees = Boolean(prefilledEmployees);
  const hasPrefilledLocations = Boolean(prefilledLocations);

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    scope: '',
    employeeCount: prefilledEmployees || '',
    locationsCount: prefilledLocations || ''
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
      setError(t('application.fillAllFields'));
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
          <h1 className="page-title">{t('application.title')}</h1>
          <p className="page-subtitle">{t('application.subtitle')}</p>
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
              <span>{t('application.applyingFor', { package: selectedPackage })}</span>
            </div>
          )}
          {error && <div className="application-form__error">{error}</div>}
          
          <div className="application-form__row">
            {!user?.company_name && (
              <Input
                id="companyName"
                label={t('application.companyName')}
                placeholder={t('application.companyNamePlaceholder')}
                value={formData.companyName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            )}

            <div style={user?.company_name ? { gridColumn: '1 / -1' } : {}}>
              <Select
                id="industry"
                label={t('application.industry')}
                value={formData.industry}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="" disabled>{t('application.selectIndustry')}</option>
                {INDUSTRIES.map(ind => (
                  <option key={ind.value} value={ind.value}>
                    {t(`application.industries.${ind.key}`)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <Textarea
            id="scope"
            label={t('application.scopeOfOps')}
            placeholder={t('application.scopePlaceholder')}
            rows={4}
            value={formData.scope}
            onChange={handleChange}
            required
            disabled={loading}
          />

          {(!hasPrefilledEmployees || !hasPrefilledLocations) && (
            <div className="application-form__row">
              {!hasPrefilledEmployees && (
                <Input
                  id="employeeCount"
                  label={t('application.employeeCount')}
                  type="number"
                  min="1"
                  placeholder="e.g. 50"
                  value={formData.employeeCount}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              )}

              {!hasPrefilledLocations && (
                <Input
                  id="locationsCount"
                  label={t('application.locationsCount')}
                  type="number"
                  min="1"
                  placeholder="e.g. 2"
                  value={formData.locationsCount}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              )}
            </div>
          )}

          <div className="application-form__actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(getRoleDashboard(user?.role))}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={loading} variant="primary">
              {t('application.submitApplication')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
