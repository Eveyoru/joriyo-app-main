import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/services/product';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { addToCart as apiAddToCart, getCart, updateCart } from '@/services/cart';

// Define the cart item interface
export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariationId?: string;
  selectedSize?: string;
}

// Define the context interface
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (productId: string) => boolean;
  getCartItemQuantity: (productId: string) => number;
  totalItems: number;
  totalAmount: number;
  syncCart: () => Promise<void>;
}

// Create the cart context
const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  isInCart: () => false,
  getCartItemQuantity: () => 0,
  totalItems: 0,
  totalAmount: 0,
  syncCart: async () => {},
});

// Create the cart provider
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const { isAuthenticated, user } = useAuth();

  // Load cart from storage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCartItems = await AsyncStorage.getItem('cartItems');
        if (storedCartItems) {
          setCartItems(JSON.parse(storedCartItems));
        }
      } catch (error) {
        console.error('Error loading cart from storage:', error);
      }
    };
    
    loadCart();
  }, []);
  
  // Sync with backend when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      syncCart();
    }
  }, [isAuthenticated, user]);

  // Calculate totals when cart changes
  useEffect(() => {
    let items = 0;
    let amount = 0;
    
    cartItems.forEach(item => {
      items += item.quantity;
      
      // Calculate price based on selected variation or product price
      let finalPrice;
      
      if (item.product.selectedVariationId && item.product.variations) {
        // For products with selected variations, use the variation price
        const selectedVariation = item.product.variations.find(v => v._id === item.product.selectedVariationId);
        
        if (selectedVariation && selectedVariation.price) {
          finalPrice = typeof selectedVariation.price === 'string' 
            ? parseFloat(selectedVariation.price) 
            : selectedVariation.price;
        } else if (item.product.hasVariations && item.product.variations.length > 0) {
          // If variation not found but product has variations, use lowest variation price
          const validPrices = item.product.variations
            .filter(v => v && typeof v === 'object')
            .map(v => {
              const price = typeof v.price === 'string' ? parseFloat(v.price) : Number(v.price);
              return isNaN(price) ? Infinity : price;
            })
            .filter(price => price !== Infinity && price > 0);
          
          if (validPrices.length > 0) {
            finalPrice = Math.min(...validPrices);
          } else {
            finalPrice = item.product.price || 0;
          }
        } else {
          // Fallback to product price
          finalPrice = item.product.price || 0;
        }
      } else {
        // For regular products without variations
        finalPrice = item.product.price || 0;
      }
      
      // Apply discount if available
      if (item.product.discount && item.product.discount > 0) {
        finalPrice = finalPrice - (finalPrice * (item.product.discount / 100));
      }
      
      amount += finalPrice * item.quantity;
    });
    
    setTotalItems(items);
    setTotalAmount(amount);
    
    // Save to storage
    AsyncStorage.setItem('cartItems', JSON.stringify(cartItems)).catch(error => {
      console.error('Error saving cart to storage:', error);
    });
  }, [cartItems]);

  // Sync cart with backend
  const syncCart = async () => {
    if (!isAuthenticated) return;
    
    try {
      // Get current cart from API
      const apiCart = await getCart();
      
      if (apiCart) {
        // Convert API cart format to local cart format
        const apiCartItems: CartItem[] = apiCart.items.map(item => ({
          product: {
            ...item.product,
            selectedVariationId: item.variationId,
            selectedSize: item.size
          },
          quantity: item.quantity,
          selectedVariationId: item.variationId,
          selectedSize: item.size
        }));
        
        // Update local cart with API cart
        setCartItems(apiCartItems);
      }
    } catch (error) {
      console.error('Error syncing cart with backend:', error);
      
      // If error, try updating backend with local cart
      try {
        const cartItemsToSync = cartItems.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          variationId: item.product.selectedVariationId || item.selectedVariationId,
          size: item.product.selectedSize || item.selectedSize
        }));
        
        await updateCart({ items: cartItemsToSync });
      } catch (syncError) {
        console.error('Error updating backend cart:', syncError);
      }
    }
  };

  // Add item to cart with enhanced logging
  const addToCart = async (product: Product, quantity: number) => {
    try {
      console.log('Adding to cart:', { 
        productId: product._id, 
        productName: product.name,
        hasVariations: product.hasVariations,
        selectedVariationId: product.selectedVariationId,
        selectedSize: product.selectedSize,
        quantity
      });
      
      // Check if product already exists in cart
      const existingItemIndex = cartItems.findIndex(item => {
        // For products with variations, we need to check both product ID and variation ID
        if (product.hasVariations && product.selectedVariationId) {
          console.log('Checking if variation exists in cart:', {
            cartProductId: item.product._id,
            productId: product._id,
            cartVariationId: item.selectedVariationId,
            productVariationId: product.selectedVariationId
          });
          return item.product._id === product._id && 
                 item.selectedVariationId === product.selectedVariationId;
        }
        
        // For regular products, just check the product ID
        return item.product._id === product._id;
      });
      
      // Clone the cart items array to avoid direct state mutation
      const updatedCartItems = [...cartItems];
      
      if (existingItemIndex !== -1) {
        // Update existing item
        console.log('Updating existing cart item');
        updatedCartItems[existingItemIndex] = {
          ...updatedCartItems[existingItemIndex],
          quantity: updatedCartItems[existingItemIndex].quantity + quantity
        };
      } else {
        // Add new item
        console.log('Adding new item to cart');
        updatedCartItems.push({
          product,
          quantity,
          selectedVariationId: product.selectedVariationId,
          selectedSize: product.selectedSize
        });
      }
      
      // Update state
      setCartItems(updatedCartItems);
      
      // Sync with backend if user is authenticated
      if (isAuthenticated && user) {
        console.log('Updating backend cart for user:', user.id);
        await syncCart();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId: string, variationId?: string) => {
    try {
      // If variation ID provided, remove specific variation
      const updatedCart = cartItems.filter(item => {
        if (variationId) {
          return !(item.product._id === productId && 
                  (item.selectedVariationId === variationId || 
                   item.product.selectedVariationId === variationId));
        }
        return item.product._id !== productId;
      });
      
      setCartItems(updatedCart);
      
      // If authenticated, update backend cart
      if (isAuthenticated && user) {
        try {
          const cartItemsToSync = updatedCart.map(item => ({
            productId: item.product._id,
            quantity: item.quantity,
            variationId: item.product.selectedVariationId || item.selectedVariationId,
            size: item.product.selectedSize || item.selectedSize
          }));
          
          await updateCart({ items: cartItemsToSync });
        } catch (error) {
          console.error('Error updating backend cart after removal:', error);
        }
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      Alert.alert('Error', 'Could not remove item from cart');
    }
  };

  // Update item quantity
  const updateQuantity = async (productId: string, quantity: number, variationId?: string) => {
    try {
      console.log('Updating quantity:', { productId, quantity, variationId });
      
      if (quantity <= 0) {
        // If quantity is 0, remove item
        return removeFromCart(productId, variationId);
      }
      
      // Find the item to update
      const updatedCart = [...cartItems];
      const itemIndex = updatedCart.findIndex(item => {
        if (variationId) {
          return item.product._id === productId && 
                (item.selectedVariationId === variationId || 
                 item.product.selectedVariationId === variationId);
        }
        return item.product._id === productId;
      });
      
      if (itemIndex !== -1) {
        // Important: directly set the new quantity rather than adding to it
        updatedCart[itemIndex] = {
          ...updatedCart[itemIndex],
          quantity,
        };
        
        setCartItems(updatedCart);
        
        // If authenticated, update backend cart
        if (isAuthenticated && user) {
          try {
            console.log('Updating backend cart after quantity change');
            const cartItemsToSync = updatedCart.map(item => ({
              productId: item.product._id,
              quantity: item.quantity,
              variationId: item.product.selectedVariationId || item.selectedVariationId,
              size: item.product.selectedSize || item.selectedSize
            }));
            
            await updateCart({ items: cartItemsToSync });
          } catch (error) {
            console.error('Error updating backend cart after quantity change:', error);
          }
        }
      } else {
        console.warn('Item not found in cart for quantity update:', productId);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Could not update quantity');
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      setCartItems([]);
      await AsyncStorage.removeItem('cartItems');
      
      // If authenticated, clear backend cart
      if (isAuthenticated && user) {
        try {
          await updateCart({ items: [] });
        } catch (error) {
          console.error('Error clearing backend cart:', error);
        }
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      Alert.alert('Error', 'Could not clear cart');
    }
  };

  // Check if product is in cart
  const isInCart = (productId: string, variationId?: string) => {
    return cartItems.some(item => {
      if (variationId) {
        return item.product._id === productId && 
              (item.selectedVariationId === variationId || 
               item.product.selectedVariationId === variationId);
      }
      return item.product._id === productId;
    });
  };

  // Get cart item quantity
  const getCartItemQuantity = (productId: string, variationId?: string) => {
    const item = cartItems.find(item => {
      if (variationId) {
        return item.product._id === productId && 
              (item.selectedVariationId === variationId || 
               item.product.selectedVariationId === variationId);
      }
      return item.product._id === productId;
    });
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        getCartItemQuantity,
        totalItems,
        totalAmount,
        syncCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Create hook for easier context use
export const useCart = () => useContext(CartContext);
