import { API_URL } from '@/constants/config';
import { getToken } from '@/utils/auth';
import { Product } from './product';

// Define cart item interface for API
interface CartItemAPI {
  productId: string;
  quantity: number;
  variationId?: string;
  size?: string;
}

// Define cart update interface
interface CartUpdateData {
  items: CartItemAPI[];
}

// Define cart response interface
interface CartResponse {
  _id: string;
  userId: string;
  items: {
    product: Product;
    quantity: number;
    variationId?: string;
    size?: string;
    _id: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the current user's cart
 */
export const getCart = async (): Promise<CartResponse | null> => {
  try {
    const token = await getToken();
    
    if (!token) {
      console.log('No token found, cannot get cart');
      return null;
    }
    
    const response = await fetch(`${API_URL}/api/cart`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error('Failed to get cart:', response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    console.log('Cart retrieved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error getting cart:', error);
    return null;
  }
};

/**
 * Add an item to the cart
 */
export const addToCart = async (item: CartItemAPI): Promise<boolean> => {
  try {
    const token = await getToken();
    
    if (!token) {
      console.log('No token found, cannot add to cart');
      return false;
    }
    
    const response = await fetch(`${API_URL}/api/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(item)
    });
    
    if (!response.ok) {
      console.error('Failed to add to cart:', response.status, await response.text());
      return false;
    }
    
    const data = await response.json();
    console.log('Item added to cart successfully:', data);
    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return false;
  }
};

/**
 * Update the entire cart
 */
export const updateCart = async (cartData: CartUpdateData): Promise<boolean> => {
  try {
    const token = await getToken();
    
    if (!token) {
      console.log('No token found, cannot update cart');
      return false;
    }
    
    const response = await fetch(`${API_URL}/api/cart`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(cartData)
    });
    
    if (!response.ok) {
      console.error('Failed to update cart:', response.status, await response.text());
      return false;
    }
    
    const data = await response.json();
    console.log('Cart updated successfully:', data);
    return true;
  } catch (error) {
    console.error('Error updating cart:', error);
    return false;
  }
};

/**
 * Remove an item from the cart
 */
export const removeFromCart = async (productId: string, variationId?: string): Promise<boolean> => {
  try {
    const token = await getToken();
    
    if (!token) {
      console.log('No token found, cannot remove from cart');
      return false;
    }
    
    // Build the URL with or without variation ID
    let url = `${API_URL}/api/cart/remove/${productId}`;
    if (variationId) {
      url += `?variationId=${variationId}`;
    }
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error('Failed to remove from cart:', response.status, await response.text());
      return false;
    }
    
    const data = await response.json();
    console.log('Item removed from cart successfully:', data);
    return true;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return false;
  }
};

/**
 * Clear the entire cart
 */
export const clearCart = async (): Promise<boolean> => {
  try {
    const token = await getToken();
    
    if (!token) {
      console.log('No token found, cannot clear cart');
      return false;
    }
    
    const response = await fetch(`${API_URL}/api/cart/clear`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error('Failed to clear cart:', response.status, await response.text());
      return false;
    }
    
    const data = await response.json();
    console.log('Cart cleared successfully:', data);
    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
}; 