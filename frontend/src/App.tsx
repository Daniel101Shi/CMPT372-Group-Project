import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { ScheduleBuilderComponent } from "./components/schedule-builder/ScheduleBuilderComponent";
import { ScheduleViewerComponent } from "./components/schedule-viewer/ScheduleViewerComponent";
import { UserProfilePage } from "./components/profile/UserProfilePage";
import { PackPage } from "./components/packs/PackPage";
import { AdminPage } from "./components/admin/AdminPage";
import { Toaster } from "sonner";

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <Navigate to="/userprofile" replace /> : <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <>{children}</> : <Navigate to="/" replace />;
}

// Hides the admin page from anyone who isn't an admin. This is only for the UI: the real
// enforcement is requireRole on the server, which rejects the request no matter what the
// browser thinks.
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return user.role === "admin" ? <>{children}</> : <Navigate to="/userprofile" replace />;
}

export function App() {
  return (
    <>
    <Toaster richColors position="top-center" />
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        <Route
            path="/pack"
            element={
              <ProtectedRoute>
                <PackPage/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedulebuilder"
            element={
              <ProtectedRoute>
                <ScheduleBuilderComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scheduleviewer"
            element={
              <ProtectedRoute>
                <ScheduleViewerComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scheduleviewer/:friendUserId"
            element={
              <ProtectedRoute>
                <ScheduleViewerComponent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/userprofile"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/userprofile/:userId"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </>
  );
}
