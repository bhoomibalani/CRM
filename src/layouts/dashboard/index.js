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
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

// Services
import dashboardApi from "services/dashboardApi";

// Context
import { useAuth } from "contexts/AuthContext";

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: { count: 0, growth: 0, growthLabel: "than last month" },
    activeClients: { count: 0, growth: 0, growthLabel: "than last month" },
    pendingTasks: { count: 0, change: 0, changeLabel: "than yesterday" },
    ledgerRequests: { count: 0, pendingUploads: 0, pendingLabel: "awaiting upload" }
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getDashboardStats();

      if (response.success) {
        setStats(response.data);
      } else {
        console.error("Failed to load dashboard stats:", response.message);
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* Welcome Section */}
        <MDBox mb={3}>
          <Card>
            <MDBox p={3}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center">
                <MDBox>
                  <MDTypography variant="h4" fontWeight="medium" color="text">
                    Welcome back, {user?.name || "User"}!
                  </MDTypography>
                  <MDTypography variant="body2" color="text">
                    Here&apos;s what&apos;s happening with your CRM today.
                  </MDTypography>
                </MDBox>
                <MDBox>
                  <MDButton
                    variant="gradient"
                    color="info"
                    size="small"
                    onClick={() => (window.location.href = "/user-management")}
                  >
                    <Icon>people</Icon>&nbsp;Manage Users
                  </MDButton>
                </MDBox>
              </MDBox>
            </MDBox>
          </Card>
        </MDBox>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="info"
                icon="shopping_cart"
                title="Total Orders"
                count={loading ? "..." : stats.totalOrders.count}
                percentage={{
                  color: stats.totalOrders.growth >= 0 ? "success" : "error",
                  amount: loading ? "..." : `${stats.totalOrders.growth >= 0 ? "+" : ""}${stats.totalOrders.growth}%`,
                  label: stats.totalOrders.growthLabel,
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="people"
                title="Active Clients"
                count={loading ? "..." : stats.activeClients.count}
                percentage={{
                  color: stats.activeClients.growth >= 0 ? "success" : "error",
                  amount: loading ? "..." : `${stats.activeClients.growth >= 0 ? "+" : ""}${stats.activeClients.growth}%`,
                  label: stats.activeClients.growthLabel,
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="warning"
                icon="assignment"
                title="Pending Tasks"
                count={loading ? "..." : stats.pendingTasks.count}
                percentage={{
                  color: stats.pendingTasks.change >= 0 ? "error" : "success",
                  amount: loading ? "..." : `${stats.pendingTasks.change >= 0 ? "+" : ""}${stats.pendingTasks.change}`,
                  label: stats.pendingTasks.changeLabel,
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="error"
                icon="account_balance"
                title="Ledger Requests"
                count={loading ? "..." : stats.ledgerRequests.count}
                percentage={{
                  color: "info",
                  amount: loading ? "..." : `${stats.ledgerRequests.pendingUploads} pending`,
                  label: stats.ledgerRequests.pendingLabel,
                }}
              />
            </MDBox>
          </Grid>
        </Grid>
        {/* Charts section removed per request */}
        {/* Removed Projects and Orders Overview sections per request */}
      </MDBox>
    </DashboardLayout>
  );
}

export default Dashboard;
