/**
 * RD & Company CRM - Dashboard API Service
 */

import { API_CONFIG } from "config/api";

class DashboardApiService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    /**
     * Get authentication headers
     */
    getAuthHeaders() {
        const token = localStorage.getItem("crm_token");
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats() {
        try {
            const [ordersResponse, usersResponse, tasksResponse, ledgersResponse] = await Promise.all([
                this.getOrdersStats(),
                this.getUsersStats(),
                this.getTasksStats(),
                this.getLedgersStats()
            ]);

            console.log('Dashboard stats responses:', {
                orders: ordersResponse,
                users: usersResponse,
                tasks: tasksResponse,
                ledgers: ledgersResponse
            });

            return {
                success: true,
                data: {
                    totalOrders: ordersResponse.data,
                    activeClients: usersResponse.data,
                    pendingTasks: tasksResponse.data,
                    ledgerRequests: ledgersResponse.data
                }
            };
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            return {
                success: false,
                message: error.message || "Failed to fetch dashboard statistics"
            };
        }
    }

    /**
     * Get orders statistics
     */
    async getOrdersStats() {
        try {
            const response = await fetch(`${this.baseUrl}/api/orders`, {
                method: "GET",
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Orders API response:', data);

            // Calculate total orders and growth
            const totalOrders = data.success ? data.orders.length : 0;
            const lastMonth = this.getLastMonthCount(data.orders || []);
            const growth = lastMonth > 0 ? Math.round(((totalOrders - lastMonth) / lastMonth) * 100) : 0;

            return {
                success: true,
                data: {
                    count: totalOrders,
                    growth: growth,
                    growthLabel: "than last month"
                }
            };
        } catch (error) {
            console.error("Error fetching orders stats:", error);
            return {
                success: false,
                data: { count: 0, growth: 0, growthLabel: "than last month" }
            };
        }
    }

    /**
     * Get users statistics
     */
    async getUsersStats() {
        try {
            const response = await fetch(`${this.baseUrl}/api/admin/users`, {
                method: "GET",
                headers: this.getAuthHeaders(),
            });

            console.log('Users API response status:', response.status);

            if (!response.ok) {
                console.error('Users API error:', response.status, response.statusText);
                // If access denied, try to get a basic count from a different endpoint
                if (response.status === 403) {
                    console.log('Access denied to users API, trying tasks/users endpoint');
                    try {
                        const tasksUsersResponse = await fetch(`${this.baseUrl}/api/tasks/users`, {
                            method: "GET",
                            headers: this.getAuthHeaders(),
                        });

                        if (tasksUsersResponse.ok) {
                            const tasksUsersData = await tasksUsersResponse.json();
                            console.log('Tasks users API response:', tasksUsersData);
                            const usersCount = tasksUsersData.success ? tasksUsersData.users.length : 0;

                            return {
                                success: true,
                                data: {
                                    count: usersCount,
                                    growth: 0,
                                    growthLabel: "than last month"
                                }
                            };
                        }
                    } catch (fallbackError) {
                        console.log('Tasks users API also failed:', fallbackError);
                    }

                    return {
                        success: true,
                        data: { count: 0, growth: 0, growthLabel: "than last month" }
                    };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Users API response:', data);

            // Calculate active users and growth
            const allUsers = data.success ? data.users : [];
            const activeUsers = allUsers.filter(user => user.status === 'active').length;
            console.log('Total users:', allUsers.length);
            console.log('Active users count:', activeUsers);

            const lastMonth = this.getLastMonthCount(allUsers);
            const growth = lastMonth > 0 ? Math.round(((activeUsers - lastMonth) / lastMonth) * 100) : 0;

            return {
                success: true,
                data: {
                    count: activeUsers,
                    growth: growth,
                    growthLabel: "than last month"
                }
            };
        } catch (error) {
            console.error("Error fetching users stats:", error);
            return {
                success: false,
                data: { count: 0, growth: 0, growthLabel: "than last month" }
            };
        }
    }

    /**
     * Get tasks statistics
     */
    async getTasksStats() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tasks`, {
                method: "GET",
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Calculate pending tasks
            const pendingTasks = data.success ? data.tasks.filter(task => task.status === 'pending').length : 0;
            const yesterdayTasks = this.getYesterdayCount(data.tasks || []);
            const change = pendingTasks - yesterdayTasks;

            return {
                success: true,
                data: {
                    count: pendingTasks,
                    change: change,
                    changeLabel: "than yesterday"
                }
            };
        } catch (error) {
            console.error("Error fetching tasks stats:", error);
            return {
                success: false,
                data: { count: 0, change: 0, changeLabel: "than yesterday" }
            };
        }
    }

    /**
     * Get ledgers statistics
     */
    async getLedgersStats() {
        try {
            const response = await fetch(`${this.baseUrl}/api/ledgers`, {
                method: "GET",
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Calculate ledger requests and pending uploads
            const totalLedgers = data.success ? data.data.length : 0;
            const pendingUploads = data.success ? data.data.filter(ledger => ledger.status === 'pending').length : 0;

            return {
                success: true,
                data: {
                    count: totalLedgers,
                    pendingUploads: pendingUploads,
                    pendingLabel: "awaiting upload"
                }
            };
        } catch (error) {
            console.error("Error fetching ledgers stats:", error);
            return {
                success: false,
                data: { count: 0, pendingUploads: 0, pendingLabel: "awaiting upload" }
            };
        }
    }

    /**
     * Helper method to get last month count (mock implementation)
     */
    getLastMonthCount(data) {
        // This is a simplified calculation
        // In a real app, you'd filter by actual dates
        return Math.floor(data.length * 0.8); // Assume 20% growth
    }

    /**
     * Helper method to get yesterday count (mock implementation)
     */
    getYesterdayCount(data) {
        // This is a simplified calculation
        // In a real app, you'd filter by actual dates
        return Math.floor(data.length * 0.9); // Assume 10% change
    }
}

export default new DashboardApiService();
