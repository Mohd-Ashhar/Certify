import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthCallback() {
  const { user, loading, getRoleDashboard, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Stakeholder registrations (referral/investor/consultancy) require admin approval.
      // Sign the user out and send them to login with a clear message so they aren't
      // dropped on a dashboard they can't use.
      if (user.approval_status === 'pending') {
        logout().finally(() => {
          navigate('/login?pending=1', { replace: true });
        });
        return;
      }
      if (user.approval_status === 'rejected') {
        logout().finally(() => {
          navigate('/login?rejected=1', { replace: true });
        });
        return;
      }
      navigate(getRoleDashboard(user.role), { replace: true });
    } else if (!loading && !user) {
      // OAuth failed or was cancelled
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate, getRoleDashboard, logout]);

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
      <div className="auth-callback-spinner" />
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
        Signing you in...
      </p>
    </div>
  );
}
