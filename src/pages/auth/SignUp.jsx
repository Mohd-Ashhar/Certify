import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input, Select, Button, Autocomplete } from '../../components/ui/FormElements';
import { REGIONS } from '../../utils/roles';
import { getStakeholderType } from '../../utils/stakeholderTypes';
import { supabase } from '../../lib/supabase';
import { AlertCircle, CheckCircle, Eye, EyeOff, Clock } from 'lucide-react';
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

const fetchGeoapifyOptions = async (text, type) => {
  try {
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
    const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&type=${type}&apiKey=${apiKey}`);
    const data = await res.json();
    if (data.features) {
      return [...new Set(data.features.map(f => f.properties.formatted))];
    }
    return [];
  } catch (error) {
    console.error('Geoapify error:', error);
    return [];
  }
};

export default function SignUp() {
  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';
  const registrationType = searchParams.get('type') || '';
  const stakeholderConfig = getStakeholderType(registrationType);
  const targetRole = stakeholderConfig?.role || 'client';
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 — Company
    company_name: '',
    activity: '',
    number_of_employees: '',
    number_of_locations: '',
    website: '',
    location: '',
    city: '',
    country: '',
    // Step 2 — Contact & Certs
    contact_person_name: '',
    contact_role: '',
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updates = { [name]: value };
      
      // Auto-fill country and extract city name if a complete location was selected
      if (name === 'location') {
        if (value && typeof value === 'string' && value.includes(',')) {
          const parts = value.split(',');
          const possibleCountry = parts[parts.length - 1].trim();
          const possibleCity = parts[0].trim();
          
          if (possibleCountry) updates.country = possibleCountry;
          if (possibleCity) updates.city = possibleCity;
        } else {
          // If manually typed without commas, treat the whole thing as city for now
          updates.city = value;
          updates.country = '';
        }
      }
      
      return { ...prev, ...updates };
    });
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
      if (!formData.company_name || !formData.activity || !formData.location) {
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
      contact_role: formData.contact_role,
      certification_types: formData.certification_types,
      referral_code: referralCode,
      role: targetRole,
      stakeholder_type: registrationType || 'client',
    });

    if (result.success) {
      if (result.needsApproval) {
        // Sign out immediately — user can't access dashboard until approved
        await supabase.auth.signOut();
        setPendingApproval(true);
        setLoading(false);
        return;
      }
      const dashboardMap = {
        auditor: '/auditor/dashboard',
        certification_body: '/cert-body/dashboard',
      };
      navigate(dashboardMap[targetRole] || '/client/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (pendingApproval) {
    return (
      <div className="auth-form">
        <div className="auth-form__pending">
          <Clock size={48} className="auth-form__pending-icon" />
          <h2 className="auth-form__title">Registration Submitted</h2>
          <p className="auth-form__subtitle" style={{ marginBottom: '12px' }}>
            Thank you for registering as {stakeholderConfig ? `a ${stakeholderConfig.singularTitle}` : 'a stakeholder'}!
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            Your registration is now under review. A CertifyCX administrator will verify your details and approve your account.
            You will be able to log in once your account has been approved.
          </p>
          <Link to="/login" className="auth-form__link" style={{ fontSize: 'var(--font-size-sm)' }}>Go to Login Page</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form auth-form--wide">
      <h2 className="auth-form__title">
        {stakeholderConfig ? `Register as ${stakeholderConfig.singularTitle}` : 'Apply for Certification'}
      </h2>
      <p className="auth-form__subtitle">
        {stakeholderConfig ? stakeholderConfig.description : 'Start your ISO certification journey'}
      </p>

      <button
        type="button"
        className="auth-google-btn"
        disabled={googleLoading}
        onClick={async () => {
          setGoogleLoading(true);
          setError('');
          const result = await signInWithGoogle();
          if (!result.success) {
            setError(result.error);
            setGoogleLoading(false);
          }
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
        </svg>
        {googleLoading ? 'Redirecting...' : 'Sign up with Google'}
      </button>

      <div className="auth-divider">
        <span>or fill in your details</span>
      </div>

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

            <Autocomplete label="Location *" id="signup-location" name="location"
              placeholder="e.g. Dubai, United Arab Emirates" freeSolo
              fetchOptions={(text) => fetchGeoapifyOptions(text, 'city')}
              value={formData.location} onChange={handleChange} required />

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

            <Input label="Designation / Role" id="signup-contact-role" name="contact_role"
              placeholder="e.g. Quality Manager, Director, CEO"
              value={formData.contact_role}
              onChange={handleChange} />

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
        {registrationType && (
          <> | <Link to={`/register/${registrationType}`} className="auth-form__link">Back to Info</Link></>
        )}
      </p>
    </div>
  );
}
