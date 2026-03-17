import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input, Button } from '../../components/ui/FormElements';
import { AlertCircle, CheckCircle } from 'lucide-react';
import './Auth.css';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await resetPassword(email);
    if (result.success) {
      setSent(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="auth-form">
        <div className="auth-form__success-icon">
          <CheckCircle size={48} />
        </div>
        <h2 className="auth-form__title">Check your email</h2>
        <p className="auth-form__subtitle">
          We've sent a password reset link to <strong>{email}</strong>
        </p>
        <Link to="/login">
          <Button variant="secondary" size="md" fullWidth>
            Back to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2 className="auth-form__title">Reset your password</h2>
      <p className="auth-form__subtitle">
        Enter your email and we'll send you a reset link
      </p>

      <form onSubmit={handleSubmit} className="auth-form__body">
        <Input
          label="Email"
          type="email"
          id="forgot-email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Send Reset Link
        </Button>
      </form>

      <p className="auth-form__footer-text">
        Remember your password? <Link to="/login" className="auth-form__link">Sign In</Link>
      </p>
    </div>
  );
}
