import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasAnyPermission, PERMISSIONS, ROLE_LABELS } from '../../utils/roles';
import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  UserCheck,
  Award,
  BarChart3,
  Settings,
  Users,
  LogOut,
  ChevronLeft,
  Shield,
  X,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissions: [PERMISSIONS.VIEW_DASHBOARD] },
  { path: '/companies', label: 'Companies', icon: Building2, permissions: [PERMISSIONS.VIEW_COMPANIES, PERMISSIONS.REGISTER_COMPANY] },
  { path: '/certification-requests', label: 'Certifications', icon: FileCheck2, permissions: [PERMISSIONS.VIEW_CERTIFICATIONS, PERMISSIONS.CREATE_CERTIFICATION] },
  { path: '/auditors', label: 'Auditors', icon: UserCheck, permissions: [PERMISSIONS.VIEW_AUDITORS] },
  { path: '/certification-bodies', label: 'Cert Bodies', icon: Award, permissions: [PERMISSIONS.VIEW_BODIES] },
  { path: '/reports', label: 'Reports', icon: BarChart3, permissions: [PERMISSIONS.VIEW_REPORTS] },
  { path: '/admin/users', label: 'Users', icon: Users, permissions: [PERMISSIONS.CREATE_ADMINS, PERMISSIONS.MANAGE_AUDITORS] },
  { path: '/settings', label: 'Settings', icon: Settings, permissions: [PERMISSIONS.MANAGE_SETTINGS] },
];

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const filteredNav = navItems.filter(item =>
    hasAnyPermission(user?.role, item.permissions)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''} ${collapsed ? 'sidebar--collapsed' : ''}`}>
        {/* Logo */}
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

        {/* Navigation */}
        <nav className="sidebar__nav">
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={onClose}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="sidebar__link-icon" />
              {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{user?.name || 'User'}</span>
                <span className="sidebar__user-role">{ROLE_LABELS[user?.role] || 'Unknown'}</span>
              </div>
            )}
          </div>
          <button className="sidebar__logout" onClick={logout} title="Sign out">
            <LogOut size={18} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
