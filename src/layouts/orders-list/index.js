/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

// RD & Company CRM contexts
import { useAuth } from "contexts/AuthContext";

// API configuration
import { API_CONFIG, getApiUrl } from "config/api";

function OrdersList() {
  const { user, token } = useAuth();
  const [menu, setMenu] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    product_name: "",
    quantity: "",
    unit_price: "",
    total_amount: "",
    order_date: new Date().toISOString().split("T")[0],
    delivery_date: "",
    status: "pending",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");

  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      product_name: "",
      quantity: "",
      unit_price: "",
      total_amount: "",
      order_date: new Date().toISOString().split("T")[0],
      delivery_date: "",
      status: "pending",
      notes: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-calculate total amount when quantity or unit_price changes
    if (name === "quantity" || name === "unit_price") {
      const quantity =
        name === "quantity" ? parseFloat(value) || 0 : parseFloat(formData.quantity) || 0;
      const unitPrice =
        name === "unit_price" ? parseFloat(value) || 0 : parseFloat(formData.unit_price) || 0;
      const total = quantity * unitPrice;
      setFormData((prev) => ({
        ...prev,
        total_amount: total > 0 ? total.toString() : "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ORDERS), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh orders list
        await fetchOrders();
        handleCloseDialog();
        // You could add a success notification here
      } else {
        setError(data.message || "Failed to create order");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error("Error creating order:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ORDERS), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchOrders();
    } else {
      setLoading(false);
      setError("Authentication required");
    }
  }, [token, user]);

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "error";
      case "ORDERED WITH SUPPLIER":
        return "warning";
      case "BILLING DISPATCH":
        return "info";
      case "DELIVERED":
        return "success";
      default:
        return "dark";
    }
  };

  // Filter orders based on search term and filter
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();

    switch (searchFilter) {
      case "order_id":
        return order.order_id.toLowerCase().includes(searchLower);
      case "client_name":
        return order.client_name.toLowerCase().includes(searchLower);
      case "order_details":
        return order.order_details.toLowerCase().includes(searchLower);
      case "status":
        return order.status.toLowerCase().includes(searchLower);
      case "created_date":
        return order.created_date.toLowerCase().includes(searchLower);
      case "all":
      default:
        return (
          order.order_id.toLowerCase().includes(searchLower) ||
          order.client_name.toLowerCase().includes(searchLower) ||
          order.order_details.toLowerCase().includes(searchLower) ||
          order.status.toLowerCase().includes(searchLower) ||
          order.created_date.toLowerCase().includes(searchLower)
        );
    }
  });

  const columns = [
    { Header: "ORDER ID", accessor: "order_id", width: "15%" },
    { Header: "CLIENT NAME", accessor: "client_name", width: "20%" },
    { Header: "ORDER DETAILS", accessor: "order_details", width: "40%" },
    { Header: "STATUS", accessor: "status", width: "15%" },
    { Header: "CREATED DATE", accessor: "created_date", width: "10%" },
  ];

  const rows = filteredOrders.map((order) => ({
    order_id: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        #{order.order_id}
      </MDTypography>
    ),
    client_name: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {order.client_name}
      </MDTypography>
    ),
    order_details: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {order.order_details}
      </MDTypography>
    ),
    status: (
      <MDTypography
        variant="caption"
        color={getStatusColor(order.status)}
        fontWeight="bold"
        textTransform="uppercase"
      >
        {order.status}
      </MDTypography>
    ),
    created_date: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {order.created_date}
      </MDTypography>
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
                  Orders List
                </MDTypography>
                <MDButton
                  variant="gradient"
                  color="info"
                  size="small"
                  onClick={handleOpenDialog}
                  startIcon={<Icon>add</Icon>}
                >
                  Add Order
                </MDButton>
              </MDBox>
            </MDBox>
          </Card>
        </MDBox>

        {/* Search and Filter Section */}
        <Card>
          <MDBox p={3}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon>search</Icon>
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <MDButton
                          size="small"
                          onClick={() => setSearchTerm("")}
                          style={{ minWidth: "auto", padding: "4px" }}
                        >
                          <Icon fontSize="small">clear</Icon>
                        </MDButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Search In</InputLabel>
                  <Select
                    value={searchFilter}
                    label="Search In"
                    onChange={(e) => setSearchFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Fields</MenuItem>
                    <MenuItem value="order_id">Order ID</MenuItem>
                    <MenuItem value="client_name">Client Name</MenuItem>
                    <MenuItem value="order_details">Order Details</MenuItem>
                    <MenuItem value="status">Status</MenuItem>
                    <MenuItem value="created_date">Created Date</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <MDTypography variant="caption" color="text" fontWeight="medium">
                  {filteredOrders.length} of {orders.length} orders
                </MDTypography>
              </Grid>
            </Grid>
          </MDBox>
        </Card>

        <Card>
          <MDBox pt={3} px={3}>
            <MDTypography variant="h6" fontWeight="medium">
              Orders List
            </MDTypography>
          </MDBox>
          <MDBox pt={1} pb={2} px={3}>
            {loading ? (
              <MDBox display="flex" justifyContent="center" alignItems="center" py={4}>
                <MDTypography variant="body2" color="text">
                  Loading orders...
                </MDTypography>
              </MDBox>
            ) : error ? (
              <MDBox display="flex" justifyContent="center" alignItems="center" py={4}>
                <MDTypography variant="body2" color="error">
                  {error}
                </MDTypography>
              </MDBox>
            ) : filteredOrders.length === 0 && searchTerm ? (
              <MDBox
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                py={4}
              >
                <Icon fontSize="large" color="disabled" sx={{ mb: 2 }}>
                  search_off
                </Icon>
                <MDTypography variant="body2" color="text" fontWeight="medium">
                  No orders found matching "{searchTerm}"
                </MDTypography>
                <MDTypography variant="caption" color="text" sx={{ mt: 1 }}>
                  Try adjusting your search term or filter
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

      {/* Add Order Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <MDTypography variant="h6" fontWeight="medium">
            Add New Order
          </MDTypography>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Email"
                  name="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Phone"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Product Name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Unit Price"
                  name="unit_price"
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Total Amount"
                  name="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Order Date"
                  name="order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Delivery Date"
                  name="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={handleInputChange}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                    <MenuItem value="shipped">Shipped</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <MDButton onClick={handleCloseDialog} color="secondary">
              Cancel
            </MDButton>
            <MDButton type="submit" variant="gradient" color="info" disabled={submitting}>
              {submitting ? "Creating..." : "Create Order"}
            </MDButton>
          </DialogActions>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}

export default OrdersList;
