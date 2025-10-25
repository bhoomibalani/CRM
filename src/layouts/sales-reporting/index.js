/**
 * RD & Company CRM - Sales Person Reporting Layout
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
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

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
import salesApiService from "services/salesApi";
import { getApiUrl, API_CONFIG } from "config/api";


function SalesReporting() {
    const { token, user } = useAuth();

    // Check if user has sales role
    if (!user || user.role !== 'sales') {
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
                                This section is only accessible to sales personnel.
                            </MDTypography>
                        </MDBox>
                    </Card>
                </MDBox>
            </DashboardLayout>
        );
    }
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [viewingImage, setViewingImage] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        visit_date: new Date().toISOString().split('T')[0],
        client_id: null,
        client_name: '',
        client_email: '',
        client_phone: '',
        new_order: null, // Changed from false to null to match validation
        order_value: '',
        order_id: null,
        visit_photo: '', // Now stores file path instead of base64
        remarks: '',
        status: 'completed'
    });

    const [formErrors, setFormErrors] = useState({});

    // Fetch reports for the current sales person
    const fetchMyReports = async () => {
        setLoading(true);
        try {
            const result = await salesApiService.getSalesReports(token);

            if (result.success) {
                setReports(result.data || []);
            } else {
                setError(result.error || 'Failed to fetch reports');
                setReports([]);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            setError('Failed to fetch reports');
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (report = null) => {
        try {
            setSelectedReport(report);
            if (report) {
                // Populate form with existing report data
                setFormData({
                    visit_date: report.visit_date || new Date().toISOString().split('T')[0],
                    client_id: report.client_id || null,
                    client_name: report.client_name || '',
                    client_email: report.client_email || '',
                    client_phone: report.client_phone || '',
                    new_order: report.new_order || false,
                    order_value: report.order_value || '',
                    order_id: report.order_id || null,
                    visit_photo: report.visit_photo || '', // File path
                    remarks: report.remarks || '',
                    status: report.status || 'completed'
                });
                setSelectedImage(report.visit_photo_url || null);
            } else {
                // Reset form for new report
                setFormData({
                    visit_date: new Date().toISOString().split('T')[0],
                    client_id: null,
                    client_name: '',
                    client_email: '',
                    client_phone: '',
                    new_order: null, // Changed from false to null to match validation
                    order_value: '',
                    order_id: null,
                    visit_photo: '',
                    remarks: '',
                    status: 'completed'
                });
                setSelectedImage(null);
            }
            setFormErrors({});
            setError(null);
            setOpenDialog(true);
        } catch (error) {
            console.error('Error opening dialog:', error);
            setError('Failed to open form. Please try again.');
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedReport(null);
        setSelectedImage(null);
        setFormErrors({});
        setError(null);
    };

    const handleOpenImageViewer = (imageUrl) => {
        setViewingImage(imageUrl);
        setImageViewerOpen(true);
    };

    const handleCloseImageViewer = () => {
        setImageViewerOpen(false);
        setViewingImage(null);
    };

    const handleImageUpload = async (event) => {
        try {
            const file = event.target.files[0];
            console.log('Image upload started:', file);

            if (file) {
                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    setError('Image size must be less than 5MB');
                    return;
                }

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    setError('Please select a valid image file');
                    return;
                }

                // Create FormData for file upload
                const formData = new FormData();
                formData.append('photo', file);

                try {
                    // Upload file to server
                    const uploadUrl = getApiUrl(API_CONFIG.ENDPOINTS.SALES_UPLOAD_PHOTO);
                    console.log('Upload URL:', uploadUrl);
                    console.log('Token:', token ? 'Present' : 'Missing');
                    console.log('Token value:', token);
                    console.log('User:', user);
                    console.log('FormData:', formData);

                    const response = await fetch(uploadUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                        body: formData
                    });

                    console.log('Response status:', response.status);
                    console.log('Response headers:', response.headers);

                    const result = await response.json();
                    console.log('Upload response:', result);

                    if (result.success) {
                        console.log('File uploaded successfully:', result);
                        setSelectedImage(result.file_url);
                        setFormData(prev => ({
                            ...prev,
                            visit_photo: result.file_path
                        }));
                        setError(null); // Clear any previous errors
                    } else {
                        console.error('Upload failed:', result);
                        setError(result.message || 'Failed to upload image');
                    }
                } catch (uploadError) {
                    console.error('Upload error:', uploadError);
                    setError('Failed to upload image. Please try again.');
                }
            }
        } catch (error) {
            console.error('Error in image upload:', error);
            setError('Failed to upload image. Please try again.');
        }
    };

    const handleInputChange = (field, value) => {
        console.log(`Input change - Field: ${field}, Value: ${value}, Type: ${typeof value}`);
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.visit_date) {
            errors.visit_date = 'Visit date is required';
        }

        if (!formData.client_name || !formData.client_name.trim()) {
            errors.client_name = 'Client name is required';
        }

        if (!formData.client_email || !formData.client_email.trim()) {
            errors.client_email = 'Client email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
            errors.client_email = 'Please enter a valid email address';
        }

        if (!formData.client_phone || !formData.client_phone.trim()) {
            errors.client_phone = 'Client phone is required';
        }

        if (formData.new_order === null || formData.new_order === undefined) {
            errors.new_order = 'New order selection is required';
        }

        if (formData.new_order && (!formData.order_value || formData.order_value <= 0)) {
            errors.order_value = 'Order value is required for new orders';
        }

        if (!formData.visit_photo) {
            errors.visit_photo = 'Visit photo is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitReport = async () => {
        console.log('Form validation starting...', { formData, formErrors });

        if (!validateForm()) {
            console.log('Form validation failed', formErrors);
            return;
        }

        console.log('Form validation passed, submitting...');
        setSubmitting(true);
        setError(null);

        try {
            const salesData = {
                visit_date: formData.visit_date,
                client_id: formData.client_id || null,
                client_name: formData.client_name ? formData.client_name.trim() : '',
                client_email: formData.client_email ? formData.client_email.trim() : '',
                client_phone: formData.client_phone ? formData.client_phone.trim() : '',
                new_order: formData.new_order,
                order_value: formData.order_value ? parseFloat(formData.order_value) : null,
                order_id: formData.order_id || null,
                visit_photo: formData.visit_photo || null, // Now sends file path instead of base64
                remarks: formData.remarks ? formData.remarks.trim() : null,
                status: formData.status
            };

            console.log('Sales data being sent:', {
                ...salesData,
                visit_photo: salesData.visit_photo ? `${salesData.visit_photo.substring(0, 50)}...` : null
            });
            console.log('Visit date being sent:', salesData.visit_date, 'Type:', typeof salesData.visit_date);

            let result;
            if (selectedReport) {
                // Update existing report
                result = await salesApiService.updateSalesReport(selectedReport.id, salesData, token);
            } else {
                // Create new report
                result = await salesApiService.createSalesReport(salesData, token);
            }

            if (result.success) {
                setSuccess(result.message || (selectedReport ? 'Report updated successfully' : 'Report created successfully'));
                handleCloseDialog();
                // Refresh the reports list
                await fetchMyReports();
            } else {
                setError(result.error || 'Failed to save report');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };




    // Fetch reports when component mounts
    useEffect(() => {
        if (token && user) {
            fetchMyReports();
        }
    }, [token, user]);

    // Close success/error messages after 5 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Filter reports based on search term
    const filteredReports = (reports || []).filter((report) => {
        const matchesSearch =
            report.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.remarks?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Table columns configuration
    const columns = [
        { Header: "Date", accessor: "visit_date", width: "15%" },
        { Header: "Client", accessor: "client_name", width: "20%" },
        { Header: "New Order", accessor: "new_order", width: "12%" },
        { Header: "Order Value", accessor: "order_value", width: "15%" },
        { Header: "Visit Photo", accessor: "visit_photo", width: "15%" },
        { Header: "Status", accessor: "status", width: "10%" },
        { Header: "Actions", accessor: "actions", width: "13%", disableSortBy: true },
    ];

    // Table rows configuration
    const rows = (filteredReports || []).map((report) => ({
        visit_date: (
            <MDTypography variant="caption" color="text" fontWeight="medium">
                {report.visit_date ? (() => {
                    try {
                        return new Date(report.visit_date).toLocaleDateString();
                    } catch (e) {
                        return report.visit_date; // Fallback to raw value if parsing fails
                    }
                })() : 'N/A'}
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
        actions: (
            <MDBox display="flex" alignItems="center" gap={1}>
                <MDButton
                    variant="text"
                    color="info"
                    size="small"
                    onClick={() => handleOpenDialog(report)}
                >
                    <Icon>edit</Icon>
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
                        <MDBox p={3}>
                            <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <MDBox>
                                    <MDTypography variant="h4" fontWeight="medium">
                                        Sales Person Reporting
                                    </MDTypography>
                                    <MDTypography variant="body2" color="text">
                                        Create your sales visit reports
                                    </MDTypography>
                                </MDBox>
                                <MDButton
                                    variant="gradient"
                                    color="info"
                                    size="small"
                                    onClick={() => handleOpenDialog()}
                                >
                                    <Icon>add</Icon>&nbsp;New Report
                                </MDButton>
                            </MDBox>

                        </MDBox>
                    </Card>
                </MDBox>


                {/* My Reports Section */}
                <Card>
                    <MDBox pt={3} px={3}>
                        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <MDTypography variant="h6" fontWeight="medium">
                                My Reports
                            </MDTypography>
                            <MDBox display="flex" alignItems="center" gap={2}>
                                <MDInput
                                    type="text"
                                    placeholder="Search reports..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    size="small"
                                    sx={{ width: 200 }}
                                />
                                <MDButton
                                    variant="outlined"
                                    color="info"
                                    size="small"
                                    onClick={fetchMyReports}
                                    disabled={loading}
                                >
                                    <Icon>refresh</Icon>
                                </MDButton>
                            </MDBox>
                        </MDBox>
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
            </MDBox>

            {/* Report Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedReport ? "Edit Sales Report" : "Create New Sales Report"}
                </DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <MDInput
                                fullWidth
                                type="date"
                                label="Visit Date *"
                                value={formData.visit_date}
                                onChange={(e) => handleInputChange('visit_date', e.target.value)}
                                error={!!formErrors.visit_date}
                                helperText={formErrors.visit_date}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <MDInput
                                fullWidth
                                label="Client Name *"
                                value={formData.client_name}
                                onChange={(e) => handleInputChange('client_name', e.target.value)}
                                error={!!formErrors.client_name}
                                helperText={formErrors.client_name}
                                placeholder="Enter client name"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <MDInput
                                fullWidth
                                label="Client Email *"
                                type="email"
                                value={formData.client_email}
                                onChange={(e) => handleInputChange('client_email', e.target.value)}
                                error={!!formErrors.client_email}
                                helperText={formErrors.client_email}
                                placeholder="client@example.com"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <MDInput
                                fullWidth
                                label="Client Phone *"
                                value={formData.client_phone}
                                onChange={(e) => handleInputChange('client_phone', e.target.value)}
                                error={!!formErrors.client_phone}
                                helperText={formErrors.client_phone}
                                placeholder="+1 (555) 123-4567"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth error={!!formErrors.new_order}>
                                <InputLabel>New Order *</InputLabel>
                                <Select
                                    value={formData.new_order === null || formData.new_order === undefined ? "" : (formData.new_order ? "yes" : "no")}
                                    label="New Order *"
                                    onChange={(e) => handleInputChange('new_order', e.target.value === 'yes')}
                                >
                                    <MenuItem value="yes">Yes</MenuItem>
                                    <MenuItem value="no">No</MenuItem>
                                </Select>
                                {formErrors.new_order && (
                                    <MDTypography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                        {formErrors.new_order}
                                    </MDTypography>
                                )}
                                <MDTypography variant="caption" color="text" sx={{ mt: 0.5, ml: 1.5 }}>
                                    Select "Yes" if this visit resulted in a new order
                                </MDTypography>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <MDInput
                                fullWidth
                                label={formData.new_order ? "Order Value (₹) *" : "Order Value (₹)"}
                                type="number"
                                value={formData.order_value}
                                onChange={(e) => handleInputChange('order_value', e.target.value)}
                                error={!!formErrors.order_value}
                                helperText={formErrors.order_value || (!formData.new_order ? "Select 'Yes' for New Order to enable this field" : "Enter the order value")}
                                placeholder="Enter order value"
                                disabled={!formData.new_order}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MDInput
                                fullWidth
                                label="Remarks"
                                multiline
                                rows={3}
                                value={formData.remarks}
                                onChange={(e) => handleInputChange('remarks', e.target.value)}
                                placeholder="Enter visit remarks and details..."
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <MDTypography variant="body2" color="text" mb={1}>
                                Visit Photo *
                            </MDTypography>
                            <input
                                accept="image/*"
                                style={{ display: "none" }}
                                id="visit-photo-upload"
                                type="file"
                                onChange={handleImageUpload}
                            />
                            <label htmlFor="visit-photo-upload">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    fullWidth
                                    color={formErrors.visit_photo ? "error" : "primary"}
                                >
                                    <Icon>camera_alt</Icon>&nbsp;Upload Visit Photo
                                </Button>
                            </label>
                            {formErrors.visit_photo && (
                                <MDTypography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                    {formErrors.visit_photo}
                                </MDTypography>
                            )}
                            {selectedImage && (
                                <Box mt={2}>
                                    <Avatar
                                        src={selectedImage}
                                        alt="Visit Photo Preview"
                                        sx={{ width: 100, height: 100 }}
                                    />
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <MDButton onClick={handleCloseDialog} color="secondary" disabled={submitting}>
                        Cancel
                    </MDButton>
                    <MDButton
                        onClick={handleSubmitReport}
                        variant="gradient"
                        color="info"
                        disabled={submitting}
                    >
                        {submitting ? "Saving..." : (selectedReport ? "Update Report" : "Create Report")}
                    </MDButton>
                </DialogActions>
            </Dialog>

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

            {/* Success/Error Snackbar */}
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
            />
        </DashboardLayout>
    );
}

export default SalesReporting;
