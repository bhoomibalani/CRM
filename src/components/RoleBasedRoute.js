/**
 * RD & Company CRM - Role Based Route Component
 * Controls access to routes based on user permissions
 */

import PropTypes from "prop-types";
import { useAuth } from "contexts/AuthContext";
import { Navigate } from "react-router-dom";

const RoleBasedRoute = ({
  children,
  requiredPermission,
  requiredRole,
  requiredRoles,
  fallbackPath = "/dashboard",
}) => {
  const { user, hasPermission, hasRole } = useAuth();

  // If no user is logged in, redirect to sign in
  if (!user) {
    return <Navigate to="/authentication/sign-in" replace />;
  }

  // Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check single role if required
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check multiple roles if required
  if (requiredRoles && Array.isArray(requiredRoles)) {
    const hasAnyRequiredRole = requiredRoles.some((role) => hasRole(role));
    if (!hasAnyRequiredRole) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return children;
};

RoleBasedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredPermission: PropTypes.string,
  requiredRole: PropTypes.string,
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
  fallbackPath: PropTypes.string,
};

export default RoleBasedRoute;
