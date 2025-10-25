/**
 * RD & Company CRM - Order Management Layout
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
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import DataTable from "examples/Tables/DataTable";

// Context
import { useAuth } from "contexts/AuthContext";

// Data
import { orderTableData } from "./data";

const ORDER_STATUS = {
  PENDING: "pending",
  ORDERED_WITH_SUPPLIER: "ordered_with_supplier",
  BILLING_DISPATCH: "billing_dispatch",
  DELIVERED: "delivered",
};

function OrderManagement() {
  const { user, hasPermission } = useAuth();
  const [menu, setMenu] = useState(null);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const openMenu = (event) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  const handleOpenDialog = (order = null) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  useEffect(() => {
    // Mock data - replace with actual API call
    setOrders(orderTableData.rows);
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.remark.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    { Header: "Order ID", accessor: "order_id", width: "15%" },
    { Header: "Client Name", accessor: "client_name", width: "20%" },
    { Header: "Order Details", accessor: "order_details", width: "25%" },
    { Header: "Status", accessor: "status", width: "15%" },
    { Header: "Created Date", accessor: "created_date", width: "15%" },
    { Header: "Actions", accessor: "actions", width: "10%", disableSortBy: true },
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
        {order.order_details.length > 50
          ? `${order.order_details.substring(0, 50)}...`
          : order.order_details}
      </MDTypography>
    ),
    status: (
      <MDBox ml={-1}>
        <MDBox
          component="span"
          variant="caption"
          color={
            order.status === ORDER_STATUS.DELIVERED
              ? "success"
              : order.status === ORDER_STATUS.BILLING_DISPATCH
              ? "info"
              : order.status === ORDER_STATUS.ORDERED_WITH_SUPPLIER
              ? "warning"
              : "error"
          }
          fontWeight="medium"
        >
          {order.status.replace("_", " ").toUpperCase()}
        </MDBox>
      </MDBox>
    ),
    created_date: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {new Date(order.created_date).toLocaleDateString()}
      </MDTypography>
    ),
    actions: (
      <MDBox display="flex" alignItems="center" mt={{ xs: 2, sm: 0 }} ml={{ xs: -1.5, sm: 0 }}>
        <MDButton variant="text" color="dark" size="small" onClick={() => handleOpenDialog(order)}>
          <Icon>edit</Icon>
        </MDButton>
        <MDButton variant="text" color="error" size="small">
          <Icon>delete</Icon>
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
            <MDBox p={2}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <MDTypography variant="h6" fontWeight="medium">
                  Order Management
                </MDTypography>
                {hasPermission("create_orders") && (
                  <MDButton
                    variant="gradient"
                    color="info"
                    size="small"
                    onClick={() => handleOpenDialog()}
                  >
                    <Icon>add</Icon>&nbsp;New Order
                  </MDButton>
                )}
              </MDBox>

              <Grid container spacing={2} mb={2}>
                <Grid item xs={12} md={8}>
                  <MDInput
                    type="text"
                    placeholder="Search orders..."
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
                      <MenuItem value={ORDER_STATUS.PENDING}>Pending</MenuItem>
                      <MenuItem value={ORDER_STATUS.ORDERED_WITH_SUPPLIER}>
                        Ordered with Supplier
                      </MenuItem>
                      <MenuItem value={ORDER_STATUS.BILLING_DISPATCH}>Billing & Dispatch</MenuItem>
                      <MenuItem value={ORDER_STATUS.DELIVERED}>Delivered</MenuItem>
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
              Orders List
            </MDTypography>
          </MDBox>
          <MDBox pt={1} pb={2} px={3}>
            <DataTable
              table={{ columns, rows }}
              isSorted={false}
              entriesPerPage={false}
              showTotalEntries={false}
              noEndBorder
            />
          </MDBox>
        </Card>
      </MDBox>

      {/* Order Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedOrder ? "Edit Order" : "Create New Order"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Client Name</InputLabel>
                <Select
                  value={selectedOrder?.client_id || ""}
                  label="Client Name"
                  disabled={user?.role === "client"}
                >
                  <MenuItem value="1">Client ABC</MenuItem>
                  <MenuItem value="2">Client XYZ</MenuItem>
                  <MenuItem value="3">Client DEF</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={selectedOrder?.status || ORDER_STATUS.PENDING} label="Status">
                  <MenuItem value={ORDER_STATUS.PENDING}>Pending</MenuItem>
                  <MenuItem value={ORDER_STATUS.ORDERED_WITH_SUPPLIER}>
                    Ordered with Supplier
                  </MenuItem>
                  <MenuItem value={ORDER_STATUS.BILLING_DISPATCH}>Billing & Dispatch</MenuItem>
                  <MenuItem value={ORDER_STATUS.DELIVERED}>Delivered</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Order Details"
                multiline
                rows={4}
                value={selectedOrder?.order_details || ""}
                placeholder="Enter order details..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                multiline
                rows={2}
                value={selectedOrder?.remark || ""}
                placeholder="Enter any remarks..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseDialog} color="secondary">
            Cancel
          </MDButton>
          <MDButton onClick={handleCloseDialog} color="info">
            {selectedOrder ? "Update" : "Create"}
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
        <MenuItem onClick={closeMenu}>Edit</MenuItem>
        <MenuItem onClick={closeMenu}>Delete</MenuItem>
      </Menu>
    </DashboardLayout>
  );
}

export default OrderManagement;
