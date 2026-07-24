import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSetupComplete = useAuthStore((s) => s.isSetupComplete);
  const location = useLocation();

  if (!isSetupComplete) {
    return <Navigate to="/setup" replace state={{ from: location }} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function GuestRoute({ mode }: { mode: 'login' | 'setup' }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSetupComplete = useAuthStore((s) => s.isSetupComplete);

  if (mode === 'setup' && isSetupComplete) {
    return <Navigate to={isAuthenticated ? '/' : '/login'} replace />;
  }

  if (mode === 'login') {
    if (!isSetupComplete) return <Navigate to="/setup" replace />;
    if (isAuthenticated) return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
