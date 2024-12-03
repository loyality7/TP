import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/dashboard/admin" replace />;
    } else if (user.role === 'vendor') {
      return <Navigate to="/dashboard/vendor" replace />;
    } else {
      return <Navigate to="/dashboard/user" replace />;
    }
  }

  return element;
};

export default ProtectedRoute; 