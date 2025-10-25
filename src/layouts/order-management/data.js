/**
 * RD & Company CRM - Order Management Data
 */

export const orderTableData = {
  columns: [
    { Header: "Order ID", accessor: "order_id", width: "15%" },
    { Header: "Client Name", accessor: "client_name", width: "20%" },
    { Header: "Order Details", accessor: "order_details", width: "25%" },
    { Header: "Status", accessor: "status", width: "15%" },
    { Header: "Created Date", accessor: "created_date", width: "15%" },
    { Header: "Actions", accessor: "actions", width: "10%", disableSortBy: true },
  ],

  rows: [
    {
      id: 1,
      order_id: "ORD-001",
      client_id: 1,
      client_name: "Client ABC",
      order_details:
        "50 units of Product A, 25 units of Product B with special packaging requirements",
      status: "pending",
      remark: "Urgent delivery required",
      created_date: "2024-01-15",
      created_by: 2,
      updated_date: "2024-01-15",
    },
    {
      id: 2,
      order_id: "ORD-002",
      client_id: 2,
      client_name: "Client XYZ",
      order_details: "100 units of Product C with custom labeling",
      status: "ordered_with_supplier",
      remark: "Supplier confirmed delivery in 2 weeks",
      created_date: "2024-01-14",
      created_by: 2,
      updated_date: "2024-01-14",
    },
    {
      id: 3,
      order_id: "ORD-003",
      client_id: 3,
      client_name: "Client DEF",
      order_details: "75 units of Product D, 30 units of Product E",
      status: "billing_dispatch",
      remark: "Ready for dispatch",
      created_date: "2024-01-13",
      created_by: 3,
      updated_date: "2024-01-15",
    },
    {
      id: 4,
      order_id: "ORD-004",
      client_id: 1,
      client_name: "Client ABC",
      order_details: "200 units of Product F",
      status: "delivered",
      remark: "Successfully delivered and confirmed by client",
      created_date: "2024-01-10",
      created_by: 2,
      updated_date: "2024-01-12",
    },
    {
      id: 5,
      order_id: "ORD-005",
      client_id: 2,
      client_name: "Client XYZ",
      order_details: "150 units of Product G with special handling",
      status: "pending",
      remark: "Awaiting client confirmation",
      created_date: "2024-01-12",
      created_by: 2,
      updated_date: "2024-01-12",
    },
  ],
};
