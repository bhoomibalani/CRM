/**
 * RD & Company CRM - Ledger Request Management Layout
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

// Data
import { ledgerTableData } from "./data";

const LEDGER_STATUS = {
  PENDING: "pending",
  UPLOADED: "uploaded",
  CONFIRMED: "confirmed",
};

function LedgerManagement() {
  const { user, hasPermission } = useAuth();
  const [menu, setMenu] = useState(null);
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [requestForm, setRequestForm] = useState({
    client_id: "",
    request_details: "",
    additional_notes: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  const handleOpenRequestDialog = () => {
    setOpenRequestDialog(true);
  };

  const handleCloseRequestDialog = () => {
    setOpenRequestDialog(false);
  };

  const handleOpenUploadDialog = (ledger = null) => {
    setSelectedLedger(ledger);
    setOpenUploadDialog(true);
  };

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);
    setSelectedLedger(null);
    setUploadProgress(0);
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
      const response = await ledgerApi.getLedgers({
        status: statusFilter,
        search: searchTerm,
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

  const handleCreateLedger = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!requestForm.request_details.trim()) {
        setSnackbar({
          open: true,
          message: "Request details are required",
          severity: "error",
        });
        setLoading(false);
        return;
      }

      if (user.role === 'sales' && !requestForm.client_id.trim()) {
        setSnackbar({
          open: true,
          message: "Client ID is required for sales users",
          severity: "error",
        });
        setLoading(false);
        return;
      }

      // Set client_id to current user if they are a client
      const ledgerData = {
        request_details: requestForm.request_details.trim(),
        additional_notes: requestForm.additional_notes.trim(),
        client_id: user.role === 'client' ? user.id : requestForm.client_id,
      };

      console.log('Submitting ledger request:', ledgerData);
      const response = await ledgerApi.createLedger(ledgerData);

      if (response.success) {
        setSnackbar({
          open: true,
          message: "Ledger request created successfully!",
          severity: "success",
        });

        // Reset form and close dialog
        setRequestForm({
          client_id: "",
          request_details: "",
          additional_notes: "",
        });
        setLoading(false);
        handleCloseRequestDialog();

        // Refresh ledgers list
        await loadLedgers();
      } else {
        throw new Error(response.message || "Failed to create ledger request");
      }
    } catch (error) {
      console.error("Error creating ledger:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to create ledger request",
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
    request_date: new Date(ledger.request_date).toLocaleDateString(),
    uploaded_date: ledger.uploaded_date ? new Date(ledger.uploaded_date).toLocaleDateString() : null,
  }));

  const filteredLedgers = transformedLedgers.filter((ledger) => {
    const matchesSearch =
      ledger.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ledger.request_details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || ledger.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    { Header: "Request ID", accessor: "request_id", width: "15%" },
    { Header: "Client Name", accessor: "client_name", width: "20%" },
    { Header: "Request Details", accessor: "request_details", width: "25%" },
    { Header: "Status", accessor: "status", width: "15%" },
    { Header: "Request Date", accessor: "request_date", width: "15%" },
    { Header: "Actions", accessor: "actions", width: "10%", disableSortBy: true },
  ];

  const rows = filteredLedgers.map((ledger) => ({
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
      </MDBox>
    ),
    request_date: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {new Date(ledger.request_date).toLocaleDateString()}
      </MDTypography>
    ),
    actions: (
      <MDBox display="flex" alignItems="center" mt={{ xs: 2, sm: 0 }} ml={{ xs: -1.5, sm: 0 }}>
        {ledger.status === LEDGER_STATUS.PENDING && hasPermission("upload_ledgers") && (
          <MDButton
            variant="text"
            color="info"
            size="small"
            onClick={() => handleOpenUploadDialog(ledger)}
          >
            <Icon>upload</Icon>
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
          >
            <Icon>download</Icon>
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
                  Ledger Request Management
                </MDTypography>
                {hasPermission("request_ledgers") && (
                  <MDButton
                    variant="gradient"
                    color="info"
                    size="small"
                    onClick={handleOpenRequestDialog}
                  >
                    <Icon>add</Icon>&nbsp;Request Ledger
                  </MDButton>
                )}
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
              Ledger Requests List
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

      {/* Request Ledger Dialog */}
      <Dialog open={openRequestDialog} onClose={handleCloseRequestDialog} maxWidth="md" fullWidth>
        <DialogTitle>Request New Ledger</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {user.role === 'sales' && (
              <Grid item xs={12}>
                <MDInput
                  fullWidth
                  label="Client ID"
                  placeholder="Enter client ID"
                  value={requestForm.client_id}
                  onChange={(e) => setRequestForm({ ...requestForm, client_id: e.target.value })}
                  required
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <MDInput
                fullWidth
                label="Request Details"
                multiline
                rows={4}
                placeholder="Describe what ledger information you need..."
                value={requestForm.request_details}
                onChange={(e) => setRequestForm({ ...requestForm, request_details: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <MDInput
                fullWidth
                label="Additional Notes"
                multiline
                rows={2}
                placeholder="Any additional information or special requirements..."
                value={requestForm.additional_notes}
                onChange={(e) => setRequestForm({ ...requestForm, additional_notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseRequestDialog} color="secondary">
            Cancel
          </MDButton>
          <MDButton
            onClick={handleCreateLedger}
            color="info"
            disabled={loading || !requestForm.request_details.trim() || (user.role === 'sales' && !requestForm.client_id.trim())}
          >
            {loading ? "Creating..." : "Submit Request"}
          </MDButton>
        </DialogActions>
      </Dialog>

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

export default LedgerManagement;
