/**
 * RD & Company CRM - Ledger Request List (View/Manage Requests) Layout
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
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import MDSnackbar from "components/MDSnackbar";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import DataTable from "examples/Tables/DataTable";

// Context
import { useAuth } from "contexts/AuthContext";

// Services
import ledgerApi from "services/ledgerApi";

const LEDGER_STATUS = {
    PENDING: "pending",
    UPLOADED: "uploaded",
    CONFIRMED: "confirmed",
};

function LedgerRequestList() {
    const { user, hasPermission } = useAuth();
    const [menu, setMenu] = useState(null);
    const [ledgers, setLedgers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [openFilePreviewDialog, setOpenFilePreviewDialog] = useState(false);
    const [selectedLedger, setSelectedLedger] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const openMenu = (event) => setMenu(event.currentTarget);
    const closeMenu = () => setMenu(null);

    const handleOpenUploadDialog = (ledger = null) => {
        setSelectedLedger(ledger);
        setOpenUploadDialog(true);
    };

    const handleCloseUploadDialog = () => {
        setOpenUploadDialog(false);
        setSelectedLedger(null);
        setUploadProgress(0);
    };

    const handleOpenFilePreview = (ledger) => {
        setSelectedLedger(ledger);
        setOpenFilePreviewDialog(true);
    };

    const handleCloseFilePreview = () => {
        setOpenFilePreviewDialog(false);
        setSelectedLedger(null);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (file && selectedLedger) {
            try {
                setUploadProgress(0);
                setLoading(true);

                // Simulate progress
                const progressInterval = setInterval(() => {
                    setUploadProgress((prev) => {
                        if (prev >= 90) {
                            clearInterval(progressInterval);
                            return 90;
                        }
                        return prev + 10;
                    });
                }, 200);

                await ledgerApi.uploadLedgerFile(selectedLedger.id, file);

                setUploadProgress(100);
                setSnackbar({
                    open: true,
                    message: "Ledger file uploaded successfully!",
                    severity: "success",
                });

                // Refresh ledgers list
                await loadLedgers();
                handleCloseUploadDialog();

            } catch (error) {
                console.error("Upload error:", error);
                setSnackbar({
                    open: true,
                    message: error.message || "Failed to upload file",
                    severity: "error",
                });
            } finally {
                setLoading(false);
                setUploadProgress(0);
            }
        }
    };

    const loadLedgers = async () => {
        try {
            setLoading(true);
            // Load all ledgers for management view (no filtering by user)
            const response = await ledgerApi.getLedgers({
                status: statusFilter,
                search: searchTerm,
                all_ledgers: true, // This will be handled by the backend
            });

            if (response.success) {
                setLedgers(response.data);
            } else {
                throw new Error(response.message || "Failed to load ledgers");
            }
        } catch (error) {
            console.error("Error loading ledgers:", error);
            setSnackbar({
                open: true,
                message: error.message || "Failed to load ledgers",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadLedger = async (ledgerId) => {
        try {
            await ledgerApi.downloadLedgerFile(ledgerId);
            setSnackbar({
                open: true,
                message: "File download started!",
                severity: "success",
            });
        } catch (error) {
            console.error("Error downloading ledger:", error);
            setSnackbar({
                open: true,
                message: error.message || "Failed to download file",
                severity: "error",
            });
        }
    };

    const handleUpdateLedgerStatus = async (ledgerId, newStatus) => {
        try {
            setLoading(true);
            const response = await ledgerApi.updateLedger(ledgerId, { status: newStatus });

            if (response.success) {
                setSnackbar({
                    open: true,
                    message: `Ledger status updated to ${newStatus}!`,
                    severity: "success",
                });

                // Refresh ledgers list
                await loadLedgers();
            } else {
                throw new Error(response.message || "Failed to update ledger status");
            }
        } catch (error) {
            console.error("Error updating ledger:", error);
            setSnackbar({
                open: true,
                message: error.message || "Failed to update ledger status",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadLedgers();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [statusFilter, searchTerm]);

    // Transform ledgers data for display
    const transformedLedgers = ledgers.map((ledger) => ({
        ...ledger,
        client_name: ledger.client?.name || 'Unknown Client',
        request_date: ledger.formatted_request_date || new Date(ledger.request_date).toLocaleDateString(),
        uploaded_date: ledger.formatted_uploaded_date || (ledger.uploaded_date ? new Date(ledger.uploaded_date).toLocaleDateString() : null),
    }));

    const filteredLedgers = transformedLedgers.filter((ledger) => {
        const matchesSearch =
            ledger.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ledger.request_details.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || ledger.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const columns = [
        { Header: "Request ID", accessor: "request_id", width: "12%" },
        { Header: "Client Name", accessor: "client_name", width: "15%" },
        { Header: "Request Details", accessor: "request_details", width: "20%" },
        { Header: "Status", accessor: "status", width: "10%" },
        { Header: "Request Date", accessor: "request_date", width: "12%" },
        { Header: "Uploaded File", accessor: "uploaded_file", width: "15%" },
        { Header: "Uploaded Date", accessor: "uploaded_date", width: "12%" },
        { Header: "Actions", accessor: "actions", width: "14%", disableSortBy: true },
    ];

    const rows = filteredLedgers.map((ledger) => {
        // Debug log for upload button visibility
        console.log('Ledger:', ledger.request_id, 'Status:', ledger.status, 'Should show upload:', ledger.status === LEDGER_STATUS.PENDING);

        return {
            request_id: (
                <MDTypography variant="caption" color="text" fontWeight="medium">
                    #{ledger.request_id}
                </MDTypography>
            ),
            client_name: (
                <MDTypography variant="caption" color="text" fontWeight="medium">
                    {ledger.client_name}
                </MDTypography>
            ),
            request_details: (
                <MDTypography variant="caption" color="text" fontWeight="medium">
                    {ledger.request_details.length > 50
                        ? `${ledger.request_details.substring(0, 50)}...`
                        : ledger.request_details}
                </MDTypography>
            ),
            status: (
                <MDBox ml={-1}>
                    <MDBox
                        component="span"
                        variant="caption"
                        color={
                            ledger.status === LEDGER_STATUS.CONFIRMED
                                ? "success"
                                : ledger.status === LEDGER_STATUS.UPLOADED
                                    ? "info"
                                    : "warning"
                        }
                        fontWeight="medium"
                    >
                        {ledger.status.toUpperCase()}
                    </MDBox>
                    {ledger.status === LEDGER_STATUS.PENDING && (
                        <MDBox mt={0.5}>
                            <MDTypography variant="caption" color="info" fontSize="10px">
                                📤 Upload Available
                            </MDTypography>
                        </MDBox>
                    )}
                </MDBox>
            ),
            request_date: (
                <MDTypography variant="caption" color="text" fontWeight="medium">
                    {ledger.request_date}
                </MDTypography>
            ),
            uploaded_file: (
                <MDBox>
                    {ledger.file_name ? (
                        <MDBox>
                            <MDTypography variant="caption" color="text" fontWeight="medium" display="block">
                                📄 {ledger.file_name}
                            </MDTypography>
                            <MDTypography variant="caption" color="text" fontSize="10px">
                                {(ledger.file_size / 1024).toFixed(1)} KB
                            </MDTypography>
                        </MDBox>
                    ) : (
                        <MDTypography variant="caption" color="text" fontWeight="medium">
                            No file uploaded
                        </MDTypography>
                    )}
                </MDBox>
            ),
            uploaded_date: (
                <MDBox>
                    {ledger.uploaded_date ? (
                        <MDBox>
                            <MDTypography variant="caption" color="text" fontWeight="medium" display="block">
                                {ledger.uploaded_date}
                            </MDTypography>
                            {ledger.uploader && (
                                <MDTypography variant="caption" color="text" fontSize="10px">
                                    by {ledger.uploader.name}
                                </MDTypography>
                            )}
                        </MDBox>
                    ) : (
                        <MDTypography variant="caption" color="text" fontWeight="medium">
                            Not uploaded
                        </MDTypography>
                    )}
                </MDBox>
            ),
            actions: (
                <MDBox display="flex" alignItems="center" mt={{ xs: 2, sm: 0 }} ml={{ xs: -1.5, sm: 0 }}>
                    {ledger.status === LEDGER_STATUS.PENDING && (
                        <MDButton
                            variant="contained"
                            color="info"
                            size="small"
                            onClick={() => handleOpenUploadDialog(ledger)}
                            title="Upload ledger file"
                            startIcon={<Icon>upload</Icon>}
                        >
                            Upload
                        </MDButton>
                    )}
                    {ledger.status === LEDGER_STATUS.UPLOADED && user.role === 'client' && (
                        <MDButton
                            variant="text"
                            color="success"
                            size="small"
                            onClick={() => handleUpdateLedgerStatus(ledger.id, 'confirmed')}
                            disabled={loading}
                        >
                            <Icon>check</Icon>
                        </MDButton>
                    )}
                    {ledger.status === LEDGER_STATUS.CONFIRMED && (
                        <MDButton
                            variant="text"
                            color="primary"
                            size="small"
                            onClick={() => handleDownloadLedger(ledger.id)}
                            disabled={loading}
                            title="Download file"
                        >
                            <Icon>download</Icon>
                        </MDButton>
                    )}
                    {ledger.file_name && (
                        <MDButton
                            variant="text"
                            color="info"
                            size="small"
                            onClick={() => handleOpenFilePreview(ledger)}
                            disabled={loading}
                            title="View file details"
                        >
                            <Icon>visibility</Icon>
                        </MDButton>
                    )}
                    {hasPermission("manage_ledgers") && (
                        <MDButton
                            variant="text"
                            color="error"
                            size="small"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this ledger request?')) {
                                    // Add delete functionality here
                                    console.log('Delete ledger:', ledger.id);
                                }
                            }}
                            disabled={loading}
                        >
                            <Icon>delete</Icon>
                        </MDButton>
                    )}
                </MDBox>
            ),
        };
    });

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
                                        All Ledger Requests (Management View)
                                    </MDTypography>
                                    <MDTypography variant="caption" color="text" fontSize="12px">
                                        {ledgers.filter(l => l.status === LEDGER_STATUS.PENDING).length} pending requests available for upload
                                    </MDTypography>
                                </MDBox>
                            </MDBox>

                            <Grid container spacing={2} mb={2}>
                                <Grid item xs={12} md={8}>
                                    <MDInput
                                        type="text"
                                        placeholder="Search ledger requests..."
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
                                            <MenuItem value={LEDGER_STATUS.PENDING}>Pending</MenuItem>
                                            <MenuItem value={LEDGER_STATUS.UPLOADED}>Uploaded</MenuItem>
                                            <MenuItem value={LEDGER_STATUS.CONFIRMED}>Confirmed</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </MDBox>
                    </Card>
                </MDBox>

                <Card>
                    <MDBox pt={3} px={3}>
                        <MDTypography variant="h6" fontWeight="medium">
                            All Ledger Requests
                        </MDTypography>
                    </MDBox>
                    <MDBox pt={1} pb={2} px={3}>
                        {loading ? (
                            <MDBox display="flex" justifyContent="center" py={4}>
                                <LinearProgress sx={{ width: '100%' }} />
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

            {/* Upload Ledger Dialog */}
            <Dialog open={openUploadDialog} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Upload Ledger</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <MDTypography variant="body2" color="text" mb={2}>
                                Upload ledger for: {selectedLedger?.client_name}
                            </MDTypography>
                            <input
                                accept=".pdf,.xlsx,.xls,.csv"
                                style={{ display: "none" }}
                                id="ledger-upload"
                                type="file"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="ledger-upload">
                                <Button variant="outlined" component="span" fullWidth>
                                    <Icon>cloud_upload</Icon>&nbsp;Choose File
                                </Button>
                            </label>
                            {uploadProgress > 0 && (
                                <MDBox mt={2}>
                                    <LinearProgress variant="determinate" value={uploadProgress} />
                                    <MDTypography variant="caption" color="text">
                                        Uploading... {uploadProgress}%
                                    </MDTypography>
                                </MDBox>
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <MDButton onClick={handleCloseUploadDialog} color="secondary">
                        Cancel
                    </MDButton>
                    <MDButton onClick={handleCloseUploadDialog} color="info" disabled={uploadProgress < 100}>
                        Upload
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
                <MenuItem onClick={closeMenu}>Download</MenuItem>
                <MenuItem onClick={closeMenu}>Delete</MenuItem>
            </Menu>

            {/* File Preview Dialog */}
            <Dialog open={openFilePreviewDialog} onClose={handleCloseFilePreview} maxWidth="md" fullWidth>
                <DialogTitle>File Details</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <MDTypography variant="h6" color="text" mb={2}>
                                Uploaded File Information
                            </MDTypography>
                        </Grid>
                        <Grid item xs={12}>
                            <MDBox display="flex" flexDirection="column" gap={1}>
                                <MDTypography variant="body2" color="text">
                                    <strong>File Name:</strong> {selectedLedger?.file_name}
                                </MDTypography>
                                <MDTypography variant="body2" color="text">
                                    <strong>File Size:</strong> {selectedLedger?.file_size ? (selectedLedger.file_size / 1024).toFixed(1) + ' KB' : 'Unknown'}
                                </MDTypography>
                                <MDTypography variant="body2" color="text">
                                    <strong>Uploaded Date:</strong> {selectedLedger?.formatted_uploaded_date || 'Unknown'}
                                </MDTypography>
                                <MDTypography variant="body2" color="text">
                                    <strong>Uploaded By:</strong> {selectedLedger?.uploader?.name || 'Unknown'}
                                </MDTypography>
                                <MDTypography variant="body2" color="text">
                                    <strong>Request ID:</strong> {selectedLedger?.request_id}
                                </MDTypography>
                                <MDTypography variant="body2" color="text">
                                    <strong>Client:</strong> {selectedLedger?.client_name}
                                </MDTypography>
                            </MDBox>
                        </Grid>
                        <Grid item xs={12}>
                            <MDBox display="flex" gap={2} mt={2}>
                                <MDButton
                                    variant="gradient"
                                    color="info"
                                    onClick={() => {
                                        handleDownloadLedger(selectedLedger?.id);
                                        handleCloseFilePreview();
                                    }}
                                >
                                    <Icon>download</Icon>&nbsp;Download File
                                </MDButton>
                                <MDButton
                                    variant="outlined"
                                    color="secondary"
                                    onClick={handleCloseFilePreview}
                                >
                                    Close
                                </MDButton>
                            </MDBox>
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>

            {/* Snackbar for notifications */}
            <MDSnackbar
                open={snackbar.open}
                close={() => setSnackbar({ ...snackbar, open: false })}
                title="Notification"
                content={snackbar.message}
                color={snackbar.severity}
                icon="notifications"
                autoHideDuration={6000}
            />
        </DashboardLayout>
    );
}

export default LedgerRequestList;
