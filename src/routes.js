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

/** 
  All of the routes for the Material Dashboard 2 React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Material Dashboard 2 React layouts
import Dashboard from "layouts/dashboard";
import Tables from "layouts/tables";
import RTL from "layouts/rtl";
import Profile from "layouts/profile";
import SignIn from "layouts/authentication/sign-in";

// RD & Company CRM layouts
import UserManagement from "layouts/user-management";
import OrdersList from "layouts/orders-list";
import LedgerManagement from "layouts/ledger-management";
import LedgerRequest from "layouts/ledger-request";
import LedgerRequestList from "layouts/ledger-request-list";
import TaskManagement from "layouts/task-management";
import AttendanceManagement from "layouts/attendance-management";
import MarkAttendance from "layouts/attendance-mark";
import AttendanceSheet from "layouts/attendance-sheet";
import CRMSignIn from "layouts/authentication/crm-sign-in";
import SalesReporting from "layouts/sales-reporting";
import SalesReports from "layouts/sales-reports";

// Components
import RoleBasedRoute from "components/RoleBasedRoute";

// @mui icons
import Icon from "@mui/material/Icon";

const routes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <Dashboard />,
  },
  {
    type: "title",
    title: "CRM Management",
    key: "crm-management",
  },
  {
    type: "collapse",
    name: "Employee Profile",
    key: "user-management",
    icon: <Icon fontSize="small">people</Icon>,
    route: "/user-management",
    requiredRoles: ["admin", "manager", "office"],
    component: (
      <RoleBasedRoute requiredRoles={["admin", "manager", "office"]}>
        <UserManagement />
      </RoleBasedRoute>
    ),
  },
  {
    type: "collapse",
    name: "Orders List",
    key: "orders-list",
    icon: <Icon fontSize="small">shopping_cart</Icon>,
    route: "/orders-list",
    requiredRoles: ["admin", "office"],
    component: (
      <RoleBasedRoute requiredRoles={["admin", "office"]}>
        <OrdersList />
      </RoleBasedRoute>
    ),
  },
  {
    type: "collapse",
    name: "Ledger Request",
    key: "ledger-request",
    icon: <Icon fontSize="small">add_circle</Icon>,
    route: "/ledger-request",
    requiredRoles: ["client", "sales"],
    component: (
      <RoleBasedRoute requiredRoles={["client", "sales"]}>
        <LedgerRequest />
      </RoleBasedRoute>
    ),
  },
  {
    type: "collapse",
    name: "Ledger Request List",
    key: "ledger-request-list",
    icon: <Icon fontSize="small">list_alt</Icon>,
    route: "/ledger-request-list",
    component: <LedgerRequestList />,
  },
  {
    type: "collapse",
    name: "Task Management",
    key: "task-management",
    icon: <Icon fontSize="small">assignment</Icon>,
    route: "/task-management",
    requiredRoles: ["admin", "manager", "office"],
    component: (
      <RoleBasedRoute requiredRoles={["admin", "manager", "office"]}>
        <TaskManagement />
      </RoleBasedRoute>
    ),
  },
  {
    type: "collapse",
    name: "Mark Attendance",
    key: "attendance-mark",
    icon: <Icon fontSize="small">login</Icon>,
    route: "/attendance/mark",
    requiredRoles: ["admin", "manager", "office", "sales"],
    component: (
      <RoleBasedRoute requiredRoles={["admin", "manager", "office", "sales"]}>
        <MarkAttendance />
      </RoleBasedRoute>
    ),
  },
  {
    type: "collapse",
    name: "Attendance Sheet",
    key: "attendance-sheet",
    icon: <Icon fontSize="small">grid_on</Icon>,
    route: "/attendance/sheet",
    requiredRoles: ["admin", "manager", "office"],
    component: (
      <RoleBasedRoute requiredRoles={["admin", "manager", "office"]}>
        <AttendanceSheet />
      </RoleBasedRoute>
    ),
  },
  {
    type: "divider",
    key: "divider-1",
  },
  {
    type: "title",
    title: "Sales Management",
    key: "sales-management",
  },
  {
    type: "collapse",
    name: "Sales Person Reporting",
    key: "sales-reporting",
    icon: <Icon fontSize="small">person_pin</Icon>,
    route: "/sales-reporting",
    requiredRoles: ["sales"],
    component: (
      <RoleBasedRoute requiredRoles={["sales"]}>
        <SalesReporting />
      </RoleBasedRoute>
    ),
  },
  {
    type: "collapse",
    name: "Sales Reports",
    key: "sales-reports",
    icon: <Icon fontSize="small">analytics</Icon>,
    route: "/sales-reports",
    requiredRoles: ["admin", "office"],
    component: (
      <RoleBasedRoute requiredRoles={["admin", "office"]}>
        <SalesReports />
      </RoleBasedRoute>
    ),
  },
  {
    type: "divider",
    key: "divider-2",
  },
  {
    type: "title",
    title: "System",
    key: "system",
  },
  {
    type: "collapse",
    name: "Profile",
    key: "profile",
    icon: <Icon fontSize="small">person</Icon>,
    route: "/profile",
    component: <Profile />,
  },
  {
    type: "collapse",
    name: "Sign In",
    key: "sign-in",
    icon: <Icon fontSize="small">login</Icon>,
    route: "/authentication/sign-in",
    component: <CRMSignIn />,
  },
];

export default routes;
