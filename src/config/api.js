// API Configuration
export const API_CONFIG = {
  // Laravel backend base URL
  BASE_URL: "http://127.0.0.1:8000",

  // API Endpoints (Laravel)
  ENDPOINTS: {
    LOGIN: "/api/login",
    LOGOUT: "/api/logout",
    VERIFY: "/api/verify",
    USERS: "/api/admin/users",
    ORDERS: "/api/orders",
    TASKS: "/api/tasks",
    TASK_USERS: "/api/tasks/users",
    ATTENDANCE_STATUS: "/api/attendance/status",
    ATTENDANCE_START: "/api/attendance/start",
    ATTENDANCE_END: "/api/attendance/end",
    ATTENDANCE_HISTORY: "/api/attendance/history",
    ATTENDANCE_ALL: "/api/attendance/all",
    SALES_REPORTS: "/api/sales/reports",
    SALES_UPLOAD_PHOTO: "/api/sales/upload-photo",
    LEDGERS: "/api/ledgers",
    LEDGER_UPLOAD: "/api/ledgers/{id}/upload",
    LEDGER_DOWNLOAD: "/api/ledgers/{id}/download",
    CLIENT_PAYMENTS: "/api/client-payments",
    CLIENT_PAYMENT_STATUS: "/api/client-payments/{id}/status",
    CLIENT_PAYMENT_SALES_PERSONS: "/api/client-payments/sales-persons",
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
