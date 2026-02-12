import { Navigate } from "react-router-dom";
import { getSession } from "../utils/auth";

export default function ProtectedRoute({ children, allowedRole }) {
  const session = getSession();

  // Not logged in
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // ADMIN has access to all dashboards
  if (session.role === 'ADMIN') {
    return children;
  }

  // Role mismatch for non-admin users
  if (allowedRole && session.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  // Authorized
  return children;
}
