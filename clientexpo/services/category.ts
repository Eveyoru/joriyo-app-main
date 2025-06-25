import { apiRequest, getFullImageUrl } from '@/utils/api';

export interface Category {
  _id: string;
  name: string;
  icon?: string;
  image: string;
  displayOrder?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryApiResponse {
  data: Category[];
  success: boolean;
  message?: string;
  error: boolean;
}

interface SingleCategoryApiResponse {
  data: Category;
  success: boolean;
  message?: string;
  error: boolean;
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  try {
    // Using the correct endpoint from server route
    const response = await apiRequest<CategoryApiResponse>('/api/category/get');
    
    if (!response.success) {
      console.warn('Category fetch unsuccessful:', response.message);
      return [];
    }
    
    console.log('Fetched all categories:', response.data?.length || 0);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Get categories for the home screen - using the same endpoint as all categories
// since there is no specific home endpoint
export async function getHomeCategories(): Promise<Category[]> {
  try {
    // Using general category endpoint
    const response = await apiRequest<CategoryApiResponse>('/api/category/get');
    
    if (!response.success) {
      console.warn('Home category fetch unsuccessful:', response.message);
      return [];
    }
    
    // If needed, we can filter the categories for home display here
    // For example, only showing categories with isActive=true
    const homeCategories = response.data?.filter(cat => cat.isActive) || [];
    
    console.log('Fetched home categories:', homeCategories.length || 0);
    return homeCategories;
  } catch (error) {
    console.error("Error fetching home categories:", error);
    return [];
  }
}

// Get category details - using the main category endpoint and filtering client-side
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const response = await apiRequest<CategoryApiResponse>('/api/category/get');
    
    if (!response.success) {
      console.warn(`Category fetch unsuccessful:`, response.message);
      return null;
    }
    
    // Find the specific category by ID
    const category = response.data?.find(cat => cat._id === id);
    
    if (!category) {
      console.warn(`Category ${id} not found in results`);
      return null;
    }
    
    return category;
  } catch (error) {
    console.error(`Error fetching category ${id}:`, error);
    return null;
  }
}

// Map of category names to Material Icons names
// This helps us display appropriate icons for categories even if they don't have an icon field
export const CATEGORY_ICON_MAP: Record<string, string> = {
  'Electronics': 'devices',
  'Beauty': 'brush',
  'Toys': 'toys',
  'Gifting': 'card-giftcard',
  'Premium': 'diamond',
  'Fashion': 'checkroom',
  'Home': 'home',
  'Food': 'restaurant',
  'Grocery': 'shopping-basket',
  'Fruits': 'spa',
  'Vegetables': 'eco',
  'Bakery': 'breakfast-dining',
  'Dairy': 'opacity',
  'Meat': 'restaurant',
  'Beverages': 'local-drink',
  'Personal Care': 'face',
  'Baby Care': 'child-care',
  'Household': 'cleaning-services',
  'Pet Care': 'pets',
  'Stationery': 'edit',
  'Books': 'menu-book',
  'Sports': 'sports-basketball',
  'Automotive': 'directions-car',
  'Tools': 'build',
  'Garden': 'yard',
  'Furniture': 'chair',
  'Appliances': 'kitchen',
  'Pharmacy': 'medical-services',
  'Health': 'favorite',
};

/**
 * Gets an icon name for a category
 * @param category The category to get icon for
 * @returns The Material Icons name for the category
 */
export function getCategoryIcon(category: Category | string): string {
  const categoryName = typeof category === 'string' ? category : category.name;
  
  // Return the icon if it exists in our map
  if (CATEGORY_ICON_MAP[categoryName]) {
    return CATEGORY_ICON_MAP[categoryName];
  }
  
  // Check for partial matches in the map
  for (const [key, value] of Object.entries(CATEGORY_ICON_MAP)) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Default icon
  return 'category';
}

// Interface for featured categories
export interface FeaturedCategory {
  _id: string;
  name: string;
  image: string;
  coverImage?: string;
  description?: string;
  products: any[]; // This could be more strongly typed if needed
  displayOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FeaturedCategoryApiResponse {
  data: FeaturedCategory[];
  success: boolean;
  message?: string;
  error: boolean;
}

// Get featured categories from the server
export async function getFeaturedCategories(): Promise<FeaturedCategory[]> {
  try {
    const response = await apiRequest<FeaturedCategoryApiResponse>('/api/featured-category/get-active');
    
    if (!response.success) {
      console.warn('Featured categories fetch unsuccessful:', response.message);
      return [];
    }
    
    console.log('Fetched featured categories:', response.data?.length || 0);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching featured categories:", error);
    return [];
  }
}
