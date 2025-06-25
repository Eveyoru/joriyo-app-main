import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from './ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Product, calculateDiscountedPrice } from '@/services/product';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useCartRedirect } from '@/context/CartRedirectContext';
import ProductVariationModal from './ProductVariationModal';
import { CachedImage } from './CachedImage';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const [showQuantityControl, setShowQuantityControl] = useState(false);
  const { addToCart, removeFromCart, cartItems, isInCart, getCartItemQuantity, updateQuantity } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { handleAddToCart: redirectToLogin } = useCartRedirect();
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  // Check if product is in cart
  useEffect(() => {
    setShowQuantityControl(isInCart(product._id));
  }, [cartItems, product._id, isInCart]);

  // Add helper function to handle complex image URLs
  const getImageUrl = (product: any): string | null => {
    // Handle image array
    if (product.image?.[0]) {
      if (typeof product.image[0] === 'string') {
        return product.image[0];
      }
      if (typeof product.image[0] === 'object' && 'url' in product.image[0]) {
        return product.image[0].url;
      }
    }
  
    // Handle imageValue array
    if (Array.isArray(product.imageValue) && product.imageValue[0]) {
      return typeof product.imageValue[0] === 'string' ? product.imageValue[0] : null;
    }
  
    // Handle images array
    if (Array.isArray(product.images) && product.images[0]) {
      return typeof product.images[0] === 'string' ? product.images[0] : null;
    }
  
    return null;
  };

  // Handle product press
  const handleProductPress = () => {
    router.push(`/product/${product._id}`);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }
    
    if (product.hasVariations && product.variations && product.variations.length > 0) {
      // Show variation modal instead of navigating
      setShowVariationModal(true);
      return;
    }
    
    try {
      addToCart(product, 1);
      setShowQuantityControl(true);
      
      if (onAddToCart) {
        onAddToCart(product);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add product to cart');
    }
  };

  // Handle decrease quantity
  const handleDecreaseQuantity = () => {
    const currentQuantity = getCartItemQuantity(product._id);
    
    if (currentQuantity <= 1) {
      removeFromCart(product._id);
      setShowQuantityControl(false);
    } else {
      updateQuantity(product._id, currentQuantity - 1);
    }
  };

  // Handle increase quantity
  const handleIncreaseQuantity = () => {
    const currentQuantity = getCartItemQuantity(product._id);
    
    // Check stock limits
    let stockLimit = product.stock;
    if (product.hasVariations && product.variations && product.variations.length > 0) {
      stockLimit = product.variations[0].stock;
    }
    
    if (typeof stockLimit === 'number' && currentQuantity >= stockLimit) {
      Alert.alert("Stock Limit", `Cannot add more. Stock limit reached (${stockLimit} available)`);
      return;
    }
    
    updateQuantity(product._id, currentQuantity + 1);
  };
  
  // Get discounted price
  const getDisplayPrice = (): number => {
    // For products with variations, show the lowest price
    if (product.hasVariations && product.variations && product.variations.length > 0) {
      // Get all variations (we want to show the lowest price even if out of stock)
      const validVariations = product.variations.filter(v => 
        v && typeof v === 'object' && 
        (typeof v.price === 'number' || typeof v.price === 'string')
      );
      
      if (validVariations.length > 0) {
        // Get all prices as numbers
        const prices = validVariations.map(v => {
          const price = typeof v.price === 'string' ? parseFloat(v.price) : Number(v.price);
          return isNaN(price) ? Infinity : price;
        }).filter(price => price !== Infinity && price > 0);
        
        if (prices.length > 0) {
          const lowestPrice = Math.min(...prices);
          
          // IMPORTANT: Force this price to be returned and ignore any discount calculation
          // This ensures variation products never show 0 price
          if (lowestPrice > 0) {
            return product.discount && product.discount > 0 
              ? lowestPrice * (1 - product.discount/100) 
              : lowestPrice;
          }
        }
      }
    }
    
    // For regular products, use the standard discount calculation
    return calculateDiscountedPrice(product);
  };
  
  // Get original price for display
  const getOriginalPrice = (): number | null => {
    if (product.hasVariations && product.variations && product.variations.length > 0) {
      // Get all variations (we want to show the lowest price even if out of stock)
      const validVariations = product.variations.filter(v => 
        v && typeof v === 'object' && 
        (typeof v.price === 'number' || typeof v.price === 'string')
      );
      
      if (validVariations.length > 0) {
        // Get all prices as numbers
        const prices = validVariations.map(v => {
          const price = typeof v.price === 'string' ? parseFloat(v.price) : Number(v.price);
          return isNaN(price) ? Infinity : price;
        }).filter(price => price !== Infinity && price > 0);
        
        if (prices.length > 0) {
          return Math.min(...prices);
        }
      }
      return null;
    }
    
    return product.price;
  };
  
  const displayPrice = getDisplayPrice();
  const originalPrice = getOriginalPrice();
  const discountPercentage = product.discount && product.discount > 0 ? product.discount : 
    (originalPrice && displayPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0);
  
  return (
    <>
      <TouchableOpacity 
        style={styles.container}
        onPress={handleProductPress}
        activeOpacity={0.8}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <CachedImage
            uri={getImageUrl(product)}
            style={styles.productImage}
            resizeMode="contain"
            placeholder={
              <View style={[styles.productImage, styles.placeholderContainer]}>
                <ActivityIndicator color="#0CAF50" />
              </View>
            }
          />
          
          {/* ADD Button or Quantity Controls */}
          {showQuantityControl ? (
            <View style={styles.quantityButtonContainer}>
              <TouchableOpacity 
                style={styles.minusButton}
                onPress={handleDecreaseQuantity}
              >
                <ThemedText style={styles.quantityButtonText}>-</ThemedText>
              </TouchableOpacity>
              
              <View style={styles.quantityTextContainer}>
                <ThemedText style={styles.quantityText}>
                  {getCartItemQuantity(product._id)}
                </ThemedText>
              </View>
              
              <TouchableOpacity 
                style={styles.plusButton}
                onPress={handleIncreaseQuantity}
              >
                <ThemedText style={styles.quantityButtonText}>+</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddToCart}
            >
              <ThemedText style={styles.addButtonText}>ADD</ThemedText>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Product Details - in a single container */}
        <View style={styles.detailsContainer}>
          {/* Units/Quantity */}
          {product.quantity && product.unit && (
            <ThemedText style={styles.unitText}>
              {product.quantity} {product.unit}
            </ThemedText>
          )}
          
          {/* Product Title */}
          <ThemedText 
            numberOfLines={2} 
            style={styles.title}
          >
            {product.name}
          </ThemedText>
          
          {/* Discount Percentage */}
          {discountPercentage > 0 && (
            <ThemedText style={styles.discountText}>
              {discountPercentage}% OFF
            </ThemedText>
          )}
          
          {/* Rating Stars - if available */}
          {product.rating !== undefined && (
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialIcons 
                  key={star} 
                  name={star <= Math.floor(Number(product.rating)) ? "star" : star <= Number(product.rating) + 0.5 ? "star-half" : "star-border"} 
                  size={14} 
                  color="#FFC107" 
                  style={styles.starIcon}
                />
              ))}
            </View>
          )}
          
          {/* Price Row */}
          <View style={styles.priceRow}>
            {/* Current Price */}
            <ThemedText style={styles.price}>
              ₹{displayPrice !== null && displayPrice !== undefined 
                ? Math.round(displayPrice).toString()
                : '0'}
            </ThemedText>
            
            {/* Original MRP Price */}
            {originalPrice !== null && originalPrice !== undefined && originalPrice !== displayPrice && (
              <ThemedText style={styles.originalPrice}>
                MRP ₹{Math.round(originalPrice).toString()}
              </ThemedText>
            )}
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Add ProductVariationModal */}
      <ProductVariationModal
        product={product}
        visible={showVariationModal}
        onClose={() => setShowVariationModal(false)}
        onSelectVariation={(variationId, size) => {
          // Handle variation selection
          console.log('Selected variation:', variationId, size);
          
          // Find the selected variation
          const selectedVar = product.variations?.find(v => v._id === variationId);
          
          if (selectedVar) {
            setSelectedVariation(selectedVar);
            
            // Create a product with the selected variation
            const productWithVariation = {
              ...product,
              price: selectedVar.price,
              stock: selectedVar.stock,
              selectedVariationId: variationId,
              selectedSize: size
            };
            
            // Add to cart
            addToCart(productWithVariation, 1);
            setShowQuantityControl(true);
          }
        }}
      />
    </>
  );
};

const getProductImageUrl = (product: Product): string | null => {
  if (!product) return null;

  if (product.imageValue && Array.isArray(product.imageValue) && product.imageValue.length > 0) {
    return product.imageValue[0];
  }

  if (product.image) {
    if (Array.isArray(product.image) && product.image.length > 0) {
      const firstImage = product.image[0];
      return typeof firstImage === 'string' ? firstImage : firstImage?.url || null;
    }
    return typeof product.image === 'string' ? product.image : null;
  }

  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    return typeof firstImage === 'string' ? firstImage : firstImage?.url || null;
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    /* Remove border */
    borderWidth: 0,
    /* Remove all shadow effects */
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  imageContainer: {
    height: 150,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 10,
    paddingTop: 8,
  },
  unitText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Okra-Regular',
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Okra-Bold',
    color: '#212121',
    lineHeight: 18,
    marginBottom: 4,
  },
  discountText: {
    fontSize: 12,
    fontFamily: 'Okra-Medium',
    color: '#2196F3', // Blue color for discount text
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  starIcon: {
    marginRight: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  price: {
    fontSize: 14,
    fontFamily: 'Okra-Bold',
    color: '#212121',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 12,
    fontFamily: 'Okra-Regular',
    color: '#777777',
    textDecorationLine: 'line-through',
  },
  addButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3f8c2a', // Darker green
    borderRadius: 6, // More rounded corners
  },
  addButtonText: {
    color: '#3f8c2a', // Darker green
    fontSize: 12,
    fontFamily: 'Okra-Bold',
  },
  quantityButtonContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    height: 28,
    backgroundColor: '#2E7D32',
  },
  minusButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityTextContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Okra-Bold',
  },
  quantityText: {
    fontSize: 14,
    fontFamily: 'Okra-Regular',
    color: 'white',
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  placeholderContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default ProductCard;