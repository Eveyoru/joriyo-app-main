import Axios from "./Axios"

/**
 * Fetches the user details from the API using the stored access token
 * @returns {Promise<Object>} An object containing success flag, data, and/or error info
 */
const fetchUserDetails = async () => {
    try {
        // Access token is automatically added by the Axios interceptor
        const response = await Axios.get('/api/user/user-details');
        
        if (response.data.success) {
            return {
                success: true,
                data: response.data.data,
            };
        } else {
            return {
                success: false,
                error: true,
                message: response.data.message || "Could not fetch user details",
            };
        }
    } catch (error) {
        console.error("Error fetching user details:", error.message);
        return {
            success: false,
            error: true,
            message: error.response?.data?.message || "Failed to fetch user details",
            statusCode: error.response?.status,
        };
    }
}

export default fetchUserDetails