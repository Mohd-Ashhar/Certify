import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function ApplicationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    scope: '',
    employeeCount: '',
    locationsCount: ''
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

    if (!formData.companyName || !formData.industry || !formData.scope || !formData.employeeCount || !formData.locationsCount) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const { error: submitError } = await supabase
        .from('applications')
        .insert({
          client_id: user.id,
          company_name: formData.companyName,
          industry: formData.industry,
          scope: formData.scope,
          employee_count: parseInt(formData.employeeCount, 10),
          locations_count: parseInt(formData.locationsCount, 10),
          status: 'pending'
        });

      if (submitError) throw submitError;

      navigate('/client/dashboard');
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
          {error && <div className="application-form__error">{error}</div>}
          
          <Input
            id="companyName"
            label="Company Name"
            placeholder="Enter your company name"
            value={formData.companyName}
            onChange={handleChange}
            required
            disabled={loading}
          />

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
              onClick={() => navigate('/client/dashboard')}
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
