/**
 * Client Payment API Service
 */

import { getApiUrl, API_CONFIG } from '../config/api';

class ClientPaymentApiService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    async getClientPayments(status = null, token = null) {
        try {
            const authToken = token || localStorage.getItem('token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }

            let url = `${this.baseUrl}/api/client-payments`;
            if (status) {
                url += `?status=${status}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please login again.');
                }
                if (response.status === 403) {
                    throw new Error('Access denied. You do not have permission to view client payments.');
                }
                if (response.status >= 500) {
                    throw new Error('Backend server is not responding properly. Please ensure the Laravel backend is running on http://127.0.0.1:8000');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching client payments:', error);
            throw error;
        }
    }

    async createClientPayment(paymentData, token = null) {
        try {
            const authToken = token || localStorage.getItem('token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.baseUrl}/api/client-payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please login again.');
                }
                if (response.status === 403) {
                    throw new Error('Access denied. Only clients can report payments.');
                }
                if (response.status === 422) {
                    const errorData = await response.json();
                    throw new Error(`Validation failed: ${JSON.stringify(errorData.errors)}`);
                }
                if (response.status >= 500) {
                    throw new Error('Backend server is not responding properly. Please ensure the Laravel backend is running on http://127.0.0.1:8000');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating client payment:', error);
            throw error;
        }
    }

    async updatePaymentStatus(paymentId, status, adminNotes = null, token = null) {
        try {
            const authToken = token || localStorage.getItem('token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.baseUrl}/api/client-payments/${paymentId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status,
                    admin_notes: adminNotes,
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please login again.');
                }
                if (response.status === 403) {
                    throw new Error('Access denied. Only admin, manager, or office can approve/reject payments.');
                }
                if (response.status === 422) {
                    const errorData = await response.json();
                    throw new Error(`Validation failed: ${JSON.stringify(errorData.errors)}`);
                }
                if (response.status >= 500) {
                    throw new Error('Backend server is not responding properly. Please ensure the Laravel backend is running on http://127.0.0.1:8000');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw error;
        }
    }

    async getSalesPersons(token = null) {
        try {
            const authToken = token || localStorage.getItem('token');
            if (!authToken) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.baseUrl}/api/client-payments/sales-persons`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please login again.');
                }
                if (response.status >= 500) {
                    throw new Error('Backend server is not responding properly. Please ensure the Laravel backend is running on http://127.0.0.1:8000');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching sales persons:', error);
            throw error;
        }
    }
}

const clientPaymentApiService = new ClientPaymentApiService();
export default clientPaymentApiService;
