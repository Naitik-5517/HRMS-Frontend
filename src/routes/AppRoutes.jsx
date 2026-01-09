import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import AdminPage from "../pages/AdminPage";
import AgentDashboard from "../components/AgentDashboard/AgentDashboard.jsx";
import UserTrackingView from "../components/common/UserTrackingView";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoutes";
import { useAuth } from "../context/AuthContext";

const AppRoutes = () => {
  const { user } = useAuth();

  // Role-based redirect for already-logged-in users (use role_id)
  const getDashboardRoute = () => {
    if (!user) return "/";
    // All logged-in users go to /dashboard (agents see analytics, admins see full dashboard)
    return "/dashboard";
  };

  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<LoginPage />} />

        {/* Agent Dashboard (Data Entry) */}
        <Route
          path="/agent"
          element={
            <ProtectedRoute allowedRoles={[6]}>
              <AgentDashboard />
            </ProtectedRoute>
          }
        />

        {/* User Tracking (Admin only) */}
        <Route
          path="/entry"
          element={
            <ProtectedRoute allowedRoles={[1,2]}>
              <AppLayout>
                <UserTrackingView />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Dashboard for all roles (Analytics/Overview for agents, full dashboard for admins) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={[1,2,3,4,5,6]}>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin panel (optional, for super admin) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <AppLayout>
                <AdminPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback: if already logged in, redirect to correct dashboard; else show login */}
        <Route path="*" element={user ? <Navigate to={getDashboardRoute()} replace /> : <Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;