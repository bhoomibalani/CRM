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

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// @mui icons - removed social media icons

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";

// Overview page components
import Header from "layouts/profile/components/Header";

// Context
import { useAuth } from "contexts/AuthContext";

function Overview() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mb={2} />
      <Header>
        <MDBox mt={5} mb={3}>
          <Grid container spacing={3}>
            {/* Profile Information Card */}
            <Grid item xs={12} md={8} lg={6}>
              <ProfileInfoCard
                title="Profile Information"
                description={`Welcome to your profile, ${user?.name || "User"}! ${user?.role ? `You are logged in as a ${user.role}` : "Here you can view your account details"}.`}
                info={{
                  "Full Name": user?.name || "Not available",
                  "Email Address": user?.email || "Not available",
                  "User Role": user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Not available",
                  "User ID": user?.id || "Not available",
                }}
                action={{ route: "", tooltip: "Edit Profile" }}
                shadow={true}
              />
            </Grid>

            {/* Additional Info Card */}
            <Grid item xs={12} md={4} lg={6}>
              <Card sx={{ height: "100%", p: 3 }}>
                <MDBox display="flex" alignItems="center" mb={2}>
                  <Icon color="info" sx={{ mr: 1 }}>
                    account_circle
                  </Icon>
                  <MDTypography variant="h6" fontWeight="medium">
                    Account Status
                  </MDTypography>
                </MDBox>

                <MDBox mb={2}>
                  <MDBox display="flex" alignItems="center" mb={1}>
                    <Icon color="success" sx={{ mr: 1, fontSize: "1rem" }}>
                      check_circle
                    </Icon>
                    <MDTypography variant="body2" color="text">
                      Account Active
                    </MDTypography>
                  </MDBox>

                  <MDBox display="flex" alignItems="center" mb={1}>
                    <Icon color="info" sx={{ mr: 1, fontSize: "1rem" }}>
                      security
                    </Icon>
                    <MDTypography variant="body2" color="text">
                      Role: {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Not assigned"}
                    </MDTypography>
                  </MDBox>

                  <MDBox display="flex" alignItems="center" mb={1}>
                    <Icon color="primary" sx={{ mr: 1, fontSize: "1rem" }}>
                      email
                    </Icon>
                    <MDTypography variant="body2" color="text">
                      {user?.email || "No email"}
                    </MDTypography>
                  </MDBox>
                </MDBox>

              </Card>
            </Grid>
          </Grid>
        </MDBox>
      </Header>
    </DashboardLayout>
  );
}

export default Overview;
