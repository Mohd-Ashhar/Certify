import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthLayout from './components/layout/AuthLayout';
import { ROLES, PERMISSIONS } from './utils/roles';

// Public Pages
import LandingPage from './pages/landing/LandingPage';

// Auth Pages
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import Unauthorized from './pages/auth/Unauthorized';

// Admin Pages
import AdminUsers from './pages/admin/AdminUsers';
import ApplicationDetails from './pages/admin/ApplicationDetails';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import Companies from './pages/companies/Companies';
import CertificationRequests from './pages/certifications/CertificationRequests';
import Auditors from './pages/auditors/Auditors';
import CertificationBodies from './pages/bodies/CertificationBodies';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import ApplicationForm from './pages/client/ApplicationForm';
import PaymentPlaceholder from './pages/client/PaymentPlaceholder';
import GapAnalysis from './pages/client/GapAnalysis';

function AppRoutes() {
  const { loading } = useAuth();

  return (
    <>
      {loading ? (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          Loading...
        </div>
      ) : (
        <Routes>
          {/* ---- Public Landing Page ---- */}
          <Route path="/" element={<LandingPage />} />

          {/* ---- Auth Routes ---- */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* ---- Unauthorized ---- */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ---- Protected Dashboard Routes ---- */}
          <Route element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* Generic Dashboard (Fallback) */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Role-Specific Dashboards */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.REGIONAL_ADMIN]}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/auditor/dashboard" element={
              <ProtectedRoute allowedRoles={[ROLES.AUDITOR]}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/cert-body/dashboard" element={
              <ProtectedRoute allowedRoles={[ROLES.CERTIFICATION_BODY]}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/client/dashboard" element={
              <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/client/apply" element={
              <ProtectedRoute allowedRoles={[ROLES.CLIENT, ROLES.SUPER_ADMIN, ROLES.REGIONAL_ADMIN]}>
                <ApplicationForm />
              </ProtectedRoute>
            } />
            <Route path="/client/gap-analysis" element={
              <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
                <GapAnalysis />
              </ProtectedRoute>
            } />
            <Route path="/client/checkout/:applicationId" element={
              <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
                <PaymentPlaceholder />
              </ProtectedRoute>
            } />

            {/* Admin User Management — create_admins */}
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.REGIONAL_ADMIN]}>
                <AdminUsers />
              </ProtectedRoute>
            } />

            {/* Admin Application Details */}
            <Route path="/admin/applications/:id" element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.REGIONAL_ADMIN]}>
                <ApplicationDetails />
              </ProtectedRoute>
            } />

            {/* Companies — view_companies OR register_company */}
            <Route path="/companies" element={
              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_COMPANIES, PERMISSIONS.REGISTER_COMPANY]} requireAll={false}>
                <Companies />
              </ProtectedRoute>
            } />

            {/* Certification Requests — view_certifications */}
            <Route path="/certification-requests" element={
              <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_CERTIFICATIONS}>
                <CertificationRequests />
              </ProtectedRoute>
            } />

            {/* Auditors — view_auditors (not accessible to clients) */}
            <Route path="/auditors" element={
              <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_AUDITORS}>
                <Auditors />
              </ProtectedRoute>
            } />

            {/* Certification Bodies — view_bodies */}
            <Route path="/certification-bodies" element={
              <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_BODIES}>
                <CertificationBodies />
              </ProtectedRoute>
            } />

            {/* Reports — view_reports (admin, regional admin, cert body) */}
            <Route path="/reports" element={
              <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_REPORTS}>
                <Reports />
              </ProtectedRoute>
            } />

            {/* Settings — manage_settings */}
            <Route path="/settings" element={
              <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_SETTINGS}>
                <Settings />
              </ProtectedRoute>
            } />
          </Route>

          {/* ---- Redirect Catch-All ---- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
