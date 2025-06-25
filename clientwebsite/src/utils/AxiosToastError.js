import toast from "react-hot-toast"

// Track last shown error to prevent spamming the user with the same error
let lastError = { time: 0, message: '' };

/**
 * Displays user-friendly toast messages for common API errors
 * @param {Error} error - The Axios error object
 */
const AxiosToastError = (error) => {
    if (!error) return;
    
    // Prevent showing the same error multiple times in quick succession
    const now = Date.now();
    if (now - lastError.time < 2000 && error.message === lastError.message) {
        return;
    }
    
    // Extract status code and message
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || "An error occurred";
    
    // Update last error
    lastError = { time: now, message: error.message };
    
    // Log the error for debugging
    console.error(`API Error (${status}):`, {
        message,
        url: error.config?.url,
        method: error.config?.method,
    });
    
    // Handle specific error cases
    if (status === 401) {
        toast.error("Session expired. Please log in again.");
    } else if (status === 403) {
        toast.error("You don't have permission to perform this action.");
    } else if (status === 404) {
        toast.error("The requested resource was not found.");
    } else if (status === 422 || status === 400) {
        toast.error(message || "Invalid data provided. Please check your inputs.");
    } else if (status >= 500) {
        toast.error("Server error. Please try again later.");
    } else {
        // Generic error message
        toast.error(message || "Something went wrong. Please try again.");
    }
};

export default AxiosToastError