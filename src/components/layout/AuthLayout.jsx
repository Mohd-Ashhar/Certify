import { Outlet, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import './AuthLayout.css';

export default function AuthLayout() {
  const location = useLocation();
  const isWide = location.pathname === '/signup' || location.pathname === '/client/apply';
  const hasType = new URLSearchParams(location.search).get('type');
  const isExtraWide = isWide && hasType;

  return (
    <div className="auth-layout">
      <div className={`auth-layout__container ${isWide ? 'auth-layout__container--wide' : ''} ${isExtraWide ? 'auth-layout__container--extra-wide' : ''}`}>
        <div className="auth-layout__logo">
          <div className="auth-layout__logo-icon">
            <Shield size={28} />
          </div>
          <span className="auth-layout__logo-text">Certify.cx<sup className="brand-tm">™</sup></span>
        </div>
        <div className="auth-layout__card">
          <Outlet />
        </div>
        <p className="auth-layout__footer">
          © 2026 Certify.cx<sup className="brand-tm">™</sup>. All rights reserved.
        </p>
      </div>
    </div>
  );
}
