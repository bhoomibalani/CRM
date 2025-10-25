/**
 * RD & Company CRM - Ledger API Service
 */

import { API_CONFIG, getApiUrl } from "config/api";

const LEDGER_ENDPOINTS = {
  LEDGERS: API_CONFIG.ENDPOINTS.LEDGERS,
  SHOW: "/api/ledgers/{id}",
  UPLOAD: API_CONFIG.ENDPOINTS.LEDGER_UPLOAD,
  DOWNLOAD: API_CONFIG.ENDPOINTS.LEDGER_DOWNLOAD,
};

class LedgerApiService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem("crm_token");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    try {
      const userData = localStorage.getItem("crm_user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }

  /**
   * Check if current user can create ledger requests
   */
  canCreateLedger() {
    const currentUser = this.getCurrentUser();
    return currentUser && ["client", "sales"].includes(currentUser.role);
  }

  /**
   * Validate ledger data before sending to API
   */
  validateLedgerData(ledgerData) {
    const errors = [];

    // Check required fields
    if (!ledgerData.client_id) {
      errors.push("Client ID is required");
    } else if (isNaN(parseInt(ledgerData.client_id)) || parseInt(ledgerData.client_id) <= 0) {
      errors.push("Client ID must be a valid positive number");
    }

    if (!ledgerData.request_details) {
      errors.push("Request details are required");
    } else if (
      typeof ledgerData.request_details !== "string" ||
      ledgerData.request_details.trim().length === 0
    ) {
      errors.push("Request details must be a non-empty string");
    } else if (ledgerData.request_details.length > 1000) {
      errors.push("Request details must not exceed 1000 characters");
    }

    // Check optional fields
    if (ledgerData.additional_notes && typeof ledgerData.additional_notes !== "string") {
      errors.push("Additional notes must be a string");
    } else if (ledgerData.additional_notes && ledgerData.additional_notes.length > 500) {
      errors.push("Additional notes must not exceed 500 characters");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Get all ledger requests with optional filtering
   */
  async getLedgers(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status);
      }

      if (filters.search) {
        params.append("search", filters.search);
      }

      const url = `${this.baseUrl}${LEDGER_ENDPOINTS.LEDGERS}${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching ledgers:", error);
      throw error;
    }
  }

  /**
   * Create a new ledger request
   */
  async createLedger(ledgerData) {
    try {
      // Check user permissions first
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      if (!["client", "sales"].includes(currentUser.role)) {
        throw new Error("Only clients and sales can create ledger requests");
      }

      // Validate input data before sending
      const validation = this.validateLedgerData(ledgerData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      // Ensure data types are correct
      const validatedData = {
        client_id: parseInt(ledgerData.client_id),
        request_details: String(ledgerData.request_details).trim(),
        additional_notes: ledgerData.additional_notes
          ? String(ledgerData.additional_notes).trim()
          : null,
      };

      const response = await fetch(`${this.baseUrl}${LEDGER_ENDPOINTS.LEDGERS}`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle validation errors specifically
        if (response.status === 422 && errorData.errors) {
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("; ");
          throw new Error(`Validation failed: ${validationErrors}`);
        }

        // Handle other errors
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating ledger:", error);
      throw error;
    }
  }

  /**
   * Get a specific ledger request
   */
  async getLedger(id) {
    try {
      const response = await fetch(`${this.baseUrl}${LEDGER_ENDPOINTS.LEDGERS}/${id}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching ledger:", error);
      throw error;
    }
  }

  /**
   * Update ledger request status
   */
  async updateLedger(id, updateData) {
    try {
      const response = await fetch(`${this.baseUrl}${LEDGER_ENDPOINTS.LEDGERS}/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating ledger:", error);
      throw error;
    }
  }

  /**
   * Upload ledger file
   */
  async uploadLedgerFile(id, file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("crm_token");
      const headers = {
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(
        `${this.baseUrl}${LEDGER_ENDPOINTS.UPLOAD.replace("{id}", id)}`,
        {
          method: "POST",
          headers,
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error uploading ledger file:", error);
      throw error;
    }
  }

  /**
   * Download ledger file
   */
  async downloadLedgerFile(id) {
    let ledger = null;

    try {
      const token = localStorage.getItem("crm_token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      console.log(`Attempting to download ledger file for ID: ${id}`);

      // First, get the ledger details to check if file exists
      const ledgerUrl = `${this.baseUrl}${LEDGER_ENDPOINTS.SHOW.replace("{id}", id)}`;
      console.log(`Fetching ledger details from: ${ledgerUrl}`);

      const ledgerResponse = await fetch(ledgerUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      console.log(`Ledger response status: ${ledgerResponse.status}`);

      if (!ledgerResponse.ok) {
        const errorText = await ledgerResponse.text();
        console.error(`Ledger API error response: ${errorText}`);
        throw new Error(`Failed to get ledger details: ${ledgerResponse.status} - ${errorText}`);
      }

      const ledgerData = await ledgerResponse.json();
      console.log("Ledger API response:", ledgerData);

      if (!ledgerData.success) {
        throw new Error(ledgerData.message || "Failed to get ledger details");
      }

      ledger = ledgerData.data;
      console.log("Ledger details:", ledger);

      // Check if file exists and can be downloaded
      if (!ledger.file_name || !ledger.file_path) {
        throw new Error("No file uploaded for this ledger request");
      }

      console.log(`Ledger status: ${ledger.status}`);
      console.log(`File name: ${ledger.file_name}`);
      console.log(`File path: ${ledger.file_path}`);

      if (ledger.status !== "uploaded" && ledger.status !== "confirmed") {
        console.warn(`Ledger status '${ledger.status}' is not 'uploaded' or 'confirmed'`);
        throw new Error("File is not available for download. Status: " + ledger.status);
      }

      // Try direct file download
      const downloadUrl = `${this.baseUrl}${LEDGER_ENDPOINTS.DOWNLOAD.replace("{id}", id)}`;
      console.log(`Download URL: ${downloadUrl}`);

      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`Download response status: ${response.status}`);

      if (!response.ok) {
        let errorMessage = `Download failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Response is not JSON
        }
        throw new Error(errorMessage);
      }

      // Check content type
      const contentType = response.headers.get("content-type");
      console.log(`Download content type: ${contentType}`);

      // Handle different response types
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Server returned JSON instead of file");
      }

      // Get the file as blob
      const blob = await response.blob();
      console.log(`Downloaded blob size: ${blob.size} bytes`);

      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      // Determine filename
      let filename = ledger.file_name || `ledger-${id}.pdf`;

      // Get filename from content-disposition header if available
      const contentDisposition = response.headers.get("content-disposition");
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 100);

      console.log(`File download initiated: ${filename}`);
      return { success: true, filename, size: blob.size };
    } catch (error) {
      console.error("Error downloading ledger file:", error);
      console.error("Ledger data available:", !!ledger);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        ledgerId: id,
      });

      // Fallback: Try to create a direct download link
      try {
        console.log("Attempting fallback download method...");

        if (!ledger) {
          console.error("Ledger data is null - initial API call failed");
          throw new Error(
            `Initial API call failed: ${error.message}. Cannot proceed with fallback download.`
          );
        }

        // For fallback, we'll be more lenient with status checks
        console.log(
          `Fallback: Ledger status is '${ledger.status}', proceeding with direct file access`
        );

        const directUrl = `${this.baseUrl}/storage/ledgers/${ledger.file_path}`;
        console.log(`Direct file URL: ${directUrl}`);

        // Create a temporary link for direct download
        const a = document.createElement("a");
        a.href = directUrl;
        a.download = ledger.file_name || `ledger-${id}.pdf`;
        a.target = "_blank";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
        }, 100);

        console.log("Fallback download initiated");
        return { success: true, filename: ledger.file_name, method: "fallback" };
      } catch (fallbackError) {
        console.error("Fallback download also failed:", fallbackError);

        // Provide more specific error message based on the failure
        let errorMessage = "Download failed. ";
        if (!ledger) {
          errorMessage += "Unable to retrieve ledger information from server. ";
        } else {
          errorMessage += "File download failed. ";
        }
        errorMessage +=
          "Please check your connection and try again, or contact support if the problem persists.";

        throw new Error(errorMessage);
      }
    }
  }

  /**
   * Delete ledger request
   */
  async deleteLedger(id) {
    try {
      const response = await fetch(`${this.baseUrl}${LEDGER_ENDPOINTS.LEDGERS}/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error deleting ledger:", error);
      throw error;
    }
  }
}

export default new LedgerApiService();
