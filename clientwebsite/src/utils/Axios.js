import axios from "axios";
import { toast } from 'react-hot-toast';

// Base URL for the API
const baseURL = 'http://localhost:8080';

// Create Axios instance with base configuration
const Axios = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Public endpoints that don't require authentication
const publicEndpoints = [
  '/api/user/login',
  '/api/user/register',
  '/api/user/refresh-token',
  '/api/user/forgot-password',
  '/api/user/reset-password',
  '/api/product/get',
  '/api/product/get-all',
  '/api/product/search-product',
  '/api/product/get-product-by-category',
  '/api/category/get',
  '/api/category/get-all',
  '/api/subcategory/get',
  '/api/banner/get-active'
];

// Routes that should quietly fail when not authenticated
// No error messages will be shown to the user for these
const silentAuthRoutes = [
  '/api/cart',
  '/api/user/user-details',
  '/api/address'
];

// Helper to check if URL is a public endpoint
function isPublicEndpoint(url) {
  if (!url) return false;
  return publicEndpoints.some(endpoint => url.includes(endpoint));
}

// Helper to check if route should fail silently when not authenticated
function isSilentAuthRoute(url) {
  if (!url) return false;
  return silentAuthRoutes.some(route => url.includes(route));
}

// Request interceptor - adds auth token to requests
Axios.interceptors.request.use(
  (config) => {
    // Log request (for debugging)
    console.log(`🚀 Request to ${config.url}`);
    
    // Skip auth header for public endpoints
    if (isPublicEndpoint(config.url)) {
      return config;
    }
    
    // Add auth header if we have a token
    const accessToken = localStorage.getItem('accesstoken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // Ensure the URL starts with a forward slash
    if (config.url && !config.url.startsWith('/')) {
      config.url = '/' + config.url;
    }
    
    // Don't set Content-Type for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // If this is a cart or user-details endpoint and we don't have a token,
    // mark it to be handled silently on error
    if (isSilentAuthRoute(config.url) && !accessToken) {
      config._silentAuthFail = true;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Variables for token refresh
let isRefreshing = false;
let failedQueue = [];
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;

// Process the queue of failed requests
const processQueue = (error, token = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor - handles token refresh
Axios.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log(`✅ Response from ${response.config.url}`, {
      status: response.status,
      success: response.data?.success,
    });
    
    // Reset refresh attempts on successful response
    if (!isPublicEndpoint(response.config.url)) {
      refreshAttempts = 0;
    }
    
    return response;
  },
  async (error) => {
    // Get the original request config
    const originalRequest = error.config;
    
    // For silent auth fail routes, return "not authenticated" response without showing errors
    if (originalRequest && originalRequest._silentAuthFail && error.response?.status === 401) {
      console.log(`Silent auth fail for ${originalRequest.url} - user not logged in`);
      return Promise.resolve({ 
        data: { 
          success: false, 
          authenticated: false,
          message: "Authentication required" 
        } 
      });
    }
    
    // Log error
    console.log(`❌ Response error for ${originalRequest?.url}:`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    
    // Skip refresh for non-401 errors, already retried requests, and public endpoints
    if (
      error.response?.status !== 401 || 
      !originalRequest || 
      originalRequest._retry ||
      isPublicEndpoint(originalRequest.url) || 
      refreshAttempts >= MAX_REFRESH_ATTEMPTS
    ) {
      // If we've exceeded max refresh attempts, clear tokens and redirect to login
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS && error.response?.status === 401) {
        console.warn(`Exceeded max refresh attempts (${MAX_REFRESH_ATTEMPTS}), logging out`);
        localStorage.removeItem('accesstoken');
        localStorage.removeItem('refreshToken');
        
        // Redirect to login page, but only if we're not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }
    
    // Mark this request as retried to prevent loops
    originalRequest._retry = true; 
    refreshAttempts++;
    
    // If a token refresh is already in progress, wait for it
    if (isRefreshing) {
      console.log('Token refresh already in progress, adding request to queue');
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
      .then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return Axios(originalRequest);
      })
      .catch(err => Promise.reject(err));
    }
    
    // Set refreshing flag
    isRefreshing = true;
    
    try {
      // Get refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // If no refresh token and this is a silent auth route, don't show errors
        if (isSilentAuthRoute(originalRequest.url)) {
          console.log(`No refresh token for silent route ${originalRequest.url}`);
          return Promise.resolve({ 
            data: { 
              success: false, 
              authenticated: false,
              message: "Authentication required" 
            } 
          });
        }
        
        throw new Error('No refresh token available');
      }
      
      console.log('Attempting to refresh token...');
      
      // Attempt to refresh the token (use direct axios to avoid interceptors)
      const response = await axios.post(`${baseURL}/api/user/refresh-token`, { refreshToken });
      
      if (response.data.success) {
        const { accesstoken, refreshToken: newRefreshToken } = response.data.data;
        
        console.log('Token refresh successful!');
        
        // Update tokens
        localStorage.setItem('accesstoken', accesstoken);
        
        // Only update refresh token if we received a new one
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        // Update auth header
        Axios.defaults.headers.common.Authorization = `Bearer ${accesstoken}`;
        originalRequest.headers.Authorization = `Bearer ${accesstoken}`;
        
        // Process queue
        processQueue(null, accesstoken);
        
        // Reset refresh attempts on successful refresh
        refreshAttempts = 0;
        
        // Retry original request
        return Axios(originalRequest);
      } else {
        // Clear tokens on refresh failure
        localStorage.removeItem('accesstoken');
        localStorage.removeItem('refreshToken');
        
        // Process queue with error
        processQueue(new Error('Failed to refresh token'));
        
        // If this is a silent auth route, don't throw
        if (isSilentAuthRoute(originalRequest.url)) {
          return Promise.resolve({ 
            data: { 
              success: false, 
              authenticated: false,
              message: "Authentication required" 
            } 
          });
        }
        
        throw new Error('Token refresh failed');
      }
    } catch (refreshError) {
      console.error('Token refresh error:', refreshError);
      
      // Process queue with error
      processQueue(refreshError);
      
      // If this is a silent auth route, return a default response
      if (isSilentAuthRoute(originalRequest.url)) {
        return Promise.resolve({ 
          data: { 
            success: false, 
            authenticated: false,
            message: "Authentication required" 
          } 
        });
      }
      
      // Redirect to login only for auth errors, not for network errors
      if (refreshError.response && refreshError.response.status === 401) {
        console.log('Authentication failed, redirecting to login...');
        
        // Clean redirect to login page, but only if we're not already there
        if (window.location.pathname !== '/login') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default Axios;