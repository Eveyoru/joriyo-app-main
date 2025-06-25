import { apiRequest, getFullImageUrl } from '@/utils/api';
import { Vendor } from './vendor';

export interface Product {
  _id: string;
  id: string;
  name: string;
  description?: string;
  price: number;  // This will store the original price (MRP)
  discount?: number;  // This will store the discount percentage
  quantity: number;
  unit?: string;
  hasImages?: boolean;
  imageType?: string;
  imageValue?: string[];
  image?: string | { url: string }[];
  images?: string[] | { url: string }[];
  categoryId?: string;
  isActive?: boolean;
  stock?: number | null;
  createdAt?: string;
  updatedAt?: string;
  hasVariations?: boolean;
  variations?: Array<{
    _id: string;
    size: string;
    price: number;
    stock: number;
    sku?: string;
  }>;
  selectedSize?: string;
  selectedVariationId?: string;
  vendor?: Vendor | null;  // Add vendor information
  rating?: number;  // Add rating property
}

interface ProductApiResponse {
  data: Product[];
  success: boolean;
  message?: string;
  error: boolean;
}

interface SingleProductApiResponse {
  data: Product;
  success: boolean;
  message?: string;
  error: boolean;
}

// Get all products
export async function getProducts(): Promise<Product[]> {
  try {
    // Using the correct endpoint from server route
    const response = await apiRequest<ProductApiResponse>('/api/product/get', {
      method: 'POST', // Server expects POST request
      body: JSON.stringify({}), // Empty body for all products
    });
    
    if (!response.success) {
      console.warn('Product fetch unsuccessful:', response.message);
      return [];
    }
    
    console.log('Fetched all products:', response.data?.length || 0);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Get featured products - using regular product endpoint since featured is not available
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    // Using regular product endpoint with empty filter
    const response = await apiRequest<ProductApiResponse>('/api/product/get', {
      method: 'POST',
      body: JSON.stringify({ featured: true }), // Attempt to filter featured, server may ignore
    });
    
    if (!response.success) {
      console.warn('Featured product fetch unsuccessful:', response.message);
      return [];
    }
    
    console.log('Fetched featured products:', response.data?.length || 0);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

// Get products by category
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    console.log(`Calling API to get products for category ID: ${categoryId}`);
    
    const response = await apiRequest<ProductApiResponse>(`/api/product/get-product-by-category`, {
      method: 'POST',
      body: JSON.stringify({ id: categoryId }) 
    });
    
    if (!response.success) {
      console.error(`API error for category ${categoryId}:`, response.message);
      return [];
    }
    
    if (!response.data || !Array.isArray(response.data)) {
      console.error(`Invalid data format for category ${categoryId}:`, response);
      return [];
    }
    
    console.log(`API returned ${response.data?.length || 0} products for category ${categoryId}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

// Get products by category and subcategory
export async function getProductsByCategoryAndSubcategory(categoryId: string, subcategoryId: string, page: number = 1, limit: number = 10): Promise<Product[]> {
  try {
    // Send request with both categoryId and subCategoryId (note the capitalization of "subCategoryId")
    const response = await apiRequest<ProductApiResponse>('/api/product/get-pruduct-by-category-and-subcategory', {
      method: 'POST',
      body: JSON.stringify({
        categoryId,
        subCategoryId: subcategoryId, // Backend expects "subCategoryId" not "subcategoryId"
        page,
        limit
      }),
    });
    
    if (!response.success) {
      console.warn('Product fetch by category and subcategory unsuccessful:', response.message);
      return [];
    }
    
    console.log('Fetched', response.data?.length || 0, 'products for category', categoryId, 'and subcategory', subcategoryId);
    
    // Log the first product to see its structure
    if (response.data && response.data.length > 0) {
      console.log('Sample product structure:', JSON.stringify(response.data[0], null, 2));
    }
    
    return response.data || [];
  } catch (error) {
    console.error('Error fetching products by category and subcategory:', error);
    return [];
  }
}

// Get product by id
export async function getProductById(productId: string): Promise<Product | null> {
  try {
    console.log('Fetching product details for:', productId);
    const response = await apiRequest<SingleProductApiResponse>('/api/product/get-product-details', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
    
    if (!response.success || !response.data) {
      console.warn(`Product ${productId} fetch unsuccessful:`, response.message);
      return null;
    }
    
    // The API returns a single product object
    const product = response.data;
    
    if (!product) {
      console.warn('No product found in response');
      return null;
    }

    // Debug log to inspect variations data
    if (product.hasVariations && product.variations) {
      console.log('Product has variations:', product.variations.length);
      console.log('Sample variation:', JSON.stringify(product.variations[0], null, 2));
    } else if (product.hasVariations && !product.variations) {
      console.warn('Product marked as having variations but no variations array provided');
    }

    // Debug log to inspect vendor data if present
    if (product.vendor) {
      console.log('Product has vendor information:', JSON.stringify(product.vendor, null, 2));
    }

    // Find lowest price variation if has variations
    let lowestPriceVariation = null;
    if (product.hasVariations && product.variations && product.variations.length > 0) {
      // Sort variations by price
      const inStockVariations = product.variations.filter(v => v.stock > 0);
      if (inStockVariations.length > 0) {
        lowestPriceVariation = inStockVariations.reduce((lowest, current) => 
          (current.price < lowest.price) ? current : lowest, inStockVariations[0]);
      } else {
        // If all out of stock, still find lowest price
        lowestPriceVariation = product.variations.reduce((lowest, current) => 
          (current.price < lowest.price) ? current : lowest, product.variations[0]);
      }
      console.log('Lowest price variation:', lowestPriceVariation);
    }

    // Map API response fields to our Product interface
    return {
      _id: product.id || product._id,
      id: product.id,
      name: product.name,
      description: product.description,
      // Use the lowest variation price if available and lower than product.price
      price: (lowestPriceVariation && (!product.price || lowestPriceVariation.price < product.price)) 
        ? lowestPriceVariation.price 
        : product.price,
      discount: product.discount,
      quantity: product.quantity,
      unit: product.unit,
      hasImages: product.hasImages,
      imageType: product.imageType,
      imageValue: product.imageValue,
      image: product.image,
      images: product.images,
      categoryId: product.categoryId,
      isActive: product.isActive,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      hasVariations: product.hasVariations,
      variations: product.variations,
      // If we found a lowest price variation, preselect it
      selectedSize: lowestPriceVariation ? lowestPriceVariation.size : product.selectedSize,
      selectedVariationId: lowestPriceVariation ? lowestPriceVariation._id : product.selectedVariationId,
      vendor: product.vendor ?? null, // Include vendor information
    };
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    return null;
  }
}

// Helper function to calculate discounted price
export function calculateDiscountedPrice(product: Product, variationPrice?: number): number {
  // If a specific variation price is provided, use that instead of product.price
  const basePrice = variationPrice !== undefined ? variationPrice : product.price;
  
  // Handle the case where basePrice is null or undefined
  if (basePrice === null || basePrice === undefined) {
    console.warn('calculateDiscountedPrice: Price is null/undefined', { 
      productId: product._id, 
      productName: product.name,
      basePrice,
      variationPrice
    });
    return 0;
  }
  
  // Handle case where discount is null, undefined, or <= 0
  if (!product.discount || product.discount <= 0) {
    return basePrice;
  }
  
  // Calculate discount with proper conversion to ensure numerical operation
  const discount = typeof product.discount === 'string' 
    ? parseFloat(product.discount) 
    : product.discount;
    
  const numericBasePrice = typeof basePrice === 'string' 
    ? parseFloat(basePrice) 
    : basePrice;
  
  const discountAmount = (numericBasePrice * discount) / 100;
  const finalPrice = Math.max(0, numericBasePrice - discountAmount); // Ensure we don't return negative prices
  
  // Round to a whole number to match the display in the app
  return Math.round(finalPrice);
}
