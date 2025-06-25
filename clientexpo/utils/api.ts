// API configuration
// This file contains the base URL for API requests
import { Platform } from 'react-native';

// For development - points to local server
export function getBaseUrl() {
  if (__DEV__) {
    // Use your computer's local IP address for development
    // On Windows, find this by running 'ipconfig' in Command Prompt
    return 'http://192.168.1.64:8080'; // Replace with your actual IP
  }
  // Production URL (when building for production)
  return 'http://localhost:8080';
}

// Helper function to check if the server is reachable
export async function checkServerConnection(): Promise<boolean> {
  try {
    console.log('Checking server connection to:', getBaseUrl());
    const response = await fetch(`${getBaseUrl()}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    
    console.log('Server connection status:', response.status);
    return response.ok;
  } catch (error) {
    console.error('Server connection error:', error);
    return false;
  }
}

// Main API request function with comprehensive error handling
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Build the full URL with the base URL
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${getBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    console.log('Fetching from URL:', url);
    
    // Set default headers if not provided
    if (!options.headers) {
      options.headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
    }
    
    // Always include credentials for cookie handling across all requests
    options.credentials = 'include';
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    options.signal = controller.signal;
    
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    
    console.log('Response status:', response.status, response.statusText);
    
    // Check if the response is JSON before trying to parse it
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        // If the server returns an error with a message
        console.error('API error response:', data);
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      
      return data as T;
    } else {
      // Handle non-JSON responses gracefully
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 150));
      
      // Create a fallback response object to prevent app crashes
      const fallbackResponse: any = {
        success: false,
        error: true,
        message: `Received non-JSON response: ${response.status} ${response.statusText}`,
        data: null
      };
      
      return fallbackResponse as T;
    }
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    
    // Return a formatted error response rather than throwing
    // This prevents the app from crashing and allows components to handle errors gracefully
    const errorResponse: any = {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: error instanceof Error && error.name === 'AbortError' 
        ? [] // Empty array for timeouts to prevent undefined errors
        : null
    };
    
    return errorResponse as T;
  }
}

// Helper function to get full image URL for product/category/banner images
export const getFullImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  try {
    // Handle cloudinary URLs
    if (url.includes('cloudinary.com')) {
      const secureUrl = url.replace('http://', 'https://');
      return `${secureUrl}?q=auto:good&f=auto&w=500`;
    }

    // For other URLs, ensure HTTPS
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }

    // If it's already HTTPS, return as is
    if (url.startsWith('https://')) {
      return url;
    }

    // For relative URLs, prepend base URL
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}/${url.startsWith('/') ? url.slice(1) : url}`;

  } catch (error) {
    console.error('Error formatting image URL:', error);
    return null;
  }
};

// Add a health check endpoint to the webserver
export async function checkServerHealth(): Promise<boolean> {
  try {
    const url = `${getBaseUrl()}/api/health`;
    console.log('Checking server health at:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('Server health check response:', response.status);
    return response.ok;
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
}
