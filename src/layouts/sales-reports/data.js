/**
 * RD & Company CRM - Sales Reports Data
 */

export const salesReportsData = {
    analytics: {
        totalReports: 45,
        totalOrderValue: 1250000,
        newOrders: 23,
        completedReports: 42,
    },
    reports: [
        {
            id: 1,
            visit_date: "2024-01-15",
            sales_person: "John Doe",
            client_name: "Client ABC",
            new_order: true,
            order_value: 15000,
            status: "completed",
            remarks: "Successful meeting, client interested in new product line.",
        },
        {
            id: 2,
            visit_date: "2024-01-14",
            sales_person: "Jane Smith",
            client_name: "Client XYZ",
            new_order: false,
            order_value: null,
            status: "completed",
            remarks: "Follow-up visit for existing order. Client satisfied.",
        },
        {
            id: 3,
            visit_date: "2024-01-13",
            sales_person: "Mike Johnson",
            client_name: "Client DEF",
            new_order: true,
            order_value: 8500,
            status: "pending",
            remarks: "Initial meeting with new client. Showed product catalog.",
        },
    ],
};










