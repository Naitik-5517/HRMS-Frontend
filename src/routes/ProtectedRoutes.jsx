import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// allowedRoles: array of allowed role_ids (e.g. [1,2,3,4,5,6])
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  console.log('🛡️ [ProtectedRoute] user:', user?.user_id, 'role_id:', user?.role_id, 'allowedRoles:', allowedRoles);
  if (!user) {
    console.log('🛡️ [ProtectedRoute] No user, redirecting to /');
    return <Navigate to="/" />;
  }
  if (allowedRoles) {
    const roleId = Number(user.role_id);
    if (!allowedRoles.includes(roleId)) {
      console.log('🛡️ [ProtectedRoute] Access denied! roleId', roleId, 'not in', allowedRoles, '- redirecting to /');
      return <Navigate to="/" />;
    }
    console.log('🛡️ [ProtectedRoute] Access granted! roleId', roleId, 'in', allowedRoles);
  }
  return children;
};

export default ProtectedRoute;