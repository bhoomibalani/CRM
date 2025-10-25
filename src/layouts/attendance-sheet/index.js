/**
 * RD & Company CRM - Attendance Sheet (Spreadsheet View)
 */

import { useEffect, useMemo, useState } from "react";

// @mui
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Icon from "@mui/material/Icon";
import Button from "@mui/material/Button";

// MD
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// layout
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

// context/config
import { useAuth } from "contexts/AuthContext";
import { API_CONFIG, getApiUrl } from "config/api";

function AttendanceSheet() {
    const { token, user } = useAuth();
    const [records, setRecords] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            // last 30 days range
            const to = new Date();
            const from = new Date();
            from.setDate(to.getDate() - 29);
            // Build query range in IST to match server
            const qs = `?from=${formatDateKeyIST(from)}&to=${formatDateKeyIST(to)}`;
            const headers = { Authorization: `Bearer ${token}` };
            let attRes = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE_ALL) + qs, { headers });
            const usersRes = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.USERS), { headers });
            // Also fetch current user's status to guarantee today's row appears
            const statusRes = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE_STATUS), { headers });
            let attData = await attRes.json();
            const usersData = await usersRes.json();
            const statusData = await statusRes.json().catch(() => ({}));
            // Fallback A: permission denied or failure -> use personal history instead so regular users still see themselves
            if (!attRes.ok || !attData?.success) {
                const histUrl = getApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE_HISTORY) + qs;
                const histRes = await fetch(histUrl, { headers });
                const histData = await histRes.json();
                if (histData?.success) {
                    // Attach current user id/name to records for consistent rendering
                    setRecords(
                        (histData.attendances || []).map((r) => ({
                            ...r,
                            user_id: user?.id,
                            user_name: user?.name,
                        }))
                    );
                }
            }
            // Fallback B: if filtered query returns empty, retry without range to avoid TZ mismatch issues
            if (
                attData?.success &&
                Array.isArray(attData.attendances) &&
                attData.attendances.length === 0
            ) {
                attRes = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE_ALL), { headers });
                attData = await attRes.json();
            }
            let nextRecords = [];
            if (attData.success) nextRecords = attData.attendances || [];

            // If status has today's record, ensure it's present in dataset for the current user
            if (statusData?.success && statusData?.attendance?.date) {
                const todayKey = formatDateKeyIST(new Date());
                const s = statusData.attendance;
                const statusDateKey = formatDateKeyIST(s.date);
                if (statusDateKey === todayKey) {
                    const exists = (nextRecords || []).some(
                        (r) => String(r.user_id) === String(user?.id) && formatDateKeyIST(r.date) === todayKey
                    );
                    if (!exists) {
                        nextRecords = [
                            ...nextRecords,
                            {
                                id: s.id || `status-${user?.id}-${todayKey}`,
                                user_id: user?.id,
                                user_name: user?.name,
                                date: s.date,
                                start_time: s.start_time ? String(s.start_time).slice(11, 19) : null,
                                end_time: s.end_time ? String(s.end_time).slice(11, 19) : null,
                                total_hours: s.total_hours || "00:00",
                                status: s.status,
                                notes: "",
                            },
                        ];
                    }
                }
            }

            setRecords(nextRecords);
            if (usersData.success) setUsers(usersData.users || []);
        } catch (e) {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Build 14-day range and pivot by user (rows) and date (columns)
    const formatDateKey = (date) => {
        if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const formatHeader = (date) => {
        if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const parts = date.split("-");
            return `${parts[2]}/${parts[1]}`;
        }
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    };

    // Use Asia/Kolkata (IST) consistently so server and UI align on the same day
    const formatDateKeyIST = (date) => {
        if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        const fmt = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        // en-CA yields YYYY-MM-DD
        return fmt.format(date instanceof Date ? date : new Date(date));
    };

    const dateKeyDaysAgoIST = (daysAgo) => {
        const now = new Date();
        const target = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        return formatDateKeyIST(target);
    };

    const buildDateRange = (days = 14) => {
        const arr = [];
        // Put most recent (today, IST) first so it's immediately visible
        for (let i = 0; i < days; i += 1) {
            arr.push(dateKeyDaysAgoIST(i));
        }
        return arr;
    };

    const dates = useMemo(() => buildDateRange(30), []);

    const userToDateMap = useMemo(() => {
        const map = {};
        (records || []).forEach((r) => {
            const key = String(r.user_id); // key by user id only to avoid name mismatches
            if (!map[key]) map[key] = {};
            // Attendance API returns dates as YYYY-MM-DD (server in IST). Keep key in IST.
            const dateKey = formatDateKeyIST(r.date || new Date());
            map[key][dateKey] = r;
        });
        return map;
    }, [records]);

    const dynamicColumns = useMemo(() => {
        const base = [{ Header: "Employee", accessor: "user_name", width: "18%" }];
        const dateCols = dates.map((d) => ({ Header: formatHeader(d), accessor: `d_${d}` }));
        return [...base, ...dateCols];
    }, [dates]);

    const Cell = ({ present, duration }) => (
        <MDBox textAlign="center">
            <MDTypography
                variant="button"
                fontWeight="bold"
                color={present ? "success" : "error"}
                display="block"
            >
                {present ? "P" : "A"}
            </MDTypography>
            <MDTypography variant="caption" color="text" display="block">
                {present ? duration || "00:00" : "-"}
            </MDTypography>
        </MDBox>
    );

    const rows = useMemo(() => {
        const allUsers = users.length
            ? users.map((u) => ({ id: String(u.id), name: u.name }))
            : Object.keys(userToDateMap).map((id) => ({
                id,
                name: Object.values(records).find?.((r) => String(r.user_id) === id)?.user_name || id,
            }));
        return allUsers.map((u) => {
            const row = {
                user_name: (
                    <MDTypography variant="caption" color="text" fontWeight="medium">
                        {u.name}
                    </MDTypography>
                ),
            };
            dates.forEach((d) => {
                let rec =
                    userToDateMap[u.id]?.[d] ||
                    (records || []).find((r) => {
                        if (String(r.user_id) !== String(u.id)) return false;
                        // Prefer explicit date from API
                        if (formatDateKeyIST(r.date) === d) return true;
                        // Fallbacks: derive day from timestamps in IST
                        const fromStart = r.start_time
                            ? formatDateKeyIST(new Date(`${r.date}T${r.start_time}`))
                            : null;
                        const fromEnd = r.end_time
                            ? formatDateKeyIST(new Date(`${r.date}T${r.end_time}`))
                            : null;
                        return fromStart === d || fromEnd === d;
                    });
                if (!rec) {
                    // Final fallback by user name in case ids don't align in data sources
                    rec = (records || []).find((r) => {
                        if ((r.user_name || "").toLowerCase() !== (u.name || "").toLowerCase()) return false;
                        if (formatDateKeyIST(r.date) === d) return true;
                        const fromStart = r.start_time
                            ? formatDateKeyIST(new Date(`${r.date}T${r.start_time}`))
                            : null;
                        const fromEnd = r.end_time
                            ? formatDateKeyIST(new Date(`${r.date}T${r.end_time}`))
                            : null;
                        return fromStart === d || fromEnd === d;
                    });
                }
                const present = !!rec; // any record for the day counts as present
                const duration = rec?.total_hours;
                row[`d_${d}`] = <Cell present={present} duration={duration} />;
            });
            return row;
        });
    }, [userToDateMap, dates, users, records]);

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox py={3}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <MDBox p={3} display="flex" alignItems="center" justifyContent="space-between">
                                <MDTypography variant="h6">Attendance Sheet</MDTypography>
                                <Button
                                    onClick={load}
                                    disabled={loading}
                                    variant="outlined"
                                    color="secondary"
                                    size="small"
                                >
                                    <Icon>refresh</Icon>&nbsp;Refresh
                                </Button>
                            </MDBox>
                            <MDBox>
                                <DataTable
                                    table={{ columns: dynamicColumns, rows }}
                                    isSorted={false}
                                    entriesPerPage={false}
                                    showTotalEntries
                                    noEndBorder
                                />
                            </MDBox>
                        </Card>
                    </Grid>
                </Grid>
            </MDBox>
        </DashboardLayout>
    );
}

export default AttendanceSheet;
