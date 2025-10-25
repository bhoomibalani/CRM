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
    order_date: new Date().toISOString().split("T")[0],
    delivery_date: "",
    status: "pending",
    notes: "",
  });

  const [products, setProducts] = useState([
    { product_name: "", quantity: "", unit_price: "", total_amount: "" }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);

  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  const toggleExpandedOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

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
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value,
    };

    // Auto-calculate total amount when quantity or unit_price changes
    if (field === "quantity" || field === "unit_price") {
      const quantity = field === "quantity" ? parseFloat(value) || 0 : parseFloat(updatedProducts[index].quantity) || 0;
      const unitPrice = field === "unit_price" ? parseFloat(value) || 0 : parseFloat(updatedProducts[index].unit_price) || 0;
      const total = quantity * unitPrice;
      updatedProducts[index].total_amount = total > 0 ? total.toString() : "";
    }

    setProducts(updatedProducts);
  };

  const addProduct = () => {
    if (products.length < 15) {
      setProducts([...products, { product_name: "", quantity: "", unit_price: "", total_amount: "" }]);
    }
  };

  const removeProduct = (index) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate products
      const validProducts = products.filter(p => p.product_name && p.quantity && p.unit_price);
      if (validProducts.length === 0) {
        setError("Please add at least one product");
        setSubmitting(false);
        return;
      }

      const orderData = {
        ...formData,
        products: validProducts,
        total_amount: validProducts.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0)
      };

      console.log("Creating order with data:", orderData);
      console.log("API URL:", getApiUrl(API_CONFIG.ENDPOINTS.ORDERS));

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ORDERS), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HTTP Error:", response.status, errorText);
        setError(`Server error (${response.status}): ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        // Refresh orders list
        await fetchOrders();
        handleCloseDialog();
        setError(null);
      } else {
        setError(data.message || "Failed to create order");
      }
    } catch (err) {
      console.error("Network error details:", err);
      setError(`Network error: ${err.message}. Please check if the backend server is running on http://127.0.0.1:8000`);
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
      <MDBox>
        <MDTypography
          variant="caption"
          color="text"
          fontWeight="medium"
          sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
          onClick={() => toggleExpandedOrder(order.id)}
        >
          {order.order_details} {order.product_count > 1 ? `(${order.product_count} products)` : ''}
          <Icon sx={{ ml: 1, fontSize: '16px' }}>
            {expandedOrder === order.id ? 'expand_less' : 'expand_more'}
          </Icon>
        </MDTypography>
        {expandedOrder === order.id && order.items && order.items.length > 0 && (
          <MDBox mt={1} ml={2}>
            {order.items.map((item, index) => (
              <MDBox key={index} display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                <MDTypography variant="caption" color="text" fontWeight="medium">
                  {item.product_name} (Qty: {item.quantity})
                </MDTypography>
                <MDTypography variant="caption" color="text" fontWeight="bold">
                  ₹{item.total_amount}
                </MDTypography>
              </MDBox>
            ))}
            <MDBox display="flex" justifyContent="space-between" alignItems="center" mt={1} pt={1} borderTop="1px solid" borderColor="grey.300">
              <MDTypography variant="caption" color="text" fontWeight="bold">
                Total Amount:
              </MDTypography>
              <MDTypography variant="caption" color="primary" fontWeight="bold">
                ₹{order.total_amount}
              </MDTypography>
            </MDBox>
          </MDBox>
        )}
      </MDBox>
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
                  label="Customer Email (Optional)"
                  name="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
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
              {/* Products Section */}
              <Grid item xs={12}>
                <MDTypography variant="h6" fontWeight="medium" mb={2}>
                  Products ({products.length}/15)
                </MDTypography>
                {products.map((product, index) => (
                  <Card key={index} sx={{ mb: 2, p: 2 }}>
                    <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <MDTypography variant="subtitle2" fontWeight="medium">
                        Product {index + 1}
                      </MDTypography>
                      {products.length > 1 && (
                        <MDButton
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => removeProduct(index)}
                        >
                          Remove
                        </MDButton>
                      )}
                    </MDBox>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Product Name"
                          value={product.product_name}
                          onChange={(e) => handleProductChange(index, "product_name", e.target.value)}
                          required
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Quantity"
                          type="number"
                          value={product.quantity}
                          onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                          required
                          margin="normal"
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Unit Price"
                          type="number"
                          step="0.01"
                          value={product.unit_price}
                          onChange={(e) => handleProductChange(index, "unit_price", e.target.value)}
                          required
                          margin="normal"
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label="Total"
                          type="number"
                          step="0.01"
                          value={product.total_amount}
                          disabled
                          margin="normal"
                        />
                      </Grid>
                    </Grid>
                  </Card>
                ))}
                {products.length < 15 && (
                  <MDButton
                    variant="outlined"
                    color="info"
                    onClick={addProduct}
                    startIcon={<Icon>add</Icon>}
                    sx={{ mb: 2 }}
                  >
                    Add Product
                  </MDButton>
                )}
                {products.length >= 15 && (
                  <MDTypography variant="caption" color="warning" display="block">
                    Maximum 15 products reached
                  </MDTypography>
                )}
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
