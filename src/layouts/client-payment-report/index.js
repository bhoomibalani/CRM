/**
 * RD & Company CRM - Client Payment Report Layout
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
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";

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
import clientPaymentApiService from "services/clientPaymentApi";

function ClientPaymentReport() {
    const { token, user } = useAuth();



    // Check if user has appropriate role
    if (!user || !['client', 'admin', 'manager', 'office'].includes(user.role)) {
        return (
            <DashboardLayout>
                <DashboardNavbar />
                <MDBox py={3}>
                    <Card>
                        <MDBox p={3} textAlign="center">
                            <MDTypography variant="h6" color="error" fontWeight="medium">
                                Access Denied
                            </MDTypography>
                            <MDTypography variant="body2" color="text" mt={2}>
                                This section is only accessible to clients, admin, manager, and office personnel.
                            </MDTypography>
                        </MDBox>
                    </Card>
                </MDBox>
            </DashboardLayout>
        );
    }

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [salesPersons, setSalesPersons] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");

    // Form state
    const [formData, setFormData] = useState({
        sales_person_id: "",
        amount: "",
        payment_method: "",
        transaction_reference: "",
        payment_date: new Date().toISOString().split('T')[0],
        description: "",
    });

    const [formErrors, setFormErrors] = useState({});

    // Fetch payments
    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await clientPaymentApiService.getClientPayments(
                statusFilter === "all" ? null : statusFilter,
                token
            );
            if (response.success) {
                setPayments(response.payments);
            } else {
                setError(response.message || "Failed to fetch payments");
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch sales persons
    const fetchSalesPersons = async () => {
        try {
            const response = await clientPaymentApiService.getSalesPersons(token);
            if (response.success) {
                setSalesPersons(response.sales_persons);
            }
        } catch (error) {
            console.error("Error fetching sales persons:", error);
        }
    };

    useEffect(() => {
        fetchPayments();
        if (user.role === 'client') {
            fetchSalesPersons();
        }
    }, [statusFilter]);

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setFormData({
            sales_person_id: "",
            amount: "",
            payment_method: "",
            transaction_reference: "",
            payment_date: new Date().toISOString().split('T')[0],
            description: "",
        });
        setFormErrors({});
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedPayment(null);
        setFormData({
            sales_person_id: "",
            amount: "",
            payment_method: "",
            transaction_reference: "",
            payment_date: new Date().toISOString().split('T')[0],
            description: "",
        });
        setFormErrors({});
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.sales_person_id) {
            errors.sales_person_id = 'Sales person is required';
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            errors.amount = 'Amount must be greater than 0';
        }

        if (!formData.payment_method) {
            errors.payment_method = 'Payment method is required';
        }

        if (!formData.payment_date) {
            errors.payment_date = 'Payment date is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await clientPaymentApiService.createClientPayment(formData, token);
            if (response.success) {
                setSuccess("Payment report submitted successfully");
                handleCloseDialog();
                fetchPayments();
            } else {
                setError(response.message || "Failed to submit payment report");
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (paymentId, status, adminNotes = "") => {
        try {
            const response = await clientPaymentApiService.updatePaymentStatus(paymentId, status, adminNotes, token);
            if (response.success) {
                setSuccess(`Payment ${status} successfully`);
                fetchPayments();
            } else {
                setError(response.message || `Failed to ${status} payment`);
            }
        } catch (error) {
            setError(error.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "warning";
            case "approved":
                return "success";
            case "rejected":
                return "error";
            default:
                return "default";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "pending":
                return "schedule";
            case "approved":
                return "check_circle";
            case "rejected":
                return "cancel";
            default:
                return "help";
        }
    };

    // Table columns configuration
    const columns = [
        { Header: "Date", accessor: "payment_date", width: "12%" },
        { Header: "Client", accessor: "client_name", width: "15%" },
        { Header: "Sales Person", accessor: "sales_person", width: "15%" },
        { Header: "Amount", accessor: "amount", width: "12%" },
        { Header: "Method", accessor: "payment_method", width: "12%" },
        { Header: "Status", accessor: "status", width: "12%" },
        { Header: "Actions", accessor: "actions", width: "22%", disableSortBy: true },
    ];

    const rows = payments.map((payment) => ({
        payment_date: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                {new Date(payment.payment_date).toLocaleDateString()}
            </MDTypography>
        ),
        client_name: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                {payment.client?.name || "N/A"}
            </MDTypography>
        ),
        sales_person: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                {payment.sales_person?.name || "N/A"}
            </MDTypography>
        ),
        amount: (
            <MDTypography variant="caption" color="text" fontWeight="bold">
                ₹{payment.amount?.toLocaleString()}
            </MDTypography>
        ),
        payment_method: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                {payment.payment_method?.replace('_', ' ').toUpperCase()}
            </MDTypography>
        ),
        status: (
            <Chip
                icon={<Icon>{getStatusIcon(payment.status)}</Icon>}
                label={payment.status?.toUpperCase()}
                color={getStatusColor(payment.status)}
                size="small"
                variant="outlined"
            />
        ),
        actions: (
            <Box display="flex" gap={1}>
                {payment.status === "pending" && (user.role === "admin" || user.role === "manager" || user.role === "office") && (
                    <>
                        <MDButton
                            variant="outlined"
                            color="success"
                            size="small"
                            onClick={() => handleStatusUpdate(payment.id, "approved")}
                        >
                            Approve
                        </MDButton>
                        <MDButton
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleStatusUpdate(payment.id, "rejected")}
                        >
                            Reject
                        </MDButton>
                    </>
                )}
                {payment.status !== "pending" && payment.approver && (
                    <MDTypography variant="caption" color="text">
                        By: {payment.approver.name}
                    </MDTypography>
                )}
            </Box>
        ),
    }));

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox py={3}>
                {/* Report Payment Button - Only for Clients */}
                {user.role === "client" && (
                    <MDBox mb={3}>
                        <Card>
                            <MDBox p={3} textAlign="center">
                                <MDTypography variant="h6" fontWeight="medium" mb={2}>
                                    Report a New Payment
                                </MDTypography>
                                <MDTypography variant="body2" color="text" mb={3}>
                                    Submit payment details for approval
                                </MDTypography>
                                <MDButton
                                    variant="contained"
                                    color="info"
                                    size="large"
                                    onClick={handleOpenDialog}
                                    startIcon={<Icon>payment</Icon>}
                                >
                                    Report Payment
                                </MDButton>
                            </MDBox>
                        </Card>
                    </MDBox>
                )}

                <MDBox mb={3}>
                    <Card>
                        <MDBox p={3}>
                            <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <MDTypography variant="h5" fontWeight="medium">
                                    Payment Reports
                                </MDTypography>
                            </MDBox>

                            {/* Status Filter */}
                            <MDBox mb={3}>
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Filter by Status</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        label="Filter by Status"
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <MenuItem value="all">All Status</MenuItem>
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="approved">Approved</MenuItem>
                                        <MenuItem value="rejected">Rejected</MenuItem>
                                    </Select>
                                </FormControl>
                            </MDBox>

                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            {loading ? (
                                <MDBox display="flex" justifyContent="center" py={4}>
                                    <MDTypography variant="body2" color="text">
                                        Loading payments...
                                    </MDTypography>
                                </MDBox>
                            ) : payments.length === 0 ? (
                                <MDBox textAlign="center" py={4}>
                                    <MDTypography variant="body2" color="text">
                                        No payment reports found
                                    </MDTypography>
                                </MDBox>
                            ) : (
                                <DataTable
                                    table={{
                                        columns,
                                        rows,
                                    }}
                                    isSorted={false}
                                    entriesPerPage={false}
                                    showTotalEntries={false}
                                    noEndBorder
                                />
                            )}
                        </MDBox>
                    </Card>
                </MDBox>

                {/* Payment Report Dialog */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>Report Payment to Sales Person</DialogTitle>
                    <form onSubmit={handleSubmit}>
                        <DialogContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth error={!!formErrors.sales_person_id}>
                                        <InputLabel>Sales Person *</InputLabel>
                                        <Select
                                            value={formData.sales_person_id}
                                            label="Sales Person *"
                                            onChange={(e) => handleInputChange('sales_person_id', e.target.value)}
                                        >
                                            {salesPersons.map((person) => (
                                                <MenuItem key={person.id} value={person.id}>
                                                    {person.name} ({person.email})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {formErrors.sales_person_id && (
                                            <MDTypography variant="caption" color="error">
                                                {formErrors.sales_person_id}
                                            </MDTypography>
                                        )}
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <MDInput
                                        fullWidth
                                        label="Amount (₹) *"
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => handleInputChange('amount', e.target.value)}
                                        error={!!formErrors.amount}
                                        helperText={formErrors.amount}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth error={!!formErrors.payment_method}>
                                        <InputLabel>Payment Method *</InputLabel>
                                        <Select
                                            value={formData.payment_method}
                                            label="Payment Method *"
                                            onChange={(e) => handleInputChange('payment_method', e.target.value)}
                                        >
                                            <MenuItem value="cash">Cash</MenuItem>
                                            <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                                            <MenuItem value="cheque">Cheque</MenuItem>
                                            <MenuItem value="upi">UPI</MenuItem>
                                            <MenuItem value="other">Other</MenuItem>
                                        </Select>
                                        {formErrors.payment_method && (
                                            <MDTypography variant="caption" color="error">
                                                {formErrors.payment_method}
                                            </MDTypography>
                                        )}
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <MDInput
                                        fullWidth
                                        label="Transaction Reference"
                                        value={formData.transaction_reference}
                                        onChange={(e) => handleInputChange('transaction_reference', e.target.value)}
                                        placeholder="Optional: Transaction ID, Cheque number, etc."
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <MDInput
                                        fullWidth
                                        label="Payment Date *"
                                        type="date"
                                        value={formData.payment_date}
                                        onChange={(e) => handleInputChange('payment_date', e.target.value)}
                                        error={!!formErrors.payment_date}
                                        helperText={formErrors.payment_date}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Description"
                                        multiline
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        placeholder="Optional: Additional details about the payment"
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button type="submit" variant="contained" disabled={submitting}>
                                {submitting ? "Submitting..." : "Submit Report"}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Success/Error Snackbar */}
                {(success || error) && (
                    <MDSnackbar
                        color={success ? "success" : "error"}
                        icon={success ? "check" : "warning"}
                        title={success ? "Success" : "Error"}
                        content={success || error}
                        open={!!(success || error)}
                        close={() => {
                            setSuccess(null);
                            setError(null);
                        }}
                        autoHideDuration={5000}
                        dateTime={new Date().toLocaleString()}
                    />
                )}
            </MDBox>
        </DashboardLayout>
    );
}

export default ClientPaymentReport;
