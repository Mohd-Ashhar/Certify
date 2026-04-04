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
import AdminApplications from './pages/admin/AdminApplications';
import AdminRegionalAdmins from './pages/admin/AdminRegionalAdmins';
import AdminAuditors from './pages/admin/AdminAuditors';
import AdminCertBodies from './pages/admin/AdminCertBodies';
import AdminCompanies from './pages/admin/AdminCompanies';
import ApplicationDetails from './pages/admin/ApplicationDetails';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import Settings from './pages/settings/Settings';
import Notifications from './pages/notifications/Notifications';
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
              <ProtectedRoute allowedRoles={[ROLES.CLIENT]}>
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

            {/* Admin User Management — manage_users permission */}
            <Route path="/admin/users" element={
              <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_USERS}>
                <AdminUsers />
              </ProtectedRoute>
            } />

            {/* Admin — All Applications */}
            <Route path="/admin/applications" element={
              <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_ALL_CERTIFICATIONS}>
                <AdminApplications />
              </ProtectedRoute>
            } />

            {/* Admin — Companies */}
            <Route path="/admin/companies" element={
              <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_COMPANIES}>
                <AdminCompanies />
              </ProtectedRoute>
            } />

            {/* Admin — Regional Admins */}
            <Route path="/admin/regional-admins" element={
              <ProtectedRoute requiredPermission={PERMISSIONS.CREATE_ADMINS}>
                <AdminRegionalAdmins />
              </ProtectedRoute>
            } />

            {/* Admin — Auditors */}
            <Route path="/admin/auditors" element={
              <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_AUDITORS}>
                <AdminAuditors />
              </ProtectedRoute>
            } />

            {/* Admin — Certification Bodies */}
            <Route path="/admin/cert-bodies" element={
              <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_BODIES}>
                <AdminCertBodies />
              </ProtectedRoute>
            } />

            {/* Application Details — admins, auditors, and CBs can all view */}
            <Route path="/admin/applications/:id" element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.REGIONAL_ADMIN, ROLES.AUDITOR, ROLES.CERTIFICATION_BODY]}>
                <ApplicationDetails />
              </ProtectedRoute>
            } />

            {/* Profile — accessible to all authenticated users */}
            <Route path="/profile" element={
              <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_SETTINGS}>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Notifications */}
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />

            {/* Settings — admin only */}
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
