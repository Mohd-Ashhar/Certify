import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input, Select, Button, Autocomplete } from '../../components/ui/FormElements';
import { REGIONS } from '../../utils/roles';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

const ISO_STANDARDS = [
  { value: 'ISO 9001', label: 'ISO 9001 — Quality Management' },
  { value: 'ISO 14001', label: 'ISO 14001 — Environmental Management' },
  { value: 'ISO 45001', label: 'ISO 45001 — Health & Safety' },
  { value: 'ISO 22000', label: 'ISO 22000 — Food Safety' },
];

const EMPLOYEE_RANGES = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+',
];

const COUNTRY_DIAL_CODES = [
  { code: '+971', label: 'UAE (+971)' },
  { code: '+966', label: 'Saudi Arabia (+966)' },
  { code: '+1', label: 'USA/Canada (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+81', label: 'Japan (+81)' },
];

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 — Company
    company_name: '',
    activity: '',
    number_of_employees: '',
    number_of_locations: '',
    website: '',
    city: '',
    country: '',
    // Step 2 — Contact & Certs
    contact_person_name: '',
    contact_code: '+971',
    contact_number: '',
    email: '',
    certification_types: [],
    // Step 3 — Password
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleCert = (val) => {
    setFormData(prev => ({
      ...prev,
      certification_types: prev.certification_types.includes(val)
        ? prev.certification_types.filter(v => v !== val)
        : [...prev.certification_types, val],
    }));
  };

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.company_name || !formData.activity || !formData.city || !formData.country) {
        setError('Please fill in all required company fields');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.contact_person_name || !formData.email || !formData.contact_number) {
        setError('Please fill in all contact fields');
        return false;
      }
      if (formData.certification_types.length === 0) {
        setError('Please select at least one certification type');
        return false;
      }
    }
    if (step === 3) {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(s => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    const result = await signup({
      name: formData.contact_person_name,
      email: formData.email,
      password: formData.password,
      company_name: formData.company_name,
      activity: formData.activity,
      number_of_employees: formData.number_of_employees,
      number_of_locations: formData.number_of_locations,
      website: formData.website,
      city: formData.city,
      country: formData.country,
      contact_number: `${formData.contact_code} ${formData.contact_number}`,
      certification_types: formData.certification_types,
    });

    if (result.success) {
      navigate('/client/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-form auth-form--wide">
      <h2 className="auth-form__title">Apply for Certification</h2>
      <p className="auth-form__subtitle">Start your ISO certification journey</p>

      {/* Step indicator */}
      <div className="signup-steps">
        {['Company Info', 'Contact & Certs', 'Create Account'].map((label, i) => (
          <div key={label} className={`signup-steps__item ${step > i + 1 ? 'signup-steps__item--done' : ''} ${step === i + 1 ? 'signup-steps__item--active' : ''}`}>
            <div className="signup-steps__circle">
              {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className="signup-steps__label">{label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="auth-form__error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form__body">
        {/* ---- Step 1: Company ---- */}
        {step === 1 && (
          <>
            <Input label="Company Name *" id="signup-company" name="company_name"
              placeholder="Your company name" value={formData.company_name}
              onChange={handleChange} required />

            <Input label="Business Activity *" id="signup-activity" name="activity"
              placeholder="e.g. Manufacturing, IT Services"
              value={formData.activity} onChange={handleChange} required />

            <div className="auth-form__row">
              <Select label="Number of Employees" id="signup-employees" name="number_of_employees"
                value={formData.number_of_employees} onChange={handleChange}>
                <option value="">Select range</option>
                {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
              </Select>

              <Input label="Number of Locations" id="signup-locations" name="number_of_locations"
                type="number" placeholder="e.g. 3"
                value={formData.number_of_locations} onChange={handleChange} />
            </div>

            <Input label="Website" id="signup-website" name="website"
              placeholder="https://yourcompany.com"
              value={formData.website} onChange={handleChange} />

            <div className="auth-form__row">
              <Autocomplete label="City *" id="signup-city" name="city"
                placeholder="Dubai" value={formData.city} freeSolo
                options={['Dubai', 'Abu Dhabi', 'Sharjah', 'Riyadh', 'Jeddah', 'Dammam', 'London', 'New York', 'Sydney', 'Singapore', 'Paris', 'Berlin', 'Tokyo']}
                onChange={handleChange} required />

              <Autocomplete label="Country *" id="signup-country" name="country"
                placeholder="United Arab Emirates" freeSolo
                options={['United Arab Emirates', 'Saudi Arabia', 'United States', 'United Kingdom', 'India', 'Australia', 'Singapore', 'France', 'Germany', 'Japan']}
                value={formData.country} onChange={handleChange} required />
            </div>

            <Button type="button" variant="primary" size="lg" fullWidth onClick={handleNext}>
              Continue →
            </Button>
          </>
        )}

        {/* ---- Step 2: Contact & Certs ---- */}
        {step === 2 && (
          <>
            <Input label="Contact Person Name *" id="signup-contact-name" name="contact_person_name"
              placeholder="Full name" value={formData.contact_person_name}
              onChange={handleChange} required />

            <Input label="Email *" type="email" id="signup-email" name="email"
              placeholder="you@company.com" value={formData.email}
              onChange={handleChange} required />

            <div className="form-group">
              <label className="form-label" htmlFor="signup-phone">Contact Number *</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select 
                  className="form-select" 
                  style={{ flex: '1 1 120px', minWidth: '120px' }} 
                  name="contact_code" 
                  value={formData.contact_code} 
                  onChange={handleChange}
                >
                  {COUNTRY_DIAL_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <div style={{ flex: 1 }}>
                  <input 
                    className="form-input" 
                    id="signup-phone" 
                    name="contact_number" 
                    placeholder="50 123 4567" 
                    value={formData.contact_number} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Certification Types *</label>
              <div className="cert-multi-select">
                {ISO_STANDARDS.map((std) => (
                  <label key={std.value} className={`cert-multi-select__item ${formData.certification_types.includes(std.value) ? 'cert-multi-select__item--selected' : ''}`}>
                    <input type="checkbox" checked={formData.certification_types.includes(std.value)}
                      onChange={() => toggleCert(std.value)} />
                    <span>{std.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="auth-form__row">
              <Button type="button" variant="secondary" size="lg" fullWidth onClick={handleBack}>
                ← Back
              </Button>
              <Button type="button" variant="primary" size="lg" fullWidth onClick={handleNext}>
                Continue →
              </Button>
            </div>
          </>
        )}

        {/* ---- Step 3: Account ---- */}
        {step === 3 && (
          <>
            <div className="signup-summary">
              <p><strong>Company:</strong> {formData.company_name}</p>
              <p><strong>Contact:</strong> {formData.contact_person_name} ({formData.email})</p>
              <p><strong>Certifications:</strong> {formData.certification_types.join(', ')}</p>
            </div>

            <Input label="Password *" type={showPassword ? "text" : "password"} id="signup-password" name="password"
              placeholder="Min 6 characters" value={formData.password}
              onChange={handleChange} required 
              rightElement={
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: '4px' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <Input label="Confirm Password *" type={showConfirmPassword ? "text" : "password"} id="signup-confirm" name="confirmPassword"
              placeholder="Re-enter password" value={formData.confirmPassword}
              onChange={handleChange} required 
              rightElement={
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: '4px' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <div className="auth-form__row">
              <Button type="button" variant="secondary" size="lg" fullWidth onClick={handleBack}>
                ← Back
              </Button>
              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                Create Account
              </Button>
            </div>
          </>
        )}
      </form>

      <p className="auth-form__footer-text">
        Already have an account? <Link to="/login" className="auth-form__link">Sign In</Link>
      </p>
    </div>
  );
}
