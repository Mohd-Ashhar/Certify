import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './DashboardLayout.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/companies': 'Companies',
  '/certification-requests': 'Certification Requests',
  '/auditors': 'Auditors',
  '/certification-bodies': 'Certification Bodies',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] || (
    <>Certify.cx<sup className="brand-tm">™</sup></>
  );

  return (
    <div className={`dashboard-layout ${collapsed ? 'dashboard-layout--collapsed' : ''}`}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <TopBar
        pageTitle={pageTitle}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        collapsed={collapsed}
      />
      <main className="dashboard-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
