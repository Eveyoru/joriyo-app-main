import { apiRequest } from '@/utils/api';
import { getAuthToken } from '@/services/api';

export interface Vendor {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  status?: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface VendorApiResponse {
  data: Vendor[];
  success: boolean;
  message?: string;
  error: boolean;
}

interface SingleVendorApiResponse {
  data: Vendor;
  success: boolean;
  message?: string;
  error: boolean;
}

// Define Product interface to fix the 'any' type issue
interface Product {
  _id: string;
  vendor: string | { _id: string };
  [key: string]: any; // For other product properties
}

// Define the product response interface
interface ProductApiResponse {
  data: Product[];
  success: boolean;
  message?: string;
  error: boolean;
}

/**
 * Fetch all active vendors
 * @returns List of active vendors
 */
export async function getActiveVendors(): Promise<Vendor[]> {
  try {
    console.log('Fetching active vendors');
    const response = await apiRequest<VendorApiResponse>('/api/vendor/get-active');
    
    if (!response.success) {
      console.warn('Vendor fetch unsuccessful:', response.message);
      return [];
    }
    
    console.log('Fetched active vendors:', response.data?.length || 0);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

/**
 * Fetch all vendors (including inactive ones, for admin use)
 * @returns List of all vendors
 */
export async function getAllVendors(): Promise<Vendor[]> {
  try {
    // Check if we have an auth token for the protected endpoint
    const token = getAuthToken();
    
    if (!token) {
      console.log('No auth token available, falling back to get-active endpoint');
      // If no token, fall back to the public endpoint
      return await getActiveVendors();
    }
    
    // Include auth token in the request
    const options = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    console.log('Fetching all vendors with auth token');
    const response = await apiRequest<VendorApiResponse>('/api/vendor/get-all', options);
    
    if (!response.success) {
      console.warn('All vendors fetch unsuccessful:', response.message);
      // If authentication fails, fall back to public endpoint
      if (response.message === 'Provide token' || response.message?.includes('token')) {
        console.log('Auth failed, falling back to public endpoint');
        return await getActiveVendors();
      }
      return [];
    }
    
    console.log('Fetched all vendors:', response.data?.length || 0);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching all vendors:", error);
    // On error, try the public endpoint as fallback
    console.log('Error occurred, falling back to public endpoint');
    return await getActiveVendors();
  }
}

/**
 * Get vendor by ID
 * @param id Vendor ID
 * @returns Vendor details
 */
export async function getVendorById(id: string): Promise<Vendor | null> {
  try {
    console.log(`Fetching vendor with ID: ${id}`);
    
    // First try the GET endpoint with the id in the URL path
    try {
      console.log(`Trying GET endpoint: /api/vendor/get/${id}`);
      const response = await apiRequest<SingleVendorApiResponse>(`/api/vendor/get/${id}`);
      
      if (response.success && response.data) {
        console.log(`Successfully fetched vendor ${id}, name: ${response.data.name}`);
        return response.data;
      } else {
        console.warn(`GET endpoint unsuccessful for vendor ${id}:`, response.message);
      }
    } catch (getError) {
      console.error(`Error with GET vendor/${id} endpoint:`, getError);
    }
    
    // If GET fails, try POST approach with id in body
    try {
      console.log(`Trying POST endpoint with ID in body`);
      const postResponse = await apiRequest<SingleVendorApiResponse>('/api/vendor/get-by-id', {
        method: 'POST',
        body: JSON.stringify({ _id: id })
      });
      
      if (postResponse.success && postResponse.data) {
        console.log(`Successfully fetched vendor ${id} using POST method`);
        return postResponse.data;
      } else {
        console.warn(`POST endpoint unsuccessful for vendor ${id}:`, postResponse.message);
      }
    } catch (postError) {
      console.error(`Error with POST vendor body approach:`, postError);
    }
    
    // Final fallback - get all vendors and find by ID
    console.log(`Using final fallback: get all vendors and find by ID ${id}`);
    const allVendors = await getActiveVendors();
    console.log(`Searching through ${allVendors.length} vendors for ID: ${id}`);
    
    const vendor = allVendors.find(v => String(v._id) === String(id));
    
    if (vendor) {
      console.log(`Found vendor ${id} using fallback approach, name: ${vendor.name}`);
      return vendor;
    } else {
      console.warn(`Vendor ${id} not found in any approach`);
      return null;
    }
  } catch (error) {
    console.error(`All vendor fetching approaches failed for ${id}:`, error);
    return null;
  }
}

/**
 * Get products by vendor ID
 * @param vendorId Vendor ID
 * @param page Page number (optional)
 * @param limit Items per page (optional)
 * @returns List of products from the vendor
 */
export async function getProductsByVendor(vendorId: string, page: number = 1, limit: number = 50) {
  try {
    console.log(`Fetching products for vendor: ${vendorId}`);
    // First try with the vendor/:id endpoint format
    const response = await apiRequest<ProductApiResponse>(`/api/product/vendor/${vendorId}`, {
      method: 'GET'
    });
    
    if (response.success) {
      console.log(`Fetched ${response.data?.length || 0} products for vendor ${vendorId} using GET endpoint`);
      return response.data || [];
    }
    
    // If the first method fails, try the POST endpoint
    console.log(`Trying POST endpoint for vendor products`);
    const postResponse = await apiRequest<ProductApiResponse>('/api/product/get-products-by-vendor', {
      method: 'POST',
      body: JSON.stringify({ 
        vendor: vendorId,
        page,
        limit
      })
    });
    
    if (postResponse.success) {
      console.log(`Fetched ${postResponse.data?.length || 0} products for vendor ${vendorId} using POST endpoint`);
      return postResponse.data || [];
    }
    
    // If both methods fail, try the generic products endpoint and filter by vendor
    console.log(`Trying fallback approach: get all products and filter by vendor ID`);
    const allProductsResponse = await apiRequest<ProductApiResponse>('/api/product/get', {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    if (allProductsResponse.success && Array.isArray(allProductsResponse.data)) {
      // Filter products by vendor ID
      const vendorProducts = allProductsResponse.data.filter((product: Product) => {
        if (typeof product.vendor === 'string') {
          return product.vendor === vendorId;
        } else if (product.vendor && typeof product.vendor === 'object') {
          return product.vendor._id === vendorId;
        }
        return false;
      });
      console.log(`Found ${vendorProducts.length} products for vendor ${vendorId} using fallback approach`);
      return vendorProducts;
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching vendor products:`, error);
    return [];
  }
}

/**
 * Get all vendors with multiple fallback strategies
 * Attempts multiple strategies to get vendor data in case of API issues
 * @returns List of vendors
 */
export async function getAllVendorsWithFallbacks(): Promise<Vendor[]> {
  console.log('Getting all vendors with fallbacks');
  
  // Try primary method first - getActiveVendors
  try {
    const activeVendors = await getActiveVendors();
    if (activeVendors && activeVendors.length > 0) {
      console.log('Successfully retrieved active vendors:', activeVendors.length);
      return activeVendors;
    }
  } catch (error) {
    console.error('Failed to get active vendors:', error);
  }
  
  // Try second method - getAllVendors
  try {
    const allVendors = await getAllVendors();
    if (allVendors && allVendors.length > 0) {
      console.log('Successfully retrieved all vendors:', allVendors.length);
      return allVendors;
    }
  } catch (error) {
    console.error('Failed to get all vendors:', error);
  }
  
  // Final fallback - direct API call
  try {
    console.log('Trying direct API call fallback');
    const response = await apiRequest<VendorApiResponse>('/api/vendor/get-active', {
      method: 'GET',
      cache: 'no-store'
    });
    
    if (response.success && response.data && response.data.length > 0) {
      console.log('Direct API call successful:', response.data.length);
      return response.data;
    }
  } catch (finalError) {
    console.error('All vendor retrieval methods failed:', finalError);
  }
  
  // If all methods fail, return empty array
  console.warn('All vendor retrieval methods failed, returning empty array');
  return [];
}