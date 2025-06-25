import { fetchWithErrorHandling } from './api-helpers';

export interface SubCategory {
  _id: string;
  // MongoDB stores category as an array of ObjectIds, not as a single categoryId
  category: Array<{
    _id: string;
    name: string;
  }>;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all subcategories
 * @returns Array of subcategories
 */
export const getAllSubCategories = async (): Promise<SubCategory[]> => {
  try {
    console.log('Fetching all subcategories');
    const data = await fetchWithErrorHandling<{ data: SubCategory[], success: boolean }>('api/subcategory/get', {
      method: 'POST',
    });
    
    console.log(`Fetched ${data.data.length} subcategories`);
    return data.data || [];
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return [];
  }
};

/**
 * Get subcategories by category ID
 * @param categoryId The category ID to fetch subcategories for
 * @returns Array of subcategories for the specified category
 */
export const getSubCategoriesByCategoryId = async (categoryId: string): Promise<SubCategory[]> => {
  try {
    console.log(`Fetching subcategories for category ${categoryId}`);
    const data = await fetchWithErrorHandling<{ data: SubCategory[], success: boolean }>('api/subcategory/get', {
      method: 'POST',
      body: JSON.stringify({ categoryId }),
    });
    
    // Filter subcategories by category array since the backend API doesn't filter
    // In the database, subcategories have a 'category' array of ObjectIds
    const filteredSubcategories = data.data.filter(subcategory => {
      // Check if the subcategory has a category array
      if (Array.isArray(subcategory.category)) {
        // Check if any category in the array matches our categoryId
        return subcategory.category.some(cat => {
          if (typeof cat === 'string') {
            return cat === categoryId;
          } else if (cat && typeof cat === 'object' && '_id' in cat) {
            return cat._id === categoryId;
          }
          return false;
        });
      }
      return false;
    });
    
    console.log(`Fetched ${filteredSubcategories.length} subcategories for category ${categoryId}`);
    return filteredSubcategories || [];
  } catch (error) {
    console.error(`Error fetching subcategories for category ${categoryId}:`, error);
    return [];
  }
};
