/**
 * RD & Company CRM - Attendance Management Layout
 */

import { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

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

// Config
import { API_CONFIG, getApiUrl } from "config/api";

// Data
import { attendanceTableData } from "./data";

const ATTENDANCE_STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  HALF_DAY: "half_day",
  LEAVE: "leave",
  ACTIVE: "active",
  COMPLETED: "completed",
  NOT_STARTED: "not_started",
};

function AttendanceManagement() {
  const { user, hasPermission, token } = useAuth();
  const [menu, setMenu] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [currentDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  // API functions
  const getAttendanceStatus = async () => {
    try {
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE_STATUS), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Attendance status response:", data);

      if (data.success) {
        setAttendanceStatus(data);
      } else {
        console.error("API returned error:", data.message);
      }
    } catch (error) {
      console.error("Error fetching attendance status:", error);
      setSnackbar({ open: true, message: "Error fetching attendance status", severity: "error" });
    }
  };

  const startAttendance = async () => {
    setLoading(true);
    try {
      if (!token) {
        setSnackbar({ open: true, message: "No authentication token found", severity: "error" });
        return;
      }

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE_START), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSnackbar({ open: true, message: data.message, severity: "success" });
        getAttendanceStatus();
      } else {
        setSnackbar({ open: true, message: data.message, severity: "error" });
      }
    } catch (error) {
      console.error("Error starting attendance:", error);
      setSnackbar({ open: true, message: "Error starting attendance", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const endAttendance = async () => {
    setLoading(true);
    try {
      if (!token) {
        setSnackbar({ open: true, message: "No authentication token found", severity: "error" });
        return;
      }

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE_END), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setSnackbar({ open: true, message: data.message, severity: "success" });
        getAttendanceStatus();
      } else {
        setSnackbar({ open: true, message: data.message, severity: "error" });
      }
    } catch (error) {
      console.error("Error ending attendance:", error);
      setSnackbar({ open: true, message: "Error ending attendance", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Load attendance status on component mount
  useEffect(() => {
    getAttendanceStatus();
  }, []);

  // Update elapsed time every minute when attendance is active
  useEffect(() => {
    let interval;
    if (attendanceStatus?.status === "active") {
      interval = setInterval(() => {
        getAttendanceStatus();
      }, 60000); // Update every minute
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [attendanceStatus?.status]);

  const handleOpenDialog = (attendance = null) => {
    setSelectedAttendance(attendance);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAttendance(null);
  };

  const handleMarkAttendance = (userId, status) => {
    const today = new Date().toISOString().split("T")[0];
    const existingRecord = attendance.find(
      (record) => record.user_id === userId && record.date === today
    );

    if (existingRecord) {
      setAttendance((prevAttendance) =>
        prevAttendance.map((record) =>
          record.id === existingRecord.id
            ? {
                ...record,
                status,
                check_in: status === ATTENDANCE_STATUS.ABSENT ? null : new Date().toISOString(),
              }
            : record
        )
      );
    } else {
      const newRecord = {
        id: Date.now(),
        user_id: userId,
        user_name: user.name,
        date: today,
        status,
        check_in: status === ATTENDANCE_STATUS.ABSENT ? null : new Date().toISOString(),
        check_out: null,
        hours_worked: 0,
        remarks: "",
      };
      setAttendance((prevAttendance) => [...prevAttendance, newRecord]);
    }
  };

  const handleCheckOut = (attendanceId) => {
    setAttendance((prevAttendance) =>
      prevAttendance.map((record) =>
        record.id === attendanceId
          ? {
              ...record,
              check_out: new Date().toISOString(),
              hours_worked: calculateHours(record.check_in, new Date().toISOString()),
            }
          : record
      )
    );
  };

  const calculateHours = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end - start;
    const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
    return Math.max(0, diffHours);
  };

  // Fetch attendance history
  const getAttendanceHistory = async () => {
    try {
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      // Use different endpoint based on user role
      const endpoint = hasPermission("MANAGE_ATTENDANCE")
        ? API_CONFIG.ENDPOINTS.ATTENDANCE_ALL
        : API_CONFIG.ENDPOINTS.ATTENDANCE_HISTORY;

      const response = await fetch(getApiUrl(endpoint), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Attendance history response:", data);

      if (data.success) {
        // Transform the API data to match the expected format
        const transformedData = data.attendances.map((record) => ({
          id: record.id,
          user_id: record.user_id || user?.id || 1,
          user_name: record.user_name || user?.name || "Current User",
          date: record.date,
          status: record.status,
          check_in: record.start_time
            ? new Date(record.date + "T" + record.start_time).toISOString()
            : null,
          check_out: record.end_time
            ? new Date(record.date + "T" + record.end_time).toISOString()
            : null,
          hours_worked: record.total_hours ? parseFloat(record.total_hours.replace(":", ".")) : 0,
          remarks: record.notes || "",
        }));
        setAttendance(transformedData);
      } else {
        console.error("API returned error:", data.message);
        // Fallback to mock data if API fails
        setAttendance(attendanceTableData.rows);
      }
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      // Fallback to mock data if API fails
      setAttendance(attendanceTableData.rows);
    }
  };

  useEffect(() => {
    getAttendanceHistory();
  }, [token, user]);

  const filteredAttendance = attendance.filter((record) => {
    const matchesSearch = record.user_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesDate = !dateFilter || record.date === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case ATTENDANCE_STATUS.PRESENT:
      case ATTENDANCE_STATUS.COMPLETED:
        return "success";
      case ATTENDANCE_STATUS.LATE:
        return "warning";
      case ATTENDANCE_STATUS.HALF_DAY:
        return "info";
      case ATTENDANCE_STATUS.ABSENT:
        return "error";
      case ATTENDANCE_STATUS.LEAVE:
        return "secondary";
      case ATTENDANCE_STATUS.ACTIVE:
        return "primary";
      case ATTENDANCE_STATUS.NOT_STARTED:
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case ATTENDANCE_STATUS.PRESENT:
        return "PRESENT";
      case ATTENDANCE_STATUS.COMPLETED:
        return "COMPLETED";
      case ATTENDANCE_STATUS.LATE:
        return "LATE";
      case ATTENDANCE_STATUS.HALF_DAY:
        return "HALF DAY";
      case ATTENDANCE_STATUS.ABSENT:
        return "ABSENT";
      case ATTENDANCE_STATUS.LEAVE:
        return "LEAVE";
      case ATTENDANCE_STATUS.ACTIVE:
        return "ACTIVE";
      case ATTENDANCE_STATUS.NOT_STARTED:
        return "NOT STARTED";
      default:
        return status.toUpperCase();
    }
  };

  const columns = [
    { Header: "Employee", accessor: "user_name", width: "20%" },
    { Header: "Date", accessor: "date", width: "15%" },
    { Header: "Status", accessor: "status", width: "15%" },
    { Header: "Check In", accessor: "check_in", width: "15%" },
    { Header: "Check Out", accessor: "check_out", width: "15%" },
    { Header: "Hours", accessor: "hours_worked", width: "10%" },
    { Header: "Actions", accessor: "actions", width: "10%", disableSortBy: true },
  ];

  const rows = filteredAttendance.map((record) => ({
    user_name: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {record.user_name}
      </MDTypography>
    ),
    date: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {new Date(record.date).toLocaleDateString()}
      </MDTypography>
    ),
    status: (
      <Chip
        label={getStatusLabel(record.status)}
        color={getStatusColor(record.status)}
        size="small"
      />
    ),
    check_in: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {record.check_in ? new Date(record.check_in).toLocaleTimeString() : "-"}
      </MDTypography>
    ),
    check_out: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {record.check_out ? new Date(record.check_out).toLocaleTimeString() : "-"}
      </MDTypography>
    ),
    hours_worked: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {record.hours_worked}h
      </MDTypography>
    ),
    actions: (
      <Box display="flex" alignItems="center" gap={1}>
        {record.status === ATTENDANCE_STATUS.PRESENT && !record.check_out && (
          <MDButton size="small" color="info" onClick={() => handleCheckOut(record.id)}>
            <Icon>logout</Icon>
          </MDButton>
        )}
        <MDButton size="small" color="dark" onClick={() => handleOpenDialog(record)}>
          <Icon>edit</Icon>
        </MDButton>
      </Box>
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
                <MDBox>
                  <MDTypography variant="h6" fontWeight="medium">
                    Attendance Management
                  </MDTypography>
                  <MDBox display="flex" alignItems="center" gap={2} mt={1}>
                    {attendanceStatus ? (
                      <>
                        <Chip
                          label={
                            attendanceStatus.status === "active"
                              ? "Active"
                              : attendanceStatus.status === "completed"
                              ? "Completed"
                              : "Not Started"
                          }
                          color={
                            attendanceStatus.status === "active"
                              ? "success"
                              : attendanceStatus.status === "completed"
                              ? "info"
                              : "default"
                          }
                          size="small"
                        />
                        {attendanceStatus.status === "active" &&
                          attendanceStatus.current_elapsed_time && (
                            <MDTypography variant="caption" color="text">
                              Elapsed: {attendanceStatus.current_elapsed_time}
                            </MDTypography>
                          )}
                        {attendanceStatus.status === "completed" &&
                          attendanceStatus.attendance?.total_hours && (
                            <MDTypography variant="caption" color="text">
                              Total: {attendanceStatus.attendance.total_hours}
                            </MDTypography>
                          )}
                        <MDTypography variant="caption" color="text" sx={{ fontSize: "0.7rem" }}>
                          Debug: {JSON.stringify(attendanceStatus.status)}
                        </MDTypography>
                      </>
                    ) : (
                      <MDTypography variant="caption" color="text">
                        Loading attendance status...
                      </MDTypography>
                    )}
                  </MDBox>
                </MDBox>
                <Box display="flex" gap={1}>
                  {attendanceStatus?.status === "not_started" ||
                  attendanceStatus?.status === "completed" ? (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={startAttendance}
                      disabled={loading}
                    >
                      <Icon>login</Icon>&nbsp;Check In
                    </Button>
                  ) : attendanceStatus?.status === "active" ? (
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      onClick={endAttendance}
                      disabled={loading}
                    >
                      <Icon>logout</Icon>&nbsp;Check Out
                    </Button>
                  ) : !attendanceStatus ? (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={startAttendance}
                      disabled={loading}
                    >
                      <Icon>login</Icon>&nbsp;Check In
                    </Button>
                  ) : null}
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    onClick={() => {
                      getAttendanceStatus();
                      getAttendanceHistory();
                    }}
                    disabled={loading}
                  >
                    <Icon>refresh</Icon>&nbsp;Refresh
                  </Button>
                  <Button
                    variant="contained"
                    color="info"
                    size="small"
                    onClick={() => handleMarkAttendance(user.id, ATTENDANCE_STATUS.LATE)}
                  >
                    <Icon>schedule</Icon>&nbsp;Late
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => handleMarkAttendance(user.id, ATTENDANCE_STATUS.ABSENT)}
                  >
                    <Icon>cancel</Icon>&nbsp;Absent
                  </Button>
                </Box>
              </MDBox>

              <Grid container spacing={2} mb={2}>
                <Grid item xs={12} md={4}>
                  <MDInput
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status Filter"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value={ATTENDANCE_STATUS.PRESENT}>Present</MenuItem>
                      <MenuItem value={ATTENDANCE_STATUS.LATE}>Late</MenuItem>
                      <MenuItem value={ATTENDANCE_STATUS.HALF_DAY}>Half Day</MenuItem>
                      <MenuItem value={ATTENDANCE_STATUS.ABSENT}>Absent</MenuItem>
                      <MenuItem value={ATTENDANCE_STATUS.LEAVE}>Leave</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <MDInput
                    type="date"
                    label="Date Filter"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </MDBox>
          </Card>
        </MDBox>

        <Card>
          <MDBox pt={3} px={3}>
            <MDTypography variant="h6" fontWeight="medium">
              Attendance Records
            </MDTypography>
          </MDBox>
          <MDBox pt={1} pb={2} px={3}>
            <DataTable
              table={{ columns, rows }}
              isSorted={false}
              entriesPerPage={false}
              showTotalEntries={false}
              noEndBorder
            />
          </MDBox>
        </Card>
      </MDBox>

      {/* Attendance Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedAttendance?.status || ATTENDANCE_STATUS.PRESENT}
                  label="Status"
                >
                  <MenuItem value={ATTENDANCE_STATUS.PRESENT}>Present</MenuItem>
                  <MenuItem value={ATTENDANCE_STATUS.LATE}>Late</MenuItem>
                  <MenuItem value={ATTENDANCE_STATUS.HALF_DAY}>Half Day</MenuItem>
                  <MenuItem value={ATTENDANCE_STATUS.ABSENT}>Absent</MenuItem>
                  <MenuItem value={ATTENDANCE_STATUS.LEAVE}>Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <MDInput
                fullWidth
                type="time"
                label="Check In Time"
                value={
                  selectedAttendance?.check_in
                    ? new Date(selectedAttendance.check_in).toTimeString().slice(0, 5)
                    : ""
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <MDInput
                fullWidth
                type="time"
                label="Check Out Time"
                value={
                  selectedAttendance?.check_out
                    ? new Date(selectedAttendance.check_out).toTimeString().slice(0, 5)
                    : ""
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <MDInput
                fullWidth
                label="Hours Worked"
                type="number"
                value={selectedAttendance?.hours_worked || 0}
              />
            </Grid>
            <Grid item xs={12}>
              <MDInput
                fullWidth
                label="Remarks"
                multiline
                rows={2}
                value={selectedAttendance?.remarks || ""}
                placeholder="Enter any remarks..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseDialog} color="secondary">
            Cancel
          </MDButton>
          <MDButton onClick={handleCloseDialog} color="info">
            Update
          </MDButton>
        </DialogActions>
      </Dialog>

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
        <MenuItem onClick={closeMenu}>View Details</MenuItem>
        <MenuItem onClick={closeMenu}>Edit</MenuItem>
        <MenuItem onClick={closeMenu}>Delete</MenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

export default AttendanceManagement;
