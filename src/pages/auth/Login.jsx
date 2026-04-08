import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input, Button } from '../../components/ui/FormElements';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const { login, signInWithGoogle, getRoleDashboard, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate(getRoleDashboard(user.role));
    }
  }, [authLoading, user, navigate, getRoleDashboard]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
    // If login succeeds, the auth state listener will redirect via useEffect.
    // But we also need to check approval_status — handled in AuthContext.
  };

  return (
    <div className="auth-form">
      <h2 className="auth-form__title">Welcome back</h2>
      <p className="auth-form__subtitle">Sign in to your Certify.cx<sup className="brand-tm">™</sup> account</p>

      {error && (
        <div className="auth-form__error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

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
        {googleLoading ? 'Redirecting...' : 'Continue with Google'}
      </button>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <form onSubmit={handleSubmit} className="auth-form__body">
        <Input
          label="Email"
          type="email"
          id="login-email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          id="login-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          rightElement={
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: '4px' }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <div className="auth-form__actions">
          <Link to="/forgot-password" className="auth-form__link">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Sign In
        </Button>
      </form>

      <p className="auth-form__footer-text">
        Don't have an account? <Link to="/signup" className="auth-form__link">Apply for Certification</Link>
      </p>
    </div>
  );
}
