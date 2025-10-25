/**
 * RD & Company CRM - Employee Profile Data
 */

export const userTableData = {
  columns: [
    { Header: "Name", accessor: "name", width: "25%" },
    { Header: "Email", accessor: "email", width: "30%" },
    { Header: "Role", accessor: "role", width: "15%" },
    { Header: "Status", accessor: "status", width: "15%" },
    { Header: "Actions", accessor: "actions", width: "15%", disableSortBy: true },
  ],

  rows: [
    {
      id: 1,
      name: "Admin User",
      email: "admin@rdcompany.com",
      role: "admin",
      status: "active",
      created_at: "2024-01-01",
      last_login: "2024-01-15",
    },
    {
      id: 2,
      name: "John Sales",
      email: "john.sales@rdcompany.com",
      role: "sales_person",
      status: "active",
      created_at: "2024-01-02",
      last_login: "2024-01-14",
    },
    {
      id: 3,
      name: "Sarah Office",
      email: "sarah.office@rdcompany.com",
      role: "office_staff",
      status: "active",
      created_at: "2024-01-03",
      last_login: "2024-01-13",
    },
    {
      id: 4,
      name: "Client ABC",
      email: "client@abc.com",
      role: "client",
      status: "active",
      created_at: "2024-01-04",
      last_login: "2024-01-12",
    },
    {
      id: 5,
      name: "Mike Sales",
      email: "mike.sales@rdcompany.com",
      role: "sales_person",
      status: "inactive",
      created_at: "2024-01-05",
      last_login: "2024-01-10",
    },
    {
      id: 6,
      name: "Client XYZ",
      email: "client@xyz.com",
      role: "client",
      status: "active",
      created_at: "2024-01-06",
      last_login: "2024-01-11",
    },
  ],
};
