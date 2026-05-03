import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/roles';
import { getIsoBySlug } from '../../utils/isoCatalog';
import { PENDING_CHECKOUT_KEY } from '../public/StartCheckout';

// Read a pending checkout intent (set by /start-checkout) and resolve it into
// a navigation target with package/iso state. Returns null if there's nothing
// pending or the intent is malformed.
function consumePendingCheckout() {
  try {
    const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    const { tier, iso } = JSON.parse(raw);
    const isoConfig = iso ? getIsoBySlug(iso) : null;
    return {
      path: '/client/apply',
      state: {
        package: tier === 'standard' ? 'Standard' : (tier || 'Standard'),
        recommendedIso: isoConfig?.code || 'ISO 9001:2015',
      },
    };
  } catch {
    return null;
  }
}

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

      // Honour a pending /start-checkout intent — clients only.
      if (user.role === ROLES.CLIENT) {
        const pending = consumePendingCheckout();
        if (pending) {
          navigate(pending.path, { replace: true, state: pending.state });
          return;
        }
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
