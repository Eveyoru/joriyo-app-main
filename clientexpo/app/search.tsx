import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Image, Platform, StatusBar, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Product as BaseProduct, getProducts, calculateDiscountedPrice } from '@/services/product';

// Extend the Product interface to include originalPrice
interface Product extends BaseProduct {
  originalPrice?: number;
}
import { getFullImageUrl } from '@/utils/api';
import { AddToCartButton } from '@/components/AddToCartButton';
import ProductVariationModal from '@/components/ProductVariationModal';
import Constants from 'expo-constants';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const STATUSBAR_HEIGHT = Constants.statusBarHeight || (Platform.OS === 'android' ? 24 : 44);

export default function SearchScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Popular search suggestions
  const popularSearches = [
    'Fresh Fruits',
    'Vegetables',
    'Dairy Products',
    'Snacks',
    'Beverages',
    'Personal Care',
    'Household Items',
    'Baby Care'
  ];

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Handle initial query if provided
  useEffect(() => {
    if (query) {
      setSearchText(query);
      filterProducts(query);
      setShowResults(true);
    }
  }, [query, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await getProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = (text: string) => {
    const searchTerm = text.toLowerCase().trim();
    if (!searchTerm) {
      setFilteredProducts([]);
      return;
    }

    const filtered = products.filter(product => {
      // Only search in name and description since category might be undefined
      const name = (product.name || '').toLowerCase();
      const description = (product.description || '').toLowerCase();
      
      return name.includes(searchTerm) || description.includes(searchTerm);
    });
    
    setFilteredProducts(filtered);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setShowResults(false);
      setFilteredProducts([]);
    } else {
      setShowResults(true);
      filterProducts(text);
    }
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      setShowResults(true);
      filterProducts(searchText);
      // Add to recent searches
      setRecentSearches(prev => {
        const newSearches = [searchText.trim(), ...prev.filter(s => s !== searchText.trim())];
        return newSearches.slice(0, 10);
      });
    }
  };

  const handleSearchPress = (text: string) => {
    setSearchText(text);
    setShowResults(true);
    filterProducts(text);
    // Add to recent searches
    setRecentSearches(prev => {
      const newSearches = [text, ...prev.filter(s => s !== text)];
      return newSearches.slice(0, 10);
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const renderSearchSuggestions = () => {
    if (showResults) return null;

    return (
      <View style={styles.suggestionsContainer}>
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Recent Searches</ThemedText>
              <TouchableOpacity onPress={clearRecentSearches}>
                <ThemedText style={styles.clearText}>Clear</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.chipContainer}>
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.chip}
                  onPress={() => handleSearchPress(search)}
                >
                  <MaterialIcons name="history" size={16} color="#666666" />
                  <ThemedText style={styles.chipText}>{search}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Popular Searches */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Popular Searches</ThemedText>
          <View style={styles.chipContainer}>
            {popularSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.chip}
                onPress={() => handleSearchPress(search)}
              >
                <MaterialIcons name="trending-up" size={16} color="#666666" />
                <ThemedText style={styles.chipText}>{search}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Move hooks to the component level
  const { addToCart, removeFromCart, cartItems, isInCart, getCartItemQuantity, updateQuantity } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  // Create a map to track which products have quantity controls
  const [productQuantityControls, setProductQuantityControls] = useState<Record<string, boolean>>({});
  
  // State for product variation modal
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Update quantity controls when cart changes
  useEffect(() => {
    const updatedControls: Record<string, boolean> = {};
    filteredProducts.forEach(product => {
      updatedControls[product._id] = isInCart(product._id);
    });
    setProductQuantityControls(updatedControls);
  }, [cartItems, filteredProducts, isInCart]);
  
  const renderProductItem = ({ item }: { item: Product }) => {
    const showQuantityControl = productQuantityControls[item._id] || false;

    // Get image URL for product
    const getImageUrl = (): string => {
      // First try image array
      if (item.image) {
        if (Array.isArray(item.image) && item.image.length > 0) {
          const firstImage = item.image[0];
          if (typeof firstImage === 'string') {
            return firstImage;
          } else if (typeof firstImage === 'object' && firstImage?.url) {
            return firstImage.url;
          }
        } else if (typeof item.image === 'string') {
          return item.image;
        }
      }
      
      // Then try imageValue array
      if (item.imageValue && Array.isArray(item.imageValue) && item.imageValue.length > 0) {
        return item.imageValue[0];
      }
      
      // Then try images array
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        const firstImage = item.images[0];
        if (typeof firstImage === 'string') {
          return firstImage;
        } else if (typeof firstImage === 'object' && firstImage?.url) {
          return firstImage.url;
        }
      }
      
      // Default placeholder image
      return 'https://via.placeholder.com/150';
    };

    // Handle add to cart
    const handleAddToCart = () => {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      
      if (item.hasVariations && item.variations && item.variations.length > 0) {
        // Show variation modal instead of navigating
        setSelectedProduct(item);
        setShowVariationModal(true);
        return;
      }
      
      try {
        addToCart(item, 1);
        // Update the quantity controls map
        setProductQuantityControls(prev => ({
          ...prev,
          [item._id]: true
        }));
      } catch (error) {
        console.error('Error adding to cart:', error);
        Alert.alert('Error', 'Failed to add product to cart');
      }
    };

    // Handle decrease quantity
    const handleDecreaseQuantity = () => {
      const currentQuantity = getCartItemQuantity(item._id);
      
      if (currentQuantity <= 1) {
        removeFromCart(item._id);
        // Update the quantity controls map
        setProductQuantityControls(prev => ({
          ...prev,
          [item._id]: false
        }));
      } else {
        updateQuantity(item._id, currentQuantity - 1);
      }
    };

    // Handle increase quantity
    const handleIncreaseQuantity = () => {
      const currentQuantity = getCartItemQuantity(item._id);
      
      // Check stock limits
      let stockLimit = item.stock;
      if (item.hasVariations && item.variations && item.variations.length > 0) {
        stockLimit = item.variations[0].stock;
      }
      
      if (typeof stockLimit === 'number' && currentQuantity >= stockLimit) {
        Alert.alert("Stock Limit", `Cannot add more. Stock limit reached (${stockLimit} available)`);
        return;
      }
      
      updateQuantity(item._id, currentQuantity + 1);
    };

    // Get discounted price
    const getDisplayPrice = (): number => {
      // For products with variations, show the lowest price
      if (item.hasVariations && item.variations && item.variations.length > 0) {
        // Get all variations (we want to show the lowest price even if out of stock)
        const validVariations = item.variations.filter(v => 
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
            
            // Apply discount if applicable
            if (lowestPrice > 0) {
              return item.discount && item.discount > 0 
                ? lowestPrice * (1 - item.discount/100) 
                : lowestPrice;
            }
          }
        }
      }
      
      // For regular products, use the standard discount calculation
      return calculateDiscountedPrice(item);
    };
    
    // Get original price for display
    const getOriginalPrice = (): number | null => {
      if (item.hasVariations && item.variations && item.variations.length > 0) {
        // Get all variations (we want to show the lowest price even if out of stock)
        const validVariations = item.variations.filter(v => 
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
      
      return item.price;
    };
    
    const displayPrice = getDisplayPrice();
    const originalPrice = getOriginalPrice();
    const discountPercentage = item.discount && item.discount > 0 ? item.discount : 
      (originalPrice && displayPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0);
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => router.push(`/product/${item._id}`)}
        activeOpacity={0.8}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {getImageUrl() ? (
            <Image
              source={{ uri: getFullImageUrl(getImageUrl()) }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="image" size={24} color="#CCCCCC" />
            </View>
          )}
          
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
                  {getCartItemQuantity(item._id)}
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
        
        {/* Product Details */}
        <View style={styles.detailsContainer}>
          {/* Units/Quantity */}
          {item.quantity && (
            <ThemedText style={styles.unitText}>
              {item.quantity} {item.unit || ''}
            </ThemedText>
          )}
          
          {/* Product Title */}
          <ThemedText 
            numberOfLines={2} 
            style={styles.title}
          >
            {item.name}
          </ThemedText>
          
          {/* Discount Percentage */}
          {discountPercentage > 0 && (
            <ThemedText style={styles.discountText}>
              {discountPercentage}% OFF
            </ThemedText>
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
    );
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={22} color="#333333" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#666666"
            value={searchText}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoFocus
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchText('');
                setShowResults(false);
                setFilteredProducts([]);
              }}
            >
              <MaterialIcons name="close" size={22} color="#333333" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Suggestions or Results */}
      {!showResults ? (
        renderSearchSuggestions()
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1565C0" />
        </View>
      ) : (
        <>
          {searchText.trim() && (
            <ThemedText style={styles.resultsCount}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} for "{searchText}"
            </ThemedText>
          )}
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            style={styles.productsList}
            contentContainerStyle={{ paddingBottom: 80 }}
            numColumns={3}
            columnWrapperStyle={styles.productRow}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              searchText.trim() ? (
                <View style={styles.noResultsContainer}>
                  <MaterialIcons name="search-off" size={48} color="#666666" />
                  <ThemedText style={styles.noResultsText}>No products found</ThemedText>
                  <ThemedText style={styles.noResultsSubtext}>Try a different search term</ThemedText>
                </View>
              ) : null
            }
          />
        </>
      )}
      
      {/* Product Variation Modal */}
      {selectedProduct && (
        <ProductVariationModal
          product={selectedProduct}
          visible={showVariationModal}
          onClose={() => setShowVariationModal(false)}
          onSelectVariation={(variationId, size) => {
            // Find the selected variation
            const selectedVar = selectedProduct.variations?.find(v => v._id === variationId);
            
            if (selectedVar) {
              // Create a product with the selected variation
              const productWithVariation = {
                ...selectedProduct,
                price: selectedVar.price,
                stock: selectedVar.stock,
                selectedVariationId: variationId,
                selectedSize: size
              };
              
              // Add to cart
              addToCart(productWithVariation, 1);
              setProductQuantityControls(prev => ({
                ...prev,
                [selectedProduct._id]: true
              }));
            }
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: STATUSBAR_HEIGHT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    marginRight: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666666',
    padding: 16,
  },
  productsList: {
    padding: 8,
    paddingHorizontal: 12,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  productCard: {
    width: '31%',  // Three columns with small gap
    backgroundColor: 'white',
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 12,
    marginHorizontal: '1%',
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
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  suggestionsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  clearText: {
    fontSize: 14,
    color: '#1565C0',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
  },
  chipText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 4,
  },
}); 