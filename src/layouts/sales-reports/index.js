/**
 * RD & Company CRM - Sales Reports Layout
 */

import { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

// Context
import { useAuth } from "contexts/AuthContext";

// Services
import salesApiService from "services/salesApi";

function SalesReports() {
    const { user, hasPermission, token } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState("30"); // Last 30 days
    const [salesPersonFilter, setSalesPersonFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [viewingImage, setViewingImage] = useState(null);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const result = await salesApiService.getSalesReports(token, {
                date_from: getDateFromRange(dateRange),
                sales_person_id: salesPersonFilter !== 'all' ? salesPersonFilter : null,
                status: statusFilter !== 'all' ? statusFilter : null
            });

            if (result.success) {
                setReports(result.data || []);
            } else {
                setReports([]);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const getDateFromRange = (range) => {
        const today = new Date();
        const daysAgo = new Date(today.getTime() - (parseInt(range) * 24 * 60 * 60 * 1000));
        return daysAgo.toISOString().split('T')[0];
    };

    const handleOpenImageViewer = (imageUrl) => {
        setViewingImage(imageUrl);
        setImageViewerOpen(true);
    };

    const handleCloseImageViewer = () => {
        setImageViewerOpen(false);
        setViewingImage(null);
    };

    useEffect(() => {
        if (token) {
            fetchReports();
        }
    }, [token, dateRange, salesPersonFilter, statusFilter]);


    const columns = [
        { Header: "Date", accessor: "visit_date", width: "10%" },
        { Header: "Sales Person", accessor: "sales_person", width: "12%" },
        { Header: "Client", accessor: "client_name", width: "15%" },
        { Header: "New Order", accessor: "new_order", width: "10%" },
        { Header: "Order Value", accessor: "order_value", width: "12%" },
        { Header: "Visit Photo", accessor: "visit_photo", width: "12%" },
        { Header: "Status", accessor: "status", width: "10%" },
        { Header: "Remarks", accessor: "remarks", width: "19%" },
    ];

    const rows = reports.map((report) => ({
        visit_date: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                {report.visit_date ? new Date(report.visit_date).toLocaleDateString() : 'N/A'}
            </MDTypography>
        ),
        sales_person: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                {report.sales_person || 'N/A'}
            </MDTypography>
        ),
        client_name: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                {report.client_name || 'N/A'}
            </MDTypography>
        ),
        new_order: (
            <MDBox ml={-1}>
                <MDBox
                    component="span"
                    variant="caption"
                    color={report.new_order ? "success" : "text"}
                    fontWeight="medium"
                >
                    {report.new_order ? "Yes" : "No"}
                </MDBox>
            </MDBox>
        ),
        order_value: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                ₹{report.order_value?.toLocaleString() || "-"}
            </MDTypography>
        ),
        visit_photo: (
            <Box display="flex" alignItems="center">
                {report.visit_photo_url ? (
                    <Avatar
                        src={report.visit_photo_url}
                        alt="Visit Photo"
                        sx={{
                            width: 40,
                            height: 40,
                            cursor: "pointer",
                            "&:hover": {
                                opacity: 0.8,
                                transform: "scale(1.05)"
                            }
                        }}
                        onClick={() => {
                            if (report.visit_photo_url) {
                                handleOpenImageViewer(report.visit_photo_url);
                            }
                        }}
                    />
                ) : (
                    <MDTypography variant="caption" color="text">
                        No Photo
                    </MDTypography>
                )}
            </Box>
        ),
        status: (
            <MDBox ml={-1}>
                <MDBox
                    component="span"
                    variant="caption"
                    color={
                        report.status === 'completed' ? 'success' :
                            report.status === 'pending' ? 'warning' : 'error'
                    }
                    fontWeight="medium"
                >
                    {report.status || 'N/A'}
                </MDBox>
            </MDBox>
        ),
        remarks: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                {report.remarks || 'N/A'}
            </MDTypography>
        ),
    }));

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox py={3}>
                {/* Filters */}
                <Card mb={3}>
                    <MDBox p={3}>
                        <MDTypography variant="h6" fontWeight="medium" mb={2}>
                            Filters
                        </MDTypography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Date Range</InputLabel>
                                    <Select
                                        value={dateRange}
                                        label="Date Range"
                                        onChange={(e) => setDateRange(e.target.value)}
                                    >
                                        <MenuItem value="7">Last 7 days</MenuItem>
                                        <MenuItem value="30">Last 30 days</MenuItem>
                                        <MenuItem value="90">Last 90 days</MenuItem>
                                        <MenuItem value="365">Last year</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Sales Person</InputLabel>
                                    <Select
                                        value={salesPersonFilter}
                                        label="Sales Person"
                                        onChange={(e) => setSalesPersonFilter(e.target.value)}
                                    >
                                        <MenuItem value="all">All Sales Persons</MenuItem>
                                        <MenuItem value="1">John Doe</MenuItem>
                                        <MenuItem value="2">Jane Smith</MenuItem>
                                        <MenuItem value="3">Mike Johnson</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        label="Status"
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <MenuItem value="all">All Status</MenuItem>
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="completed">Completed</MenuItem>
                                        <MenuItem value="cancelled">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </MDBox>
                </Card>

                {/* Reports Table */}
                <Card>
                    <MDBox pt={3} px={3}>
                        <MDTypography variant="h6" fontWeight="medium">
                            Sales Reports
                        </MDTypography>
                    </MDBox>
                    <MDBox pt={1} pb={2} px={3}>
                        {loading ? (
                            <MDBox display="flex" justifyContent="center" py={4}>
                                <CircularProgress />
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

                {/* Image Viewer Modal */}
                <Dialog
                    open={imageViewerOpen}
                    onClose={handleCloseImageViewer}
                    maxWidth="lg"
                    fullWidth
                    PaperProps={{
                        sx: {
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                            maxHeight: '90vh'
                        }
                    }}
                >
                    <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
                        {viewingImage && (
                            <Box sx={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
                                <img
                                    src={viewingImage}
                                    alt="Visit Photo"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '80vh',
                                        borderRadius: '8px',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                        objectFit: 'contain'
                                    }}
                                />
                                <MDButton
                                    onClick={handleCloseImageViewer}
                                    sx={{
                                        position: 'absolute',
                                        top: 16,
                                        right: 16,
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0,0,0,0.7)'
                                        }
                                    }}
                                    size="small"
                                >
                                    <Icon>close</Icon>
                                </MDButton>
                            </Box>
                        )}
                    </DialogContent>
                </Dialog>
            </MDBox>
        </DashboardLayout>
    );
}

export default SalesReports;


