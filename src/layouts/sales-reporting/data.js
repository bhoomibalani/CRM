/**
 * RD & Company CRM - Sales Reporting Data
 */

export const salesReportTableData = {
    columns: [
        { Header: "Date", accessor: "visit_date", width: "15%" },
        { Header: "Client", accessor: "client_name", width: "20%" },
        { Header: "New Order", accessor: "new_order", width: "15%" },
        { Header: "Order Value", accessor: "order_value", width: "15%" },
        { Header: "Visit Photo", accessor: "visit_photo", width: "15%" },
        { Header: "Remarks", accessor: "remarks", width: "15%" },
        { Header: "Actions", accessor: "actions", width: "5%", disableSortBy: true },
    ],

    rows: [
        {
            id: 1,
            visit_date: "2024-01-15",
            client_id: 1,
            client_name: "Client ABC",
            new_order: true,
            order_value: 15000,
            visit_photo: "https://via.placeholder.com/150x150/4CAF50/FFFFFF?text=Visit+1",
            remarks:
                "Successful meeting, client interested in new product line. Discussed pricing and delivery terms.",
            sales_person_id: 2,
            created_date: "2024-01-15",
        },
        {
            id: 2,
            visit_date: "2024-01-14",
            client_id: 2,
            client_name: "Client XYZ",
            new_order: false,
            order_value: null,
            visit_photo: "https://via.placeholder.com/150x150/2196F3/FFFFFF?text=Visit+2",
            remarks: "Follow-up visit for existing order. Client satisfied with current service.",
            sales_person_id: 2,
            created_date: "2024-01-14",
        },
        {
            id: 3,
            visit_date: "2024-01-13",
            client_id: 3,
            client_name: "Client DEF",
            new_order: true,
            order_value: 8500,
            visit_photo: "https://via.placeholder.com/150x150/FF9800/FFFFFF?text=Visit+3",
            remarks:
                "Initial meeting with new client. Showed product catalog and discussed requirements.",
            sales_person_id: 5,
            created_date: "2024-01-13",
        },
        {
            id: 4,
            visit_date: "2024-01-12",
            client_id: 1,
            client_name: "Client ABC",
            new_order: false,
            order_value: null,
            visit_photo: "https://via.placeholder.com/150x150/9C27B0/FFFFFF?text=Visit+4",
            remarks: "Regular check-in visit. Discussed upcoming projects and timeline.",
            sales_person_id: 2,
            created_date: "2024-01-12",
        },
        {
            id: 5,
            visit_date: "2024-01-11",
            client_id: 4,
            client_name: "Client GHI",
            new_order: true,
            order_value: 22000,
            visit_photo: "https://via.placeholder.com/150x150/E91E63/FFFFFF?text=Visit+5",
            remarks:
                "Product demonstration completed successfully. Client placed order for premium package.",
            sales_person_id: 3,
            created_date: "2024-01-11",
        },
    ],
};










