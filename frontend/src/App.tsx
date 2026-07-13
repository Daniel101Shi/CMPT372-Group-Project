import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { ScheduleBuilderComponent } from "./components/schedule-builder/ScheduleBuilderComponent";
import { UserProfilePage } from "./components/profile/UserProfilePage";

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

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/schedulebuilder"
            element={
              <ProtectedRoute>
                <ScheduleBuilderComponent />
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
