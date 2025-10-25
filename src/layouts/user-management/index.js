/**
 * RD & Company CRM - Employee Profile Layout
 */

import { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import DataTable from "examples/Tables/DataTable";

// Context
import { useAuth } from "contexts/AuthContext";

// API Configuration
import { API_CONFIG, getApiUrl } from "config/api";

function UserManagement() {
  const { user, token } = useAuth();
  const [menu, setMenu] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "admin" });
  const [searchTerm, setSearchTerm] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  const openAddDialog = () => {
    setIsAddOpen(true);
    setValidationErrors({});
    setError(null);
  };
  const closeAddDialog = () => {
    setIsAddOpen(false);
    setNewUser({ name: "", email: "", password: "", role: "admin" });
    setValidationErrors({});
    setError(null);
  };
  const updateField = (key, value) => {
    setNewUser((prev) => ({ ...prev, [key]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  // Validation functions
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value || value.trim().length === 0) {
          return "Full name is required";
        }
        if (value.trim().length < 2) {
          return "Full name must be at least 2 characters";
        }
        return null;
      case "email":
        if (value && value.trim().length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            return "Please enter a valid email address";
          }
        }
        return null;
      case "password":
        if (!value || value.length === 0) {
          return "Password is required";
        }
        if (value.length < 8) {
          return "Password must be at least 8 characters";
        }
        return null;
      case "role":
        if (!value) {
          return "Role is required";
        }
        return null;
      default:
        return null;
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Validate each field
    Object.keys(newUser).forEach((field) => {
      const error = validateField(field, newUser[field]);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleCreateUser = async () => {
    // Validate form before submitting
    if (!validateForm()) {
      setError("Fill required fields before submitting");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log("Creating user with data:", newUser);
      console.log("API URL:", getApiUrl(API_CONFIG.ENDPOINTS.USERS));

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.USERS), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HTTP Error:", response.status, errorText);
        setError(`Server error (${response.status}): ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        closeAddDialog();
        await fetchUsers(); // Refresh the users list
        setError(null);
      } else {
        setError(data.message || "Failed to create user");
      }
    } catch (err) {
      console.error("Network error details:", err);
      setError(`Network error: ${err.message}. Please check if the backend server is running on http://127.0.0.1:8000`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.USERS), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("UserManagement - User:", user);
    console.log("UserManagement - Token:", token);
    console.log("UserManagement - User role:", user?.role);

    if (token && user) {
      fetchUsers();
    } else {
      setLoading(false);
      setError("Authentication required");
    }
  }, [token, user]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { Header: "Name", accessor: "name", width: "25%" },
    { Header: "Email", accessor: "email", width: "30%" },
    { Header: "Role", accessor: "role", width: "15%" },
    { Header: "Status", accessor: "status", width: "15%" },
    { Header: "Actions", accessor: "actions", width: "15%", disableSortBy: true },
  ];

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.USERS)}/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        await fetchUsers();
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || "Failed to delete user");
      }
    } catch (err) {
      alert("Network error while deleting user");
    }
  };

  const rows = filteredUsers.map((user) => ({
    name: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {user.name}
      </MDTypography>
    ),
    email: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {user.email}
      </MDTypography>
    ),
    role: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {user.role.replace("_", " ").toUpperCase()}
      </MDTypography>
    ),
    status: (
      <MDBox ml={-1}>
        <MDBox
          component="span"
          variant="caption"
          color={user.status === "active" ? "success" : "error"}
          fontWeight="medium"
        >
          {user.status}
        </MDBox>
      </MDBox>
    ),
    actions: (
      <MDBox display="flex" alignItems="center" mt={{ xs: 2, sm: 0 }} ml={{ xs: -1.5, sm: 0 }}>
        <MDBox mr={1}>
          <MDButton variant="text" color="error" onClick={() => handleDelete(user.id)}>
            <Icon>delete</Icon>&nbsp;delete
          </MDButton>
        </MDBox>
        <MDButton variant="text" color="dark" onClick={openMenu}>
          <Icon>more_vert</Icon>
        </MDButton>
      </MDBox>
    ),
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={3}>
          <Card>
            <MDBox p={2}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <MDTypography variant="h6" fontWeight="medium">
                  Employee Profile
                </MDTypography>
                <MDButton variant="gradient" color="info" size="small" onClick={openAddDialog}>
                  <Icon>add</Icon>&nbsp;Add User
                </MDButton>
              </MDBox>
              <MDBox mb={2}>
                <MDInput
                  type="text"
                  placeholder="Search users by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  fullWidth
                />
              </MDBox>
            </MDBox>
          </Card>
        </MDBox>

        <Card>
          <MDBox pt={3} px={3}>
            <MDTypography variant="h6" fontWeight="medium">
              Users List
            </MDTypography>
          </MDBox>
          <MDBox pt={1} pb={2} px={3}>
            {loading ? (
              <MDBox display="flex" justifyContent="center" py={4}>
                <MDTypography variant="body2" color="text">
                  Loading users...
                </MDTypography>
              </MDBox>
            ) : error ? (
              <MDBox display="flex" justifyContent="center" py={4}>
                <MDTypography variant="body2" color="error">
                  {error}
                </MDTypography>
              </MDBox>
            ) : (
              <DataTable
                table={{ columns, rows }}
                isSorted={false}
                entriesPerPage={false}
                showTotalEntries={false}
                noEndBorder
              />
            )}
          </MDBox>
        </Card>
      </MDBox>

      <Menu
        id="simple-menu"
        anchorEl={menu}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(menu)}
        onClose={closeMenu}
      >
        <MenuItem onClick={closeMenu}>Action</MenuItem>
        <MenuItem onClick={closeMenu}>Another action</MenuItem>
        <MenuItem onClick={closeMenu}>Something else</MenuItem>
      </Menu>
      {/* Add User Dialog */}
      <Dialog open={isAddOpen} onClose={closeAddDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <MDBox mt={1}>
            {/* Display general error message */}
            {error && (
              <MDBox mb={2}>
                <MDTypography variant="body2" color="error">
                  {error}
                </MDTypography>
              </MDBox>
            )}

            <MDBox mb={2}>
              <MDInput
                type="text"
                placeholder="Full name"
                value={newUser.name}
                onChange={(e) => updateField("name", e.target.value)}
                fullWidth
                error={!!validationErrors.name}
                success={!validationErrors.name && newUser.name.length > 0}
              />
              {validationErrors.name && (
                <MDTypography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                  {validationErrors.name}
                </MDTypography>
              )}
            </MDBox>

            <MDBox mb={2}>
              <MDInput
                type="email"
                placeholder="Email (Optional)"
                value={newUser.email}
                onChange={(e) => updateField("email", e.target.value)}
                fullWidth
                error={!!validationErrors.email}
                success={!validationErrors.email && newUser.email.length > 0}
              />
              {validationErrors.email && (
                <MDTypography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                  {validationErrors.email}
                </MDTypography>
              )}
            </MDBox>

            <MDBox mb={2}>
              <MDInput
                type="password"
                placeholder="Password (min 8 chars)"
                value={newUser.password}
                onChange={(e) => updateField("password", e.target.value)}
                fullWidth
                error={!!validationErrors.password}
                success={!validationErrors.password && newUser.password.length >= 8}
              />
              {validationErrors.password && (
                <MDTypography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                  {validationErrors.password}
                </MDTypography>
              )}
            </MDBox>

            <FormControl fullWidth error={!!validationErrors.role}>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                label="Role"
                value={newUser.role}
                onChange={(e) => updateField("role", e.target.value)}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="office">Office Staff</MenuItem>
                <MenuItem value="client">Client</MenuItem>
              </Select>
              {validationErrors.role && (
                <MDTypography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                  {validationErrors.role}
                </MDTypography>
              )}
            </FormControl>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton
            variant="text"
            color="secondary"
            onClick={closeAddDialog}
            disabled={isSubmitting}
          >
            Cancel
          </MDButton>
          <MDButton
            variant="gradient"
            color="info"
            onClick={handleCreateUser}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create User"}
          </MDButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default UserManagement;
