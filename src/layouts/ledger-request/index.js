/**
 * RD & Company CRM - Ledger Request (Create New Request) Layout
 */

import { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import DataTable from "examples/Tables/DataTable";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import MDSnackbar from "components/MDSnackbar";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Context
import { useAuth } from "contexts/AuthContext";

// Services
import ledgerApi from "services/ledgerApi";

function LedgerRequest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [userRequests, setUserRequests] = useState([]);
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

  const loadUserRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await ledgerApi.getLedgers();

      if (response.success) {
        setUserRequests(response.data);
      } else {
        throw new Error(response.message || "Failed to load your requests");
      }
    } catch (error) {
      console.error("Error loading user requests:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to load your requests",
        severity: "error",
      });
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleDownloadFile = async (ledgerId) => {
    try {
      await ledgerApi.downloadLedgerFile(ledgerId);
      setSnackbar({
        open: true,
        message: "File download started!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to download file",
        severity: "error",
      });
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

      if (user.role === "sales" && !requestForm.client_id.trim()) {
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
        client_id: user.role === "client" ? user.id : requestForm.client_id,
      };

      console.log("Submitting ledger request:", ledgerData);
      const response = await ledgerApi.createLedger(ledgerData);

      if (response.success) {
        setSnackbar({
          open: true,
          message: "Ledger request created successfully!",
          severity: "success",
        });

        // Reset form
        setRequestForm({
          client_id: "",
          request_details: "",
          additional_notes: "",
        });

        // Reload user requests to show the new request
        await loadUserRequests();
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

  // Load user requests on component mount
  useEffect(() => {
    loadUserRequests();
  }, []);

  const handleInputChange = (field, value) => {
    setRequestForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={3}>
                <MDBox mb={3}>
                  <MDTypography variant="h4" fontWeight="medium" color="text">
                    Create New Ledger Request
                  </MDTypography>
                  <MDTypography variant="body2" color="text" mt={1}>
                    Submit a new request for ledger information. Please provide detailed information
                    about what you need.
                  </MDTypography>
                </MDBox>

                <Grid container spacing={3}>
                  {user.role === "sales" && (
                    <Grid item xs={12}>
                      <MDInput
                        fullWidth
                        label="Client ID"
                        placeholder="Enter client ID"
                        value={requestForm.client_id}
                        onChange={(e) => handleInputChange("client_id", e.target.value)}
                        required
                        disabled={loading}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <MDInput
                      fullWidth
                      label="Request Details"
                      multiline
                      rows={6}
                      placeholder="Describe what ledger information you need. Be as specific as possible about the time period, account details, and any special requirements..."
                      value={requestForm.request_details}
                      onChange={(e) => handleInputChange("request_details", e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <MDInput
                      fullWidth
                      label="Additional Notes"
                      multiline
                      rows={3}
                      placeholder="Any additional information, special requirements, or context that might be helpful..."
                      value={requestForm.additional_notes}
                      onChange={(e) => handleInputChange("additional_notes", e.target.value)}
                      disabled={loading}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <MDBox display="flex" justifyContent="flex-end" gap={2}>
                      <MDButton
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                          setRequestForm({
                            client_id: "",
                            request_details: "",
                            additional_notes: "",
                          });
                        }}
                        disabled={loading}
                      >
                        Clear Form
                      </MDButton>
                      <MDButton
                        variant="gradient"
                        color="info"
                        onClick={handleCreateLedger}
                        disabled={
                          loading ||
                          !requestForm.request_details.trim() ||
                          (user.role === "sales" && !requestForm.client_id.trim())
                        }
                        startIcon={loading ? <LinearProgress /> : <Icon>send</Icon>}
                      >
                        {loading ? "Submitting Request..." : "Submit Request"}
                      </MDButton>
                    </MDBox>
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* User's Own Requests Section */}
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3} px={3}>
                <MDTypography variant="h6" fontWeight="medium">
                  Your Ledger Requests
                </MDTypography>
              </MDBox>
              <MDBox pt={1} pb={2} px={3}>
                {loadingRequests ? (
                  <MDBox display="flex" justifyContent="center" py={4}>
                    <LinearProgress sx={{ width: "100%" }} />
                  </MDBox>
                ) : userRequests.length > 0 ? (
                  <DataTable
                    table={{
                      columns: [
                        { Header: "Request ID", accessor: "request_id", width: "15%" },
                        { Header: "Details", accessor: "request_details", width: "30%" },
                        { Header: "Status", accessor: "status", width: "15%" },
                        { Header: "Request Date", accessor: "request_date", width: "20%" },
                        { Header: "File", accessor: "file_info", width: "20%" },
                      ],
                      rows: userRequests.map((ledger) => ({
                        request_id: (
                          <MDTypography variant="caption" color="text" fontWeight="medium">
                            #{ledger.request_id}
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
                            <MDTypography
                              variant="caption"
                              color={
                                ledger.status === "confirmed"
                                  ? "success"
                                  : ledger.status === "uploaded"
                                  ? "info"
                                  : "warning"
                              }
                              fontWeight="medium"
                            >
                              {ledger.status.toUpperCase()}
                            </MDTypography>
                          </MDBox>
                        ),
                        request_date: (
                          <MDTypography variant="caption" color="text" fontWeight="medium">
                            {ledger.formatted_request_date ||
                              new Date(ledger.request_date).toLocaleDateString()}
                          </MDTypography>
                        ),
                        file_info: (
                          <MDBox>
                            {ledger.file_name ? (
                              <MDBox>
                                <MDTypography
                                  variant="caption"
                                  color="text"
                                  fontWeight="medium"
                                  display="block"
                                >
                                  📄 {ledger.file_name}
                                </MDTypography>
                                <MDTypography variant="caption" color="text" fontSize="10px">
                                  {(ledger.file_size / 1024).toFixed(1)} KB
                                </MDTypography>
                                <MDButton
                                  variant="text"
                                  color="primary"
                                  size="small"
                                  onClick={() => handleDownloadFile(ledger.id)}
                                  sx={{ p: 0, minWidth: "auto" }}
                                >
                                  <Icon fontSize="small">download</Icon>
                                </MDButton>
                              </MDBox>
                            ) : (
                              <MDTypography variant="caption" color="text" fontWeight="medium">
                                No file uploaded
                              </MDTypography>
                            )}
                          </MDBox>
                        ),
                      })),
                    }}
                    isSorted={false}
                    entriesPerPage={false}
                    showTotalEntries={false}
                    noEndBorder
                  />
                ) : (
                  <MDBox display="flex" justifyContent="center" py={4}>
                    <MDTypography variant="body2" color="text">
                      No ledger requests found. Create your first request above!
                    </MDTypography>
                  </MDBox>
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Snackbar for notifications */}
      <MDSnackbar
        open={snackbar.open}
        close={() => setSnackbar({ ...snackbar, open: false })}
        title="Notification"
        content={snackbar.message}
        color={snackbar.severity}
        icon="notifications"
        dateTime={new Date().toLocaleString()}
        autoHideDuration={6000}
      />
    </DashboardLayout>
  );
}

export default LedgerRequest;
