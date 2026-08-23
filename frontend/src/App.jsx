import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import IncidentsPage from './pages/IncidentsPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import CreateIncidentPage from './pages/CreateIncidentPage';
import UserManagementPage from './pages/UserManagementPage';
import ReportsPage from './pages/ReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import AiCopilotWidget from './components/AiCopilotWidget';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppLayout({ children }) {
  useKeyboardShortcuts();

  return (
    <div className="app-layout">
      <Navbar />
      {children}
      <AiCopilotWidget />
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated() ? <Navigate to="/" replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated() ? <Navigate to="/" replace /> : <RegisterPage />
        }
      />
      <Route
        path="/reset-password"
        element={
          isAuthenticated() ? <Navigate to="/" replace /> : <ResetPasswordPage />
        }
      />
       <Route
        path="/forgot-password"
        element={
          isAuthenticated() ? <Navigate to="/" replace /> : <ForgotPasswordPage />
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents"
        element={
          <ProtectedRoute>
            <AppLayout>
              <IncidentsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents/new"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CreateIncidentPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <IncidentDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AppLayout>
              <UserManagementPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ReportsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AnalyticsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
