/**
 * RD & Company CRM - Authentication Context
 * Handles user authentication and role-based access control
 */

import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { API_CONFIG, getApiUrl } from "config/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// User roles and their permissions
export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  SALES: "sales",
  OFFICE: "office",
  CLIENT: "client",
};

export const PERMISSIONS = {
  // Employee Profile
  MANAGE_USERS: "manage_users",
  VIEW_USERS: "view_users",

  // Order Management
  MANAGE_ORDERS: "manage_orders",
  VIEW_ORDERS: "view_orders",
  CREATE_ORDERS: "create_orders",

  // Ledger Management
  MANAGE_LEDGERS: "manage_ledgers",
  VIEW_LEDGERS: "view_ledgers",
  REQUEST_LEDGERS: "request_ledgers",
  UPLOAD_LEDGERS: "upload_ledgers",

  // Task Management
  MANAGE_TASKS: "manage_tasks",
  VIEW_TASKS: "view_tasks",

  // Attendance Management
  MANAGE_ATTENDANCE: "manage_attendance",
  VIEW_ATTENDANCE: "view_attendance",

  // Reporting
  VIEW_REPORTS: "view_reports",
  MANAGE_REPORTS: "manage_reports",
};

// Role-based permissions mapping
const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.CREATE_ORDERS,
    PERMISSIONS.MANAGE_LEDGERS,
    PERMISSIONS.UPLOAD_LEDGERS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.MANAGE_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_REPORTS,
  ],
  [USER_ROLES.MANAGER]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.CREATE_ORDERS,
    PERMISSIONS.MANAGE_LEDGERS,
    PERMISSIONS.UPLOAD_LEDGERS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.MANAGE_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_REPORTS,
  ],
  [USER_ROLES.SALES]: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.CREATE_ORDERS,
    PERMISSIONS.REQUEST_LEDGERS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_REPORTS,
  ],
  [USER_ROLES.OFFICE]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.VIEW_LEDGERS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_REPORTS,
  ],
  [USER_ROLES.CLIENT]: [
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.CREATE_ORDERS,
    PERMISSIONS.REQUEST_LEDGERS,
    PERMISSIONS.VIEW_TASKS,
  ],
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const verifySession = async (existingToken = null) => {
    try {
      const authToken = existingToken || token;
      if (!authToken) {
        console.log("AuthContext - No token available for verification");
        return false;
      }

      console.log(
        "AuthContext - Verifying session with token:",
        authToken.substring(0, 10) + "..."
      );

      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.VERIFY), {
        method: "GET",
        headers: {
          ...headers,
          Accept: "application/json",
        },
      });

      console.log("AuthContext - Verification response status:", response.status);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("AuthContext - Non-JSON verification response");
        return false;
      }

      const data = await response.json();
      console.log("AuthContext - Verification response:", data);

      if (data.success) {
        // Update user data if verification is successful
        if (data.user) {
          const userData = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            permissions: ROLE_PERMISSIONS[data.user.role] || [],
          };
          setUser(userData);
          localStorage.setItem("crm_user", JSON.stringify(userData));
        }
      }

      return data.success;
    } catch (error) {
      console.error("AuthContext - Verification error:", error);
      return false;
    }
  };

  useEffect(() => {
    // Check for stored user session and verify with backend
    const storedUser = localStorage.getItem("crm_user");
    const storedToken = localStorage.getItem("crm_token");

    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      // Verify session with backend
      verifySession(storedToken)
        .then((isValid) => {
          if (isValid) {
            setUser(userData);
          } else {
            localStorage.removeItem("crm_user");
            localStorage.removeItem("crm_token");
            setToken(null);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("AuthContext - Verification error:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []); // Empty dependency array - run only once on mount

  const login = async (email, password) => {
    // Prevent multiple simultaneous login attempts
    if (loading) {
      return { success: false, error: "Login already in progress" };
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("AuthContext - Non-JSON response:", textResponse);
        throw new Error(
          "Backend server is not responding properly. Please ensure the Laravel backend is running on http://127.0.0.1:8000"
        );
      }

      const data = await response.json();

      // Check for HTTP errors
      if (!response.ok) {
        return { success: false, error: data.message || `HTTP error: ${response.status}` };
      }

      if (data.success) {
        const receivedToken = data.token;
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          permissions: ROLE_PERMISSIONS[data.user.role] || [],
        };

        setUser(userData);
        localStorage.setItem("crm_user", JSON.stringify(userData));
        if (receivedToken) {
          setToken(receivedToken);
          localStorage.setItem("crm_token", receivedToken);
        }
        return { success: true, user: userData };
      } else {
        return { success: false, error: data.message || "Login failed" };
      }
    } catch (error) {
      console.error("AuthContext - Login error:", error);
      return { success: false, error: "Network error. Please check your connection." };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGOUT), {
        method: "POST",
        headers,
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear local state regardless of API call result
      setUser(null);
      localStorage.removeItem("crm_user");
      localStorage.removeItem("crm_token");
      setToken(null);
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  const value = {
    user,
    token,
    login,
    logout,
    hasPermission,
    hasRole,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
