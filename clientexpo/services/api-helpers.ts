import { getBaseUrl } from '@/utils/api';

/**
 * Helper function to safely parse JSON responses
 * This follows the error handling pattern from the authentication functions
 * to handle non-JSON responses gracefully
 */
export async function fetchWithErrorHandling<T>(
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
    
    // Add credentials to all requests for cookie handling
    options.credentials = 'include';
    
    const response = await fetch(url, options);
    console.log('Response status:', response.status, response.statusText);
    
    // Check if the response is JSON before trying to parse it
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        // If the server returns an error with a message
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      
      return data;
    } else {
      // Handle non-JSON responses gracefully
      const text = await response.text();
      console.log('Non-JSON response received:', text.substring(0, 100));
      throw new Error(`Received non-JSON response: ${text.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Helper function to get the full URL for an image
 * @param imageUrl The image URL that might be relative or absolute
 * @returns The full image URL
 */
export function getFullImageUrl(imageUrl: string): string {
  if (!imageUrl) return ''; 
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  const baseUrl = getBaseUrl();
  const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
  return `${baseUrl}/${cleanImageUrl}`;
}
