/**
 * API Service for Binkeyit App
 * This service handles all API calls to the backend server
 */
import { Platform } from 'react-native';

// Base URL configuration - matches the configuration in utils/api.ts
const getBaseUrl = () => {
  if (__DEV__) {
    // Use your computer's local IP address for development
    // On Windows, find this by running 'ipconfig' in Command Prompt
    return 'http://192.168.1.64:8080'; // Replace with your actual IP
  }
  // Production URL (when building for production)
  return 'http://localhost:8080';
};

// Storage for the authentication token
let authToken: string | null = null;
// Headers for API requests
const getHeaders = (includeAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (includeAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
};

// Set the auth token after login
export const setAuthToken = (token: string) => {
  authToken = token;
};

// Clear the auth token on logout
export const clearAuthToken = () => {
  authToken = null;
};

// Get the current auth token
export const getAuthToken = () => {
  return authToken;
};

/**
 * User Authentication APIs
 */

// Register a new user
export const registerUser = async (userData: {
  name: string;
  email: string;
  password: string;
}) => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/user/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(userData),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Verify email with OTP
export const verifyEmail = async (email: string, otp: string) => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/user/verify-email`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, otp }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
};

// Login user
export const loginUser = async (email: string, password: string) => {
  try {
    console.log(`Attempting login to ${getBaseUrl()}/api/user/login with email: ${email}`);
    
    const response = await fetch(`${getBaseUrl()}/api/user/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    
    if (data.success && data.data) {
      // Store both tokens
      setAuthToken(data.data.accesstoken);
      return {
        success: true,
        token: data.data.accesstoken,
        refreshToken: data.data.refreshToken,
        message: data.message
      };
    }
    
    return {
      success: false,
      message: data.message || 'Login failed'
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/user/logout`, {
      method: 'GET', 
      headers: getHeaders(true),
      credentials: 'include' 
    });
    
    // Clear the token regardless of response
    clearAuthToken();
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // If not JSON, just return a success object
      return { success: true, message: 'Logged out successfully' };
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Clear token even if the request fails
    clearAuthToken();
    throw error;
  }
};

// Forgot password - request OTP
export const forgotPassword = async (email: string) => {
  try {
    console.log('Sending forgot password request for:', email);
    const response = await fetch(`${getBaseUrl()}/api/user/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(false)
      },
      body: JSON.stringify({ email }),
      credentials: 'include'
    });

    // First check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Forgot password error response:', errorText);
      try {
        // Try to parse as JSON
        const errorJson = JSON.parse(errorText);
        return errorJson;
      } catch {
        // If not JSON, return formatted error
        return {
          error: true,
          message: 'Server error. Please try again later.',
          success: false
        };
      }
    }

    // Handle successful response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      console.error('Non-JSON response received from forgot-password endpoint');
      return {
        error: true,
        message: 'Invalid response from server. Please try again later.',
        success: false
      };
    }
  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    return {
      error: true,
      message: error instanceof Error ? error.message : 'An error occurred. Please try again.',
      success: false
    };
  }
};

// Verify forgot password OTP
export const verifyForgotPasswordOtp = async (email: string, otp: string) => {
  try {
    console.log('Verifying OTP for:', email);
    const response = await fetch(`${getBaseUrl()}/api/user/verify-forgot-password-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(false)
      },
      body: JSON.stringify({ email, otp }),
      credentials: 'include'
    });

    // First check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Verify OTP error response:', errorText);
      try {
        // Try to parse as JSON
        const errorJson = JSON.parse(errorText);
        return errorJson;
      } catch {
        // If not JSON, return formatted error
        return {
          error: true,
          message: 'Server error. Please try again later.',
          success: false
        };
      }
    }

    // Handle successful response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      console.error('Non-JSON response received from verify-otp endpoint');
      return {
        error: true,
        message: 'Invalid response from server. Please try again later.',
        success: false
      };
    }
  } catch (error: unknown) {
    console.error('Verify OTP error:', error);
    return {
      error: true,
      message: error instanceof Error ? error.message : 'An error occurred. Please try again.',
      success: false
    };
  }
};

// Reset password with token
export const resetPassword = async (email: string, newPassword: string, token: string) => {
  try {
    console.log('Resetting password for:', email);
    const response = await fetch(`${getBaseUrl()}/api/user/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(false)
      },
      body: JSON.stringify({ email, newPassword, token }),
      credentials: 'include'
    });

    // First check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Reset password error response:', errorText);
      try {
        // Try to parse as JSON
        const errorJson = JSON.parse(errorText);
        return errorJson;
      } catch {
        // If not JSON, return formatted error
        return {
          error: true,
          message: 'Server error. Please try again later.',
          success: false
        };
      }
    }

    // Handle successful response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      console.error('Non-JSON response received from reset-password endpoint');
      return {
        error: true,
        message: 'Invalid response from server. Please try again later.',
        success: false
      };
    }
  } catch (error: unknown) {
    console.error('Reset password error:', error);
    return {
      error: true,
      message: error instanceof Error ? error.message : 'An error occurred. Please try again.',
      success: false
    };
  }
};

// Resend OTP for forgot password
export const resendOtp = async (email: string) => {
  try {
    console.log('Resending OTP for:', email);
    const response = await fetch(`${getBaseUrl()}/api/user/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(false)
      },
      body: JSON.stringify({ email }),
      credentials: 'include'
    });

    // First check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend OTP error response:', errorText);
      try {
        // Try to parse as JSON
        const errorJson = JSON.parse(errorText);
        return errorJson;
      } catch {
        // If not JSON, return formatted error
        return {
          error: true,
          message: 'Server error. Please try again later.',
          success: false
        };
      }
    }

    // Handle successful response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      console.error('Non-JSON response received from resend-otp endpoint');
      return {
        error: true,
        message: 'Invalid response from server. Please try again later.',
        success: false
      };
    }
  } catch (error: unknown) {
    console.error('Resend OTP error:', error);
    return {
      error: true,
      message: error instanceof Error ? error.message : 'An error occurred. Please try again.',
      success: false
    };
  }
};

/**
 * User Profile APIs
 */

// Upload avatar
export const uploadAvatar = async (formData: FormData) => {
  try {
    console.log('Uploading avatar...');
    
    const response = await fetch(`${getBaseUrl()}/api/user/upload-avatar`, {
      method: 'PUT', 
      headers: {
        'Authorization': authToken ? `Bearer ${authToken}` : '',
      },
      body: formData,
      credentials: 'include' 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Upload response data:', data);
    return data;
  } catch (error) {
    console.error('Avatar upload error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during upload',
      error: true
    };
  }
};

// Update user details
export const updateUserDetails = async (userData: {
  name?: string;
  email?: string;
  mobile?: string;
}) => {
  try {
    console.log('Updating user details:', userData);
    
    const response = await fetch(`${getBaseUrl()}/api/user/update-user`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Update response data:', data);
    return data;
  } catch (error) {
    console.error('Update user details error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during update',
      error: true
    };
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    console.log('Fetching user profile...');
    
    const response = await fetch(`${getBaseUrl()}/api/user/user-details`, {
      method: 'GET',
      headers: getHeaders(true),
      credentials: 'include'
    });
    
    console.log('User profile response status:', response.status);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('User profile data:', data);
      
      if (data.success && data.data) {
        return {
          success: true,
          user: {
            ...data.data,
            _id: data.data._id || data.data.id // Ensure _id is available
          }
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to fetch user profile'
        };
      }
    } else {
      const text = await response.text();
      console.error('Server returned non-JSON response:', text);
      return {
        success: false,
        message: 'Server returned an invalid response'
      };
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error fetching profile'
    };
  }
};

// Address API functions
export const getUserAddresses = async () => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/address/get`, {
      method: 'GET',
      headers: getHeaders(true),
      credentials: 'include'
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Get addresses error:', error);
    throw error;
  }
};

export const addUserAddress = async (addressData: {
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  mobile: string;
}) => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/address/create`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(addressData),
      credentials: 'include'
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Add address error:', error);
    throw error;
  }
};

export const updateUserAddress = async (addressData: {
  addressId: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  mobile: string;
}) => {
  try {
    const { addressId, ...updateData } = addressData;
    console.log('Updating address with ID:', addressId, 'Data:', updateData);
    
    // Send the data in the format expected by the server
    const response = await fetch(`${getBaseUrl()}/api/address/update`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ _id: addressId, ...updateData }),
      credentials: 'include'
    });

    console.log('Update address response status:', response.status);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Update address response:', JSON.stringify(data));
      return data;
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Update address error:', error);
    throw error;
  }
};

export const deleteUserAddress = async (addressId: string) => {
  try {
    console.log('Deleting address with ID:', addressId);
    
    const response = await fetch(`${getBaseUrl()}/api/address/disable`, {
      method: 'DELETE',
      headers: getHeaders(true),
      body: JSON.stringify({ _id: addressId }),
      credentials: 'include'
    });

    console.log('Delete address response status:', response.status);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Delete address response:', JSON.stringify(data));
      return data;
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Delete address error:', error);
    throw error;
  }
};

// Refresh token
export const refreshToken = async (refreshToken: string) => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/user/refresh-token`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ refreshToken }),
    });
    
    const data = await response.json();
    
    // If refresh successful, update the token
    if (data.token) {
      setAuthToken(data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};

/**
 * Order API functions
 */
export const placeOrder = async (orderData: {
  list_items: any[];
  totalAmt: number;
  subTotalAmt: number;
  addressId: string;
  paymentMethod?: 'CASH_ON_DELIVERY' | 'ONLINE_PAYMENT';
}) => {
  try {
    // Determine the endpoint based on payment method
    const endpoint = '/api/order/cash-on-delivery';
    console.log(`Using endpoint: ${getBaseUrl()}${endpoint}`);
    
    // Format data exactly like the web client (with minimum transformation)
    // No sanitization - send data exactly as received from the cart
    console.log('Sending list_items:', JSON.stringify(orderData.list_items));
    
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(orderData),
      credentials: 'include'
    });
    
    // Handle non-2xx responses
    if (!response.ok) {
      console.error(`Server returned status: ${response.status}`);
      const errorText = await response.text();
      console.error('Error response text:', errorText);
      
      if (errorText.includes('<html')) {
        // HTML error page
        return {
          error: true,
          message: `Server error (${response.status}). Please try again.`,
          data: null
        };
      }
      
      try {
        const errorData = JSON.parse(errorText);
        return {
          error: true,
          message: errorData.message || `Failed with status ${response.status}`,
          data: null
        };
      } catch (parseError) {
        return {
          error: true,
          message: `Server error: ${response.status}`,
          data: null
        };
      }
    }
    
    // Parse JSON response
    const result = await response.json();
    console.log('Order API result:', result);
    
    if (!result.success) {
      return {
        error: true,
        message: result.message || 'Failed to place order',
        data: null
      };
    }
    
    return {
      error: false,
      message: result.message || 'Order placed successfully',
      data: result.data
    };
  } catch (error) {
    console.error('Place order error:', error);
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Failed to place order',
      data: null
    };
  }
};

export const getUserOrders = async () => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/order/order-list`, {
      method: 'GET',
      headers: getHeaders(true),
      credentials: 'include'
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Get orders error:', error);
    throw error;
  }
};

export const getOrderDetails = async (orderId: string) => {
  try {
    console.log('Calling getOrderDetails API for order:', orderId);
    const response = await fetch(`${getBaseUrl()}/api/order/details/${orderId}`, {
      method: 'GET',
      headers: getHeaders(true),
      credentials: 'include'
    });

    // First check if response is ok
    if (!response.ok) {
      console.error(`Order details API returned status ${response.status}: ${response.statusText}`);
      return {
        success: false,
        error: true,
        message: `Failed to fetch order details (${response.status})`,
        data: null
      };
    }

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Order details API response data:', JSON.stringify(data).substring(0, 200) + '...');
      return data;
    } else {
      console.error('Invalid response format from order details API');
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Get order details error:', error);
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : 'Failed to fetch order details',
      data: null
    };
  }
};

export default {
  // Auth
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  refreshToken,
  resendOtp,
  
  // Profile
  uploadAvatar,
  updateUserDetails,
  getUserProfile,
  
  // Address
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  
  // Order
  placeOrder,
  getUserOrders,
  getOrderDetails,
  
  // Token management
  setAuthToken,
  clearAuthToken,
  getAuthToken,
};
