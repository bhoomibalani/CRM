import { getApiUrl, API_CONFIG } from "../config/api";

class SalesApiService {
    constructor() {
        this.baseUrl = getApiUrl(API_CONFIG.ENDPOINTS.SALES_REPORTS);
    }

    getHeaders(token) {
        return {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    /**
     * Create a new sales report
     * @param {Object} salesData - Sales report data
     * @param {string} token - Authentication token
     * @returns {Promise<Object>} API response
     */
    async createSalesReport(salesData, token) {
        try {
            const response = await fetch(this.baseUrl, {
                method: "POST",
                headers: this.getHeaders(token),
                body: JSON.stringify(salesData),
            });

            // Check if response is HTML (error page) instead of JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Backend server is not responding properly. Please ensure the Laravel backend is running on http://127.0.0.1:8000");
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return {
                success: true,
                data: data.report,
                message: data.message,
            };
        } catch (error) {
            console.error("Error creating sales report:", error);
            return {
                success: false,
                error: error.message || "Failed to create sales report",
            };
        }
    }

    /**
     * Get all sales reports
     * @param {string} token - Authentication token
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} API response
     */
    async getSalesReports(token, filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            // Add filters to query parameters
            Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                    queryParams.append(key, filters[key]);
                }
            });

            const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl;

            const response = await fetch(url, {
                method: "GET",
                headers: this.getHeaders(token),
            });

            // Check if response is HTML (error page) instead of JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Backend server is not responding properly. Please ensure the Laravel backend is running on http://127.0.0.1:8000");
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return {
                success: true,
                data: data.reports,
                message: data.message,
            };
        } catch (error) {
            console.error("Error fetching sales reports:", error);
            return {
                success: false,
                error: error.message || "Failed to fetch sales reports",
            };
        }
    }

    /**
     * Get a single sales report
     * @param {number} reportId - Report ID
     * @param {string} token - Authentication token
     * @returns {Promise<Object>} API response
     */
    async getSalesReport(reportId, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${reportId}`, {
                method: "GET",
                headers: this.getHeaders(token),
            });

            // Check if response is HTML (error page) instead of JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Backend server is not responding properly. Please ensure the Laravel backend is running on http://127.0.0.1:8000");
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return {
                success: true,
                data: data.report,
                message: data.message,
            };
        } catch (error) {
            console.error("Error fetching sales report:", error);
            return {
                success: false,
                error: error.message || "Failed to fetch sales report",
            };
        }
    }

    /**
     * Update a sales report
     * @param {number} reportId - Report ID
     * @param {Object} salesData - Updated sales report data
     * @param {string} token - Authentication token
     * @returns {Promise<Object>} API response
     */
    async updateSalesReport(reportId, salesData, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${reportId}`, {
                method: "PUT",
                headers: this.getHeaders(token),
                body: JSON.stringify(salesData),
            });

            // Check if response is HTML (error page) instead of JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Backend server is not responding properly. Please ensure the Laravel backend is running on http://127.0.0.1:8000");
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return {
                success: true,
                data: data.report,
                message: data.message,
            };
        } catch (error) {
            console.error("Error updating sales report:", error);
            return {
                success: false,
                error: error.message || "Failed to update sales report",
            };
        }
    }

    /**
     * Delete a sales report
     * @param {number} reportId - Report ID
     * @param {string} token - Authentication token
     * @returns {Promise<Object>} API response
     */
    async deleteSalesReport(reportId, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${reportId}`, {
                method: "DELETE",
                headers: this.getHeaders(token),
            });

            // Check if response is HTML (error page) instead of JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Backend server is not responding properly. Please ensure the Laravel backend is running on http://127.0.0.1:8000");
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return {
                success: true,
                message: data.message,
            };
        } catch (error) {
            console.error("Error deleting sales report:", error);
            return {
                success: false,
                error: error.message || "Failed to delete sales report",
            };
        }
    }
}

const salesApiService = new SalesApiService();
export default salesApiService;










