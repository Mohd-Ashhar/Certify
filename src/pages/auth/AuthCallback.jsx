import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthCallback() {
  const { user, loading, getRoleDashboard } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(getRoleDashboard(user.role), { replace: true });
    } else if (!loading && !user) {
      // OAuth failed or was cancelled
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate, getRoleDashboard]);

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
      <div className="auth-callback-spinner" />
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
        Signing you in...
      </p>
    </div>
  );
}
