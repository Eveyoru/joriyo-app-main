import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, Dimensions, StatusBar, Platform, ScrollView, Alert, FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';
import { CartSummaryBar } from '@/components/CartSummaryBar';
import { Product, calculateDiscountedPrice } from '@/services/product';
import { FeaturedCategory, getFeaturedCategories } from '@/services/category';
import { getFullImageUrl } from '@/utils/api';
import Constants from 'expo-constants';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import ProductVariationModal from '@/components/ProductVariationModal';
import { CachedImage } from '@/components/CachedImage';

const { width: screenWidth } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Constants.statusBarHeight || (Platform.OS === 'android' ? 24 : 44);

export default function FeaturedCategoryScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [featuredCategory, setFeaturedCategory] = useState<FeaturedCategory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { cartItems, addToCart, removeFromCart, isInCart, getCartItemQuantity, updateQuantity } = useCart();
  
  // Add variation modal state
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }
    
    const fetchFeaturedCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all featured categories and find the one with matching ID
        const featuredCategories = await getFeaturedCategories();
        const category = featuredCategories.find(cat => cat._id === id);
        
        if (!category) {
          throw new Error('Featured category not found');
        }
        
        console.log(`Found featured category: ${category.name} with ${category.products?.length || 0} products`);
        setFeaturedCategory(category);
        
        if (category.products) {
          console.log('Setting products from featured category');
          // Process products to ensure variation products display correctly
          const processedProducts = category.products.map(product => {
            if (product.hasVariations && product.variations && product.variations.length > 0) {
              // Ensure variations are properly processed for display
              const validVariations = product.variations.filter((v: any) => 
                v && typeof v === 'object' && 
                (typeof v.price === 'number' || typeof v.price === 'string')
              );
              
              if (validVariations.length > 0) {
                // Get all prices as numbers
                const prices = validVariations.map((v: any) => {
                  const price: any = typeof v.price === 'string' ? parseFloat(v.price) : Number(v.price);
                  return isNaN(price) ? Infinity : price;
                }).filter((price: number) => price !== Infinity && price > 0);
                
                if (prices.length > 0) {
                  // IMPORTANT: Always set the price to the lowest price
                  // This ensures variation products never show ₹0
                  const lowestPrice = Math.min(...prices);
                  product.price = lowestPrice;
                  
                  // Additionally, store the original price for discount calculations
                  if (!product.originalPrice) {
                    product.originalPrice = lowestPrice;
                  }
                }
              }
            }
            return product;
          });
          
          setProducts(processedProducts);
        } else {
          console.log('No products in this featured category');
          setProducts([]);
        }
      } catch (err) {
        setError((err as Error).message);
        console.error('Error fetching featured category:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedCategory();
  }, [id]);

  const handleBack = () => {
    router.back();
  };
  
  const handleProductPress = (product: Product) => {
    router.push(`/product/${product._id}`);
  };
  
  // Handle add to cart with variation modal support
  const handleAddToCart = (product: Product) => {
    // For products with variations, show the variation modal
    if (product.hasVariations && product.variations && product.variations.length > 0) {
      setSelectedProduct(product);
      setShowVariationModal(true);
      return;
    }
    
    // For regular products, add directly to cart
    addToCart(product, 1);
  };

  // Handle variation selection
  const handleVariationSelect = (variationId: string, size: string) => {
    console.log('Variation selected:', { variationId, size });
    // The ProductVariationModal will handle adding to cart itself
  };

  // Render a single product card
  const renderProductCard = ({ item }: { item: Product }) => (
    <ProductCard 
      product={item} 
      onAddToCart={handleAddToCart}
    />
  );
  
  // Helper function to chunk array into groups of size n
  const chunkArray = <T extends any>(array: T[], size: number): T[][] => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0CAF50" />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
        <TouchableOpacity onPress={handleBack}>
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!featuredCategory) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>Featured category not found</ThemedText>
        <TouchableOpacity onPress={handleBack}>
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{flexDirection: 'row'}}>
          <TouchableOpacity style={[styles.backButton, {marginRight: 10}]}>
            <MaterialIcons name="search" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton}>
            <MaterialIcons name="share" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Cover Image and Category Info */}
        <View style={styles.coverImageContainer}>
          <CachedImage
            uri={featuredCategory.coverImage || featuredCategory.image}
            style={styles.coverImage}
            resizeMode="cover"
            placeholder={
              <View style={[styles.coverImage, styles.imagePlaceholder]}>
                <ActivityIndicator color="#0CAF50" />
              </View>
            }
          />
          <View style={styles.overlay} />
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>
              {featuredCategory.name}
            </ThemedText>
          </View>

          {products.length === 0 ? (
            <View style={styles.noProductsContainer}>
              <MaterialIcons name="shopping-bag" size={48} color="#DDD" />
              <ThemedText style={styles.noProductsText}>
                No products available in this category
              </ThemedText>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {/* 3-column grid layout */}
              {chunkArray(products, 3).map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.productRow}>
                  {row.map((product) => (
                    <View key={product._id} style={styles.productCardWrapper}>
                      <ProductCard product={product} onAddToCart={handleAddToCart} />
                    </View>
                  ))}
                  {/* Add empty views for proper spacing if row is not complete */}
                  {row.length < 3 && Array(3 - row.length).fill(0).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.emptyCardSpace} />
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cart Summary Bar */}
      <CartSummaryBar />
      
      {/* Add the ProductVariationModal */}
      {selectedProduct && (
        <ProductVariationModal 
          product={selectedProduct}
          visible={showVariationModal}
          onClose={() => setShowVariationModal(false)}
          onSelectVariation={handleVariationSelect}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: STATUSBAR_HEIGHT,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImageContainer: {
    width: screenWidth,
    height: 180,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1,
  },
  productsSection: {
    paddingTop: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 500,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  productsList: {
    paddingHorizontal: 0,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCardWrapper: {
    width: (screenWidth - 32) / 3,
    height: 'auto',
  },
  emptyCardSpace: {
    width: (screenWidth - 32) / 3,
  },
  productsGrid: {
    paddingBottom: 16,
  },
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
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  noProductsContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noProductsText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 12,
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});