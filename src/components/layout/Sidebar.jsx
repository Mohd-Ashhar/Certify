import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { hasAnyPermission, PERMISSIONS, ROLE_LABELS, ROLES } from '../../utils/roles';
import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  UserCheck,
  Award,
  ShieldCheck,
  Settings,
  Users,
  LogOut,
  ChevronLeft,
  Shield,
  X,
  PlusCircle,
  User,
  Bell,
  Gift,
  Link2,
  UserPlus,
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, permissions: [PERMISSIONS.VIEW_DASHBOARD] },
    { path: '/client/apply', labelKey: 'nav.newApplication', icon: PlusCircle, permissions: [PERMISSIONS.CREATE_CERTIFICATION] },
    { path: '/admin/applications', labelKey: 'nav.applications', icon: FileCheck2, permissions: [PERMISSIONS.VIEW_ALL_CERTIFICATIONS] },
    { path: '/admin/companies', labelKey: 'nav.companies', icon: Building2, permissions: [PERMISSIONS.VIEW_COMPANIES] },
    { path: '/admin/regional-admins', labelKey: 'nav.regionalAdmins', icon: ShieldCheck, permissions: [PERMISSIONS.CREATE_ADMINS] },
    { path: '/admin/auditors', labelKey: 'nav.auditors', icon: UserCheck, permissions: [PERMISSIONS.MANAGE_AUDITORS] },
    { path: '/admin/cert-bodies', labelKey: 'nav.certBodies', icon: Award, permissions: [PERMISSIONS.MANAGE_BODIES] },
    { path: '/admin/users', labelKey: 'nav.users', icon: Users, permissions: [PERMISSIONS.CREATE_ADMINS, PERMISSIONS.MANAGE_AUDITORS] },
    { path: '/admin/shareable-links', labelKey: 'nav.shareableLinks', icon: Link2, permissions: [PERMISSIONS.MANAGE_USERS] },
    { path: '/admin/registrations', labelKey: 'nav.registrations', icon: UserPlus, permissions: [PERMISSIONS.MANAGE_USERS] },
    { path: '/referrals', labelKey: 'nav.referrals', icon: Gift, permissions: [PERMISSIONS.VIEW_DASHBOARD], excludeRoles: [ROLES.SUPER_ADMIN, ROLES.REGIONAL_ADMIN] },
    { path: '/profile', labelKey: 'nav.myProfile', icon: User, permissions: [PERMISSIONS.MANAGE_SETTINGS] },
    { path: '/notifications', labelKey: 'nav.notifications', icon: Bell, permissions: [PERMISSIONS.VIEW_DASHBOARD] },
    { path: '/settings', labelKey: 'nav.settings', icon: Settings, permissions: [PERMISSIONS.MANAGE_USERS] },
  ];

  const filteredNav = navItems.filter(item =>
    hasAnyPermission(user?.role, item.permissions) &&
    !(item.excludeRoles && item.excludeRoles.includes(user?.role))
  );

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''} ${collapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <div className="sidebar__logo-icon">
              <Shield size={22} />
            </div>
            {!collapsed && <span className="sidebar__logo-text">Certify.cx<sup className="brand-tm">™</sup></span>}
          </div>
          <button className="sidebar__close-mobile" onClick={onClose}>
            <X size={20} />
          </button>
          {!collapsed && (
            <button className="sidebar__collapse-btn" onClick={onToggleCollapse} title="Collapse sidebar">
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        <nav className="sidebar__nav">
          {filteredNav.map((item) => {
            const label = t(item.labelKey);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
                onClick={onClose}
                title={collapsed ? label : undefined}
              >
                <item.icon size={20} className="sidebar__link-icon" />
                {!collapsed && <span className="sidebar__link-label">{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{user?.name || t('common.user')}</span>
                <span className="sidebar__user-role">
                  {user?.role === 'client' && user?.company_name
                    ? user.company_name
                    : ROLE_LABELS[user?.role] || t('common.unknown')}
                </span>
              </div>
            )}
          </div>
          <button className="sidebar__logout" onClick={logout} title={t('common.signOut')}>
            <LogOut size={18} />
            {!collapsed && <span>{t('common.signOut')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
