import { Navigate } from 'react-router-dom';

/**
 * Legacy dashboard — redirects to /home. Kept so old links don't break.
 */
export function DashboardPage() {
  return <Navigate to="/home" replace />;
}
