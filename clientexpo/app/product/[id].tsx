import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions, StatusBar, Share, FlatList, SafeAreaView, Alert, Modal } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Product, getProductById, calculateDiscountedPrice, getProducts } from '@/services/product';
import { getFullImageUrl } from '@/utils/api';
import { useCart } from '@/context/CartContext';
import { CartSummaryBar } from '@/components/CartSummaryBar';
import { useAuth } from '@/context/AuthContext';
import ProductVariationModal from '@/components/ProductVariationModal';
import { getVendorById } from '@/services/vendor';
import { CachedImage } from '@/components/CachedImage';

const { width: screenWidth } = Dimensions.get('window');

// Define a type for product variations that includes originalPrice
interface ProductVariation {
  _id: string;
  size: string;
  price: number;
  stock: number;
  sku?: string;
  originalPrice?: number;
}

const ProductCard = ({ product }: { product: Product }) => {
  const [showQuantityControl, setShowQuantityControl] = useState(false);
  const [showVariationModal, setShowVariationModal] = useState(false);
  const { addToCart, removeFromCart, cartItems, isInCart, getCartItemQuantity, updateQuantity } = useCart();
  const { user } = useAuth();
  
  // Check if product is in cart
  useEffect(() => {
    setShowQuantityControl(isInCart(product._id));
  }, [cartItems, product._id, isInCart]);
  
  const getProductImage = () => {
    // First try image array
    if (product.image) {
      if (Array.isArray(product.image) && product.image.length > 0) {
        const firstImage = product.image[0];
        if (typeof firstImage === 'string') {
          return firstImage;
        } else if (typeof firstImage === 'object' && firstImage?.url) {
          return firstImage.url;
        }
      } else if (typeof product.image === 'string') {
        return product.image;
      }
    }
    
    // Then try imageValue array
    if (product.imageValue && Array.isArray(product.imageValue) && product.imageValue.length > 0) {
      return product.imageValue[0];
    }
    
    // Default placeholder image
    return 'https://via.placeholder.com/150';
  };

  // Handle add to cart
  const handleAddToCart = (event: any) => {
    event.stopPropagation();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    // For products with variations, show the modal
    if (product.hasVariations && product.variations && product.variations.length > 0) {
      setShowVariationModal(true);
      return;
    }
    
    // For regular products, add directly
    addToCart(product, 1);
    setShowQuantityControl(true);
  };
  
  // Handle variation selection
  const handleVariationSelect = (variationId: string, size: string) => {
    // The modal will handle the actual adding to cart
    console.log('Selected variation:', variationId, size);
  };
  
  // Handle decrease quantity
  const handleDecreaseQuantity = (event: any) => {
    event.stopPropagation();
    
    const currentQuantity = getCartItemQuantity(product._id);
    
    if (currentQuantity <= 1) {
      removeFromCart(product._id);
      setShowQuantityControl(false);
    } else {
      updateQuantity(product._id, currentQuantity - 1);
    }
  };
  
  // Handle increase quantity
  const handleIncreaseQuantity = (event: any) => {
    event.stopPropagation();
    
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

  // Calculate discounted price
  const getDisplayPrice = (): number => {
    // For products with variations, show the lowest price
    if (product.hasVariations && product.variations && product.variations.length > 0) {
      // Find all valid prices from variations
      const validPrices = product.variations
        .filter(v => v && typeof v.price === 'number' || typeof v.price === 'string')
        .map(v => typeof v.price === 'string' ? parseFloat(v.price) : v.price)
        .filter(price => !isNaN(price) && price > 0);
      
      // If we have valid prices, return the lowest one
      if (validPrices.length > 0) {
        const lowestPrice = Math.min(...validPrices);
        return product.discount ? lowestPrice * (1 - product.discount/100) : lowestPrice;
      }
    }
    
    // For regular products, return the discounted price
    if (product.discount && product.price != null) {
      return product.price * (1 - product.discount/100);
    }
    
    return product.price || 0;
  };

  // Get original price, handling variations
  const getOriginalPrice = (): number | null => {
    // For products with variations, get the original price of the lowest priced variation
    if (product.hasVariations && product.variations && product.variations.length > 0) {
      // Find all valid prices from variations
      const validVariations = product.variations
        .filter(v => v && (typeof v.price === 'number' || typeof v.price === 'string'))
        .map(v => ({
          price: typeof v.price === 'string' ? parseFloat(v.price) : v.price,
          originalPrice: (v as ProductVariation).originalPrice
        }))
        .filter(v => !isNaN(v.price) && v.price > 0);
      
      if (validVariations.length > 0) {
        // Sort by price to find the lowest priced variation
        validVariations.sort((a, b) => a.price - b.price);
        const cheapestVariation = validVariations[0];
        
        // Return original price if available, otherwise calculate it from the discount
        return cheapestVariation.originalPrice || 
          (product.discount ? cheapestVariation.price * (1 + product.discount/100) : cheapestVariation.price);
      }
    }
    
    // For regular products
    return product.price || null;
  };

  return (
    <TouchableOpacity 
      style={styles.similarProductCard}
      activeOpacity={0.8}
      onPress={() => router.push(`/product/${product._id}`)}
    >
      {/* Product Image */}
      <View style={styles.similarProductImageContainer}>
        <CachedImage
          uri={(() => {
            // Check imageValue array first
            if (Array.isArray(product.imageValue) && product.imageValue[0] && typeof product.imageValue[0] === 'string') {
              return product.imageValue[0];
            }
            // Check image array next
            if (Array.isArray(product.image) && product.image[0]) {
              // Handle object with url property
              if (typeof product.image[0] === 'object' && product.image[0] !== null) {
                const imageObj = product.image[0] as { url?: string };
                if (imageObj.url) {
                  return getFullImageUrl(imageObj.url);
                }
              }
              // Handle string directly
              if (typeof product.image[0] === 'string') {
                return getFullImageUrl(product.image[0]);
              }
            }
            // Fallback to images array or placeholder
            return Array.isArray(product.images) && product.images[0] 
              ? (typeof product.images[0] === 'string' ? getFullImageUrl(product.images[0]) : getFullImageUrl(product.images[0].url))
              : 'https://via.placeholder.com/150';
          })()}
          style={styles.similarProductImage}
          resizeMode="contain"
          placeholder={
            <View style={[styles.similarProductImage, styles.placeholderContainer]}>
              <ActivityIndicator color="#0CAF50" />
            </View>
          }
        />
        
        {/* Discount Tag */}
        {product.discount && product.discount > 0 && (
          <View style={styles.similarProductDiscountTag}>
            <ThemedText style={styles.similarProductDiscountText}>{product.discount}% OFF</ThemedText>
          </View>
        )}
      </View>
      
      {/* Product Info */}
      <View style={styles.similarProductInfo}>
        <ThemedText 
          style={styles.similarProductName}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {product.name}
        </ThemedText>
        
        <ThemedText style={styles.similarProductQuantity}>
          {product.quantity || ''} {product.unit || ''}
        </ThemedText>
        
        <View style={styles.similarProductPriceRow}>
          <View style={styles.similarProductPriceContainer}>
            <ThemedText style={styles.similarProductPrice}>
              ₹{getDisplayPrice().toFixed(0)}
            </ThemedText>
            
            {((product.discount && product.discount > 0) || product.hasVariations) && getOriginalPrice() && (
              <ThemedText style={styles.similarProductOriginalPrice}>
                ₹{getOriginalPrice()?.toFixed(0)}
              </ThemedText>
            )}
          </View>
          
          {/* ADD Button or Quantity Controls */}
          {showQuantityControl ? (
            <View style={styles.similarProductQuantityControlsContainer}>
              <TouchableOpacity 
                style={styles.similarProductQuantityButtonMinus}
                onPress={handleDecreaseQuantity}
              >
                <MaterialIcons name="remove" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.similarProductQuantityDisplay}>
                <ThemedText style={styles.similarProductQuantityText}>
                  {getCartItemQuantity(product._id)}
                </ThemedText>
              </View>
              
              <TouchableOpacity 
                style={styles.similarProductQuantityButtonPlus}
                onPress={handleIncreaseQuantity}
              >
                <MaterialIcons name="add" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.similarProductAddButton}
              onPress={handleAddToCart}
            >
              <ThemedText style={styles.similarProductAddButtonText}>
                ADD
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Variation Selection Modal */}
      {product && (
        <ProductVariationModal
          visible={showVariationModal}
          product={product}
          onClose={() => setShowVariationModal(false)}
          onSelectVariation={handleVariationSelect}
        />
      )}
    </TouchableOpacity>
  );
};

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [showQuantityControl, setShowQuantityControl] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  // New states for handling variations
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [selectedSizeUnit, setSelectedSizeUnit] = useState<string | null>(null);
  const { user } = useAuth();
  const { addToCart, removeFromCart, cartItems, isInCart, getCartItemQuantity, updateQuantity } = useCart();

  // Check if product is in cart on load and when cart changes
  useEffect(() => {
    if (product) {
      setShowQuantityControl(isInCart(product._id));
    }
  }, [product, cartItems, isInCart]);
  
  // Set default variation when product loads
  useEffect(() => {
    if (product && product.hasVariations && product.variations && product.variations.length > 0) {
      // Find first in-stock variation or default to first variation
      const defaultVariation = product.variations.find((v: ProductVariation) => v.stock > 0) || product.variations[0] as ProductVariation;
      setSelectedVariation(defaultVariation);
    }
  }, [product]);

  // Handle unit selection
  const handleUnitSelect = (size: string) => {
    setSelectedSizeUnit(size);
    
    // Find the variation that matches this size
    if (product && product.variations) {
      const variation = product.variations.find((v: any) => v.size === size);
      if (variation) {
        setSelectedVariation(variation);
      }
    }
  };

  // Handle add to cart with variations support
  const handleAddToCart = () => {
    if (!product) return;
    
    // If product has variations, check if a size is already selected
    if (product.hasVariations && product.variations && product.variations.length > 0) {
      // If a variation is already selected (either via unit selector or default selection)
      if (selectedVariation) {
        // Create a product with the selected variation
        const productWithVariation = {
          ...product,
          price: selectedVariation.price,
          stock: selectedVariation.stock,
          selectedVariationId: selectedVariation._id,
          selectedSize: selectedSizeUnit || selectedVariation.size // Use selectedSizeUnit if available, otherwise use the variation's size
        };
        
        // Add to cart directly without showing the modal
        addToCart(productWithVariation, 1);
        setShowQuantityControl(true);
      } else {
        // If no variation is selected at all, show the modal
        setShowVariationModal(true);
      }
      return;
    }
    
    // Regular product without variations
    addToCart(product, 1);
    setShowQuantityControl(true);
  };
  
  // Handle variation selection
  const handleVariationSelect = (variationId: string, size: string) => {
    if (!product) return;
    
    const selectedVar = product.variations?.find((v: ProductVariation) => v._id === variationId) as ProductVariation;
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
      
      // We no longer close the modal here - it will stay open until user explicitly closes it
    }
  };

  // Handle decrease quantity
  const handleDecreaseQuantity = (event: any) => {
    if (!product) return;
    event.preventDefault();
    event.stopPropagation();
    
    const currentQuantity = getCartItemQuantity(product._id);
    console.log(`Decreasing quantity for ${product._id} from ${currentQuantity}`);
    
    if (currentQuantity <= 1) {
      // Remove from cart
      updateQuantity(product._id, 0);
      setShowQuantityControl(false);
    } else {
      // Directly update the quantity using updateQuantity
      updateQuantity(product._id, currentQuantity - 1);
    }
  };

  // Handle increase quantity
  const handleIncreaseQuantity = (event: any) => {
    if (!product) return;
    event.preventDefault();
    event.stopPropagation();
    
    const currentQuantity = getCartItemQuantity(product._id);
    console.log(`Increasing quantity for ${product._id} from ${currentQuantity}`);
    
    // Check stock limits before increasing
    let stockLimit = product.stock;
    if (product.hasVariations && selectedVariation) {
      stockLimit = selectedVariation.stock;
    }
    
    if (typeof stockLimit === 'number' && currentQuantity >= stockLimit) {
      Alert.alert("Stock Limit", `Cannot add more. Stock limit reached (${stockLimit} available)`);
      return;
    }
    
    // Directly update the quantity using updateQuantity
    updateQuantity(product._id, currentQuantity + 1);
  };
  
  // Fix share functionality to handle null price
  const handleShareProduct = async () => {
    if (!product) return;
    
    try {
      const priceDisplay = product.price !== null && product.price !== undefined 
        ? `₹${product.price.toFixed(0)}` 
        : 'best price';
        
      await Share.share({
        message: `Check out ${product.name} on our app! It's priced at ${priceDisplay}.`
      });
    } catch (error) {
      console.error('Error sharing product:', error);
    }
  };

  // Update the fetchSimilarProducts function for better debugging
  const fetchSimilarProducts = async (currentProduct: Product) => {
    if (!currentProduct) return;
    
    try {
      setLoadingSimilar(true);
      console.log('DEBUGGING: Fetching similar products for:', currentProduct.name, 'ID:', currentProduct._id);
      console.log('DEBUGGING: Current product category:', currentProduct.categoryId);
      
      const allProducts = await getProducts();
      console.log('DEBUGGING: Fetched total products:', allProducts.length);
      
      // Always include some products even if filtering doesn't work
      setSimilarProducts(allProducts.filter(p => p._id !== currentProduct._id).slice(0, 10));
      
      console.log('DEBUGGING: Set similar products as fallback');
    } catch (error) {
      console.error('Error fetching similar products:', error);
      // Set empty array to ensure rendering path is consistent
      setSimilarProducts([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Update useEffect to fetch similar products when the main product is loaded
  useEffect(() => {
    if (product) {
      fetchSimilarProducts(product);
    }
  }, [product]);

  // Add this function to fix vendor info if it's incomplete
  const ensureVendorInfo = async (product: Product) => {
    if (!product.vendor || (product.vendor && !product.vendor.name)) {
      // If vendor is just an ID string
      if (typeof product.vendor === 'string') {
        try {
          console.log('Fetching vendor info separately for ID:', product.vendor);
          const vendorInfo = await getVendorById(product.vendor);
          if (vendorInfo) {
            // Update the product with complete vendor info
            setProduct({
              ...product,
              vendor: vendorInfo
            });
          }
        } catch (error) {
          console.error('Failed to fetch vendor info:', error);
        }
      }
    }
  };
  
  // Modify the fetchProductData function to check for vendor info
  const fetchProductData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch the product details
      const productData = await getProductById(id as string);
      if (!productData) {
        throw new Error('Product not found');
      }
      setProduct(productData);
      
      // After setting the product, ensure vendor info is complete
      setProduct(productData);
      
      // Check if vendor info needs to be completed
      if (productData.vendor) {
        ensureVendorInfo(productData);
      }
    } catch (err) {
      console.error('Error fetching product data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load product data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    fetchProductData();
  }, [id]);

  // After loading the product
  useEffect(() => {
    if (product) {
      // Log product data to verify variations
      console.log('Product loaded:', product.name);
      console.log('Has variations:', product.hasVariations);
      if (product.hasVariations && product.variations) {
        console.log('Variations count:', product.variations.length);
      }
      
      // Set initial selected variation if product has variations
      if (product.hasVariations && product.variations && product.variations.length > 0) {
        let initialVariation = null;
        
        // First check if product has a preselected variation
        if (product.selectedVariationId) {
          initialVariation = product.variations.find((v: ProductVariation) => v._id === product.selectedVariationId);
        }
        
        // If no preselected variation, find first in-stock variation or default to first
        if (!initialVariation) {
          initialVariation = product.variations.find((v: ProductVariation) => v.stock > 0) || product.variations[0] as ProductVariation;
        }
        
        setSelectedVariation(initialVariation);
        console.log('Set initial variation:', initialVariation);
      }
    }
  }, [product]);

  const handleBack = () => {
    router.back();
  };

  // Helper function to render a placeholder for missing images
  const renderImagePlaceholder = (type: string = "missing") => {
    return (
      <View style={[styles.image, styles.productImagePlaceholder]}>
        <MaterialIcons 
          name={type === "error" ? "image-not-supported" : "image"} 
          size={48} 
          color="#DDD" 
        />
      </View>
    );
  };

  // Add helper function to handle image URLs
  const getProductImageUrl = (product: any): string | null => {
    if (!product) return null;
  
    // Try imageValue array first
    if (product.imageValue?.[0] && typeof product.imageValue[0] === 'string') {
      return product.imageValue[0];
    }
  
    // Try image array with different formats
    if (product.image?.[0]) {
      if (typeof product.image[0] === 'string') {
        return product.image[0];
      }
      if (typeof product.image[0] === 'object' && 'url' in product.image[0]) {
        return product.image[0].url;
      }
    }
  
    // Try images array as last resort
    if (product.images?.[0] && typeof product.images[0] === 'string') {
      return product.images[0];
    }
  
    return null;
  };

  // Helper function to render the product image
  const renderProductImage = () => {
    if (!product) return renderImagePlaceholder();

    const imageUrl = getProductImageUrl(product);

    return (
      <CachedImage
        uri={imageUrl}
        style={styles.productImage}
        resizeMode="contain"
        placeholder={renderImagePlaceholder()}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>
          {error || 'Unable to load product'}
        </ThemedText>
        <TouchableOpacity style={styles.goBackButton} onPress={handleBack}>
          <ThemedText style={styles.goBackText}>Go Back</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {/* Header with back, search and share */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <ThemedText style={styles.headerTitleText}>Product Details</ThemedText>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.headerButton}>
            <MaterialIcons name="search" size={24} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleShareProduct} style={styles.headerButton}>
            <MaterialIcons name="share" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {renderProductImage()}
        </View>
        
        {/* Main Content Container */}
        <View style={styles.mainContentContainer}>
          {/* Product Title */}
          <View style={styles.productTitleContainer}>
            <ThemedText style={styles.productTitle}>{product.name}</ThemedText>
          </View>
          
          {/* Select Unit/Size Section - Moved up */}
          {product?.hasVariations && product.variations && product.variations.length > 0 ? (
            <View style={styles.selectUnitContainer}>
              <ThemedText style={styles.sectionTitleNew}>Select Unit</ThemedText>
              <View style={styles.unitOptionsContainer}>
                {product.variations.map((variation: ProductVariation) => (
                  <TouchableOpacity
                    key={variation._id}
                    style={[
                      styles.unitOption,
                      selectedVariation?._id === variation._id && styles.selectedUnitOption,
                      variation.stock <= 0 && styles.outOfStockUnitOption
                    ]}
                    onPress={() => {
                      if (variation.stock > 0) {
                        setSelectedVariation(variation);
                        handleUnitSelect(variation.size);
                      }
                    }}
                    disabled={variation.stock <= 0}
                  >
                    <ThemedText style={[
                      styles.unitSize,
                      selectedVariation?._id === variation._id && styles.selectedUnitText,
                      variation.stock <= 0 && styles.outOfStockUnitText
                    ]}>
                      {variation.size}
                      {variation.stock <= 0 && " (Out of Stock)"}
                    </ThemedText>
                    <View style={styles.unitPriceRow}>
                      <ThemedText style={[
                        styles.unitPrice,
                        selectedVariation?._id === variation._id && styles.selectedUnitText,
                        variation.stock <= 0 && styles.outOfStockUnitText
                      ]}>
                        ₹{product.discount && product.discount > 0 
                          ? calculateDiscountedPrice(product, variation.price).toFixed(0)
                          : variation.price}
                      </ThemedText>
                      {product.discount && product.discount > 0 && (
                        <ThemedText style={styles.unitMrp}>
                          MRP ₹{variation.price}
                        </ThemedText>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.pricingContainer}>
              <View style={styles.priceRow}>
                <ThemedText style={styles.price}>
                  ₹{product?.discount && product?.price != null
                    ? calculateDiscountedPrice(product).toFixed(0)
                    : product?.price != null 
                      ? product.price.toFixed(0) 
                      : '0'}
                </ThemedText>
                
                {product?.discount && product.discount > 0 && product?.price != null && (
                  <ThemedText style={styles.originalPrice}>
                    MRP ₹{product.price.toFixed(0)}
                  </ThemedText>
                )}
              </View>
              
              <ThemedText style={styles.quantityText}>
                {product.quantity} {product.unit || ''}
              </ThemedText>
            </View>
          )}
          
          {/* Vendor Section - Moved below variations */}
          {product?.vendor && (
            <View style={styles.vendorContainer}>
              <View style={styles.vendorRow}>
                <CachedImage 
                  uri={typeof product.vendor === 'object' ? product.vendor.imageUrl || '' : ''}
                  style={styles.vendorLogo}
                  resizeMode="cover"
                  placeholder={
                    <View style={styles.vendorLogoPlaceholder}>
                      <MaterialIcons name="store" size={18} color="#666" />
                    </View>
                  }
                />
                <View style={styles.vendorInfo}>
                  <ThemedText style={styles.vendorNameNew}>
                    {typeof product.vendor === 'object' ? product.vendor.name || 'Unknown Vendor' : 'Vendor'}
                  </ThemedText>
                  <TouchableOpacity 
                    onPress={() => {
                      if (typeof product.vendor === 'object' && product.vendor?._id) {
                        console.log('Navigating to vendor from product:', product.vendor._id);
                        router.push({
                          pathname: '/vendor/[id]',
                          params: { id: product.vendor._id }
                        });
                      }
                    }}
                  >
                    <ThemedText style={styles.exploreProductsNew}>
                      Explore all products
                      <MaterialIcons name="chevron-right" size={14} color="#666" style={{marginLeft: 4}} />
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          
          {/* View Product Details Expandable Section */}
          {product.description && (
            <View>
              <TouchableOpacity 
                style={styles.viewDetailsContainer}
                onPress={() => setShowDescription(!showDescription)}
              >
                <ThemedText style={styles.viewDetailsTextNew}>View product details</ThemedText>
                <MaterialIcons 
                  name={showDescription ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color="#4CAF50" 
                />
              </TouchableOpacity>
              
              {showDescription && (
                <View style={styles.descriptionContainer}>
                  <ThemedText style={styles.descriptionTextNew}>{product.description}</ThemedText>
                </View>
              )}
            </View>
          )}
          
          {/* Similar Products Section */}
          {similarProducts && similarProducts.length > 0 && (
            <View style={styles.similarProductsSection}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitleNew}>Similar products</ThemedText>
              </View>
              
              {loadingSimilar ? (
                <View style={styles.loadingSimilarContainer}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                </View>
              ) : (
                <FlatList
                  data={similarProducts.slice(0, 5)}
                  renderItem={({ item }) => {
                    // Calculate the lowest price for variation products
                    const getLowestPrice = () => {
                      if (item.hasVariations && item.variations && item.variations.length > 0) {
                        const validPrices = item.variations
                          .filter(v => v && (typeof v.price === 'number' || typeof v.price === 'string'))
                          .map(v => typeof v.price === 'string' ? parseFloat(v.price) : v.price)
                          .filter(price => !isNaN(price) && price > 0);
                        
                        if (validPrices.length > 0) {
                          const lowestPrice = Math.min(...validPrices);
                          return item.discount ? lowestPrice * (1 - item.discount/100) : lowestPrice;
                        }
                      }
                      
                      return item.discount && item.price !== null 
                        ? calculateDiscountedPrice(item).toFixed(0) 
                        : item.price;
                    };
                    
                    // Calculate original price for display
                    const getOriginalPrice = () => {
                      if (item.hasVariations && item.variations && item.variations.length > 0) {
                        const validVariations = item.variations
                          .filter(v => v && (typeof v.price === 'number' || typeof v.price === 'string'))
                          .map(v => ({
                            price: typeof v.price === 'string' ? parseFloat(v.price) : v.price,
                            originalPrice: (v as ProductVariation).originalPrice
                          }))
                          .filter(v => !isNaN(v.price) && v.price > 0);
                        
                        if (validVariations.length > 0) {
                          validVariations.sort((a, b) => a.price - b.price);
                          const cheapestVar = validVariations[0];
                          return cheapestVar.originalPrice || 
                            (item.discount ? cheapestVar.price * (1 + item.discount/100) : cheapestVar.price);
                        }
                      }
                      
                      return item.price;
                    };
                    
                    // Check if product is in cart
                    const isItemInCart = isInCart(item._id);
                    
                    // Handle add to cart - launches variation modal for variation products
                    const handleAddSimilarToCart = (e: any) => {
                      e.stopPropagation();
                      
                      if (!user) {
                        router.push('/auth/login');
                        return;
                      }
                      
                      // For products with variations, show the modal
                      if (item.hasVariations && item.variations && item.variations.length > 0) {
                        // Navigate to product detail page for variation selection
                        router.push(`/product/${item._id}`);
                        return;
                      }
                      
                      // For regular products, add directly
                      addToCart(item, 1);
                    };
                    
                    return (
                      <TouchableOpacity 
                        style={styles.similarProductCard}
                        activeOpacity={0.8}
                        onPress={() => router.push(`/product/${item._id}`)}
                      >
                        {/* Product Image */}
                        <View style={styles.similarProductImageContainer}>
                          <CachedImage
                            uri={(() => {
                              // Check imageValue array first
                              if (Array.isArray(item.imageValue) && item.imageValue[0] && typeof item.imageValue[0] === 'string') {
                                return item.imageValue[0];
                              }
                              // Check image array next
                              if (Array.isArray(item.image) && item.image[0]) {
                                // Handle object with url property
                                if (typeof item.image[0] === 'object' && item.image[0] !== null) {
                                  const imageObj = item.image[0] as { url?: string };
                                  if (imageObj.url) {
                                    return getFullImageUrl(imageObj.url);
                                  }
                                }
                                // Handle string directly
                                if (typeof item.image[0] === 'string') {
                                  return getFullImageUrl(item.image[0]);
                                }
                              }
                              // Fallback to images array or placeholder
                              return Array.isArray(item.images) && item.images[0] 
                                ? (typeof item.images[0] === 'string' ? getFullImageUrl(item.images[0]) : getFullImageUrl(item.images[0].url))
                                : 'https://via.placeholder.com/150';
                            })()}
                            style={styles.similarProductImage}
                            resizeMode="contain"
                            placeholder={
                              <View style={[styles.similarProductImage, styles.placeholderContainer]}>
                                <ActivityIndicator color="#0CAF50" />
                              </View>
                            }
                          />
                          
                          {/* Discount Tag */}
                          {item.discount && item.discount > 0 && (
                            <View style={styles.similarProductDiscountTag}>
                              <ThemedText style={styles.similarProductDiscountText}>{item.discount}% OFF</ThemedText>
                            </View>
                          )}
                        </View>
                        
                        {/* Product Info */}
                        <View style={styles.similarProductInfo}>
                          <ThemedText 
                            style={styles.similarProductName}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {item.name}
                          </ThemedText>
                          
                          <ThemedText style={styles.similarProductQuantity}>
                            {item.quantity || ''} {item.unit || ''}
                          </ThemedText>
                          
                          <View style={styles.similarProductPriceRow}>
                            <View style={styles.similarProductPriceContainer}>
                              <ThemedText style={styles.similarProductPrice}>
                                ₹{getLowestPrice()}
                              </ThemedText>
                              
                              {((item.discount && item.discount > 0) || item.hasVariations) && (
                                <ThemedText style={styles.similarProductOriginalPrice}>
                                  ₹{getOriginalPrice()}
                                </ThemedText>
                              )}
                            </View>
                            
                            {/* ADD Button or Quantity Controls */}
                            {isItemInCart ? (
                              <TouchableOpacity 
                                style={styles.similarProductAddButton}
                                onPress={() => router.push(`/product/${item._id}`)}
                              >
                                <ThemedText style={styles.similarProductAddButtonText}>
                                  ADDED
                                </ThemedText>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity 
                                style={styles.similarProductAddButton}
                                onPress={handleAddSimilarToCart}
                              >
                                <ThemedText style={styles.similarProductAddButtonText}>
                                  {item.hasVariations ? "SELECT" : "ADD"}
                                </ThemedText>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  keyExtractor={(item) => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.similarProductsList}
                  ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Bottom Add to Cart Bar with Price */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceContainer}>
          <ThemedText style={styles.bottomPrice}>
            ₹{selectedVariation 
              ? (product?.discount && product?.discount > 0 
                 ? calculateDiscountedPrice(product, selectedVariation.price).toFixed(0)
                 : selectedVariation.price)
              : (product?.discount && product?.price != null
                ? calculateDiscountedPrice(product).toFixed(0)
                : product?.price != null 
                  ? product.price.toFixed(0) 
                  : '0')}
          </ThemedText>
          
          {(product?.discount && product?.discount > 0) && 
           (selectedVariation || product?.price != null) && (
            <ThemedText style={styles.bottomOriginalPrice}>
              MRP ₹{selectedVariation 
                ? selectedVariation.price
                : product.price.toFixed(0)}
            </ThemedText>
          )}
        </View>
        
        {showQuantityControl ? (
          <View style={styles.quantityControlContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={handleDecreaseQuantity}
            >
              <MaterialIcons name="remove" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.quantityDisplay}>
              <ThemedText style={styles.quantityDisplayText}>
                {getCartItemQuantity(product._id)}
              </ThemedText>
            </View>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={handleIncreaseQuantity}
            >
              <MaterialIcons name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addToCartButton}
            onPress={handleAddToCart}
            disabled={loading || (selectedVariation ? selectedVariation.stock <= 0 : (product?.stock || 0) <= 0)}
          >
            <ThemedText style={styles.addToCartButtonText}>
              Add to Cart
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Variation Selection Modal */}
      {product && (
        <ProductVariationModal
          visible={showVariationModal}
          product={product}
          onClose={() => setShowVariationModal(false)}
          onSelectVariation={handleVariationSelect}
        />
      )}
      
      {/* Cart Summary Bar */}
      <CartSummaryBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  goBackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Okra-Medium',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Okra-Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#F5F5F5',
  },
  
  // Main Layout
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  image: {
    width: '100%',
    height: 250,
  },
  productImagePlaceholder: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContentContainer: {
    padding: 16,
  },
  
  // Product Title
  productTitleContainer: {
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
    fontFamily: 'Okra-Bold',
    letterSpacing: -0.2,
  },
  
  // Vendor Section
  vendorContainer: {
    marginVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorLogo: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    marginRight: 12,
  },
  vendorLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorNameNew: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Okra-Bold',
    letterSpacing: -0.2,
  },
  exploreProductsNew: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
    fontFamily: 'Okra-Medium',
  },
  
  // Select Unit Section
  selectUnitContainer: {
    marginBottom: 16,
  },
  sectionTitleNew: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    fontFamily: 'Okra-Bold',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  unitOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  unitOption: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    minWidth: 100,
    width: 'auto',
    maxWidth: '48%',
  },
  selectedUnitOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  unitSize: {
    fontSize: 14,
    fontFamily: 'Okra-Medium',
    color: '#212121',
    marginBottom: 4,
  },
  selectedUnitText: {
    color: '#4CAF50',
  },
  unitPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitPrice: {
    fontSize: 14,
    fontFamily: 'Okra-Bold',
    color: '#212121',
    marginRight: 8,
  },
  unitMrp: {
    fontSize: 12,
    fontFamily: 'Okra-Regular',
    color: '#757575',
    textDecorationLine: 'line-through',
  },
  
  // Pricing Container
  pricingContainer: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontFamily: 'Okra-Bold',
    color: '#212121',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 16,
    fontFamily: 'Okra-Regular',
    color: '#757575',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  quantityText: {
    fontSize: 14,
    fontFamily: 'Okra-Regular',
    color: '#757575',
  },
  
  // View Product Details
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  viewDetailsTextNew: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    fontFamily: 'Okra-Medium',
  },
  descriptionContainer: {
    paddingVertical: 16,
  },
  descriptionTextNew: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    fontFamily: 'Okra-Regular',
  },
  
  // Similar Products Section
  similarProductsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  loadingSimilarContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  similarProductsList: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  
  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    fontFamily: 'Okra-Bold',
  },
  bottomOriginalPrice: {
    fontSize: 14,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginLeft: 4,
    fontFamily: 'Okra-Regular',
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Okra-Medium',
  },
  quantityControlContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    height: 36,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Okra-Medium',
  },
  
  // Similar Product Card Styles
  similarProductCard: {
    width: 150,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 0,
  },
  similarProductImageContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  similarProductImage: {
    width: '100%',
    height: '100%',
  },
  similarProductDiscountTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  similarProductDiscountText: {
    fontSize: 10,
    color: '#2196F3',
    fontFamily: 'Okra-Medium',
  },
  similarProductInfo: {
    padding: 10,
  },
  similarProductName: {
    fontSize: 13,
    fontFamily: 'Okra-Bold',
    color: '#212121',
    lineHeight: 18,
    marginBottom: 4,
    height: 36,
  },
  similarProductQuantity: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Okra-Regular',
    marginBottom: 4,
  },
  similarProductPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  similarProductPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  similarProductPrice: {
    fontSize: 14,
    fontFamily: 'Okra-Bold',
    color: '#212121',
    marginRight: 6,
  },
  similarProductOriginalPrice: {
    fontSize: 12,
    fontFamily: 'Okra-Regular',
    color: '#777777',
    textDecorationLine: 'line-through',
  },
  similarProductAddButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  similarProductAddButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Okra-Medium',
  },
  similarProductQuantityControlsContainer: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    height: 28,
    backgroundColor: '#2E7D32',
  },
  similarProductQuantityButtonMinus: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  similarProductQuantityButtonPlus: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  similarProductQuantityDisplay: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  similarProductQuantityText: {
    fontSize: 14,
    fontFamily: 'Okra-Regular',
    color: 'white',
  },
  placeholderContainer: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockUnitOption: {
    borderColor: '#FF0000',
    backgroundColor: '#FFE6E6',
    borderWidth: 1.5,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  outOfStockUnitText: {
    color: '#FF0000',
  },
});