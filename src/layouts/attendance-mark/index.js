/**
 * RD & Company CRM - Mark Attendance Layout
 */

import { useState, useEffect } from "react";

// @mui components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// MD components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// layout
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

// Context and config
import { useAuth } from "contexts/AuthContext";
import { API_CONFIG, getApiUrl } from "config/api";

const STATUS = {
    ACTIVE: "active",
    COMPLETED: "completed",
    NOT_STARTED: "not_started",
};

function MarkAttendance() {
    const { user, token } = useAuth();
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isTimeRestricted, setIsTimeRestricted] = useState(false);

    const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

    // Check if current time is before 9:30 AM
    const checkTimeRestriction = () => {
        const now = new Date();
        const cutoffTime = new Date();
        cutoffTime.setHours(9, 30, 0, 0);

        setCurrentTime(now);
        setIsTimeRestricted(now > cutoffTime);
    };

    const getAttendanceStatus = async () => {
        try {
            if (!token) return;
            const res = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE_STATUS), {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setAttendanceStatus(data);
        } catch (e) {
            setSnackbar({ open: true, message: "Error fetching status", severity: "error" });
        }
    };

    const getAttendanceHistory = async () => {
        try {
            if (!token) return;
            const res = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE_HISTORY), {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setHistory(data.attendances || []);
        } catch (e) {
            // ignore
        }
    };

    const startAttendance = async () => {
        setLoading(true);
        try {
            if (!token) return;
            const res = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE_START), {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setSnackbar({
                open: true,
                message: data.message || "",
                severity: data.success ? "success" : "error",
            });
            await getAttendanceStatus();
            await getAttendanceHistory();
        } catch (e) {
            setSnackbar({ open: true, message: "Error starting attendance", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const endAttendance = async () => {
        setLoading(true);
        try {
            if (!token) return;
            const res = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE_END), {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setSnackbar({
                open: true,
                message: data.message || "",
                severity: data.success ? "success" : "error",
            });
            await getAttendanceStatus();
            await getAttendanceHistory();
        } catch (e) {
            setSnackbar({ open: true, message: "Error ending attendance", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAttendanceStatus();
        getAttendanceHistory();
        checkTimeRestriction();

        // Update time every minute
        const timeInterval = setInterval(checkTimeRestriction, 60000);

        return () => clearInterval(timeInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, user?.id]);

    const columns = [
        { Header: "Date", accessor: "date", width: "15%" },
        { Header: "Status", accessor: "status", width: "15%" },
        { Header: "Check In", accessor: "check_in", width: "15%" },
        { Header: "Check Out", accessor: "check_out", width: "15%" },
        { Header: "Hours", accessor: "hours", width: "10%" },
    ];

    const rows = (history || []).map((r) => ({
        date: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                {new Date(r.date).toLocaleDateString()}
            </MDTypography>
        ),
        status: <Chip label={(r.status || "").replace("_", " ").toUpperCase()} size="small" />,
        check_in: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                {r.start_time || "-"}
            </MDTypography>
        ),
        check_out: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                {r.end_time || "-"}
            </MDTypography>
        ),
        hours: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                {r.total_hours}
            </MDTypography>
        ),
    }));

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox py={3}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6} lg={6}>
                        <Card>
                            <MDBox p={3} display="flex" alignItems="center" justifyContent="space-between">
                                <MDBox>
                                    <MDTypography variant="h6">Mark Attendance</MDTypography>
                                    <MDTypography variant="button" color="text">
                                        {user?.name}
                                    </MDTypography>
                                    <MDBox mt={1}>
                                        <MDTypography variant="caption" color="text">
                                            Current Time: {currentTime.toLocaleTimeString()}
                                        </MDTypography>
                                        {isTimeRestricted && (
                                            <MDTypography variant="caption" color="error" display="block">
                                                ⚠️ Attendance can only be marked before 9:30 AM
                                            </MDTypography>
                                        )}
                                    </MDBox>
                                </MDBox>
                                <MDBox display="flex" gap={1}>
                                    {attendanceStatus?.status === STATUS.NOT_STARTED ||
                                        attendanceStatus?.status === STATUS.COMPLETED ? (
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="small"
                                            onClick={startAttendance}
                                            disabled={loading || isTimeRestricted}
                                        >
                                            <Icon>login</Icon>&nbsp;Check In
                                        </Button>
                                    ) : attendanceStatus?.status === STATUS.ACTIVE ? (
                                        <Button
                                            variant="contained"
                                            color="warning"
                                            size="small"
                                            onClick={endAttendance}
                                            disabled={loading}
                                        >
                                            <Icon>logout</Icon>&nbsp;Check Out
                                        </Button>
                                    ) : (
                                        <Button variant="outlined" size="small" disabled>
                                            Loading...
                                        </Button>
                                    )}
                                </MDBox>
                            </MDBox>
                        </Card>
                    </Grid>

                    <Grid item xs={12}>
                        <Card>
                            <MDBox p={3}>
                                <MDTypography variant="h6">Recent Attendance</MDTypography>
                            </MDBox>
                            <MDBox>
                                <DataTable
                                    table={{ columns, rows }}
                                    isSorted={false}
                                    entriesPerPage={false}
                                    showTotalEntries={false}
                                    noEndBorder
                                />
                            </MDBox>
                        </Card>
                    </Grid>
                </Grid>
            </MDBox>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
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

export default MarkAttendance;
