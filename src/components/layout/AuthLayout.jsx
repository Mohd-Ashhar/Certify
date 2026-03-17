import { Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';
import './AuthLayout.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-layout__container">
        <div className="auth-layout__logo">
          <div className="auth-layout__logo-icon">
            <Shield size={28} />
          </div>
          <span className="auth-layout__logo-text">Certify.cx</span>
        </div>
        <div className="auth-layout__card">
          <Outlet />
        </div>
        <p className="auth-layout__footer">
          © 2026 Certify.cx — ISO Certification Platform
        </p>
      </div>
    </div>
  );
}
