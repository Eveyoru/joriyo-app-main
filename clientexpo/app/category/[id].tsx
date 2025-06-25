import React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, ActivityIndicator, Dimensions, StatusBar, FlatList, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { CartSummaryBar } from '@/components/CartSummaryBar';
import ProductCard from '@/components/ProductCard';

import { Product, getProductsByCategory, getProductsByCategoryAndSubcategory, calculateDiscountedPrice } from '@/services/product';
import { Category, getCategoryById } from '@/services/category';
import { SubCategory, getSubCategoriesByCategoryId } from '@/services/subcategory';
import { getFullImageUrl } from '@/utils/api';
import { useCart } from '@/context/CartContext';

const { width: screenWidth } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Constants.statusBarHeight || (Platform.OS === 'android' ? 24 : 44);

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { cartItems, addToCart, removeFromCart, isInCart, getCartItemQuantity, updateQuantity } = useCart();
  
  // Track which products have quantity controls (vs. ADD button)
  const [productsWithControls, setProductsWithControls] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the category details
        const categoryData = await getCategoryById(id as string);
        if (!categoryData) {
          throw new Error('Category not found');
        }
        setCategory(categoryData);
        
        // Fetch subcategories for this category
        const subcategoriesData = await getSubCategoriesByCategoryId(id as string);
        setSubcategories(subcategoriesData);
        
        // If there are subcategories, select the first one
        if (subcategoriesData && subcategoriesData.length > 0) {
          setSelectedSubcategory(subcategoriesData[0]._id);
          
          // Fetch products for the first subcategory
          const productsData = await getProductsByCategoryAndSubcategory(
            id as string, 
            subcategoriesData[0]._id
          );
          setProducts(productsData);
        } else {
          // If no subcategories, fetch products for the category
          const productsData = await getProductsByCategory(id as string);
          setProducts(productsData);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Initialize products with controls state based on cart items
  useEffect(() => {
    const newControlsState: Record<string, boolean> = {};
    cartItems.forEach(item => {
      newControlsState[item.product._id] = true;
    });
    
    setProductsWithControls(newControlsState);
  }, [cartItems]);
  
  const handleSubcategorySelect = async (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    try {
      setLoading(true);
      
      // Fetch products for the selected subcategory
      const productsData = await getProductsByCategoryAndSubcategory(
        id as string, 
        subcategoryId
      );
      
      setProducts(productsData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product._id}` as any);
  };
  
  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setProductsWithControls(prev => ({
      ...prev,
      [product._id]: true
    }));
  };

  const handleIncreaseQuantity = (product: Product, e?: any) => {
    e?.stopPropagation();
    
    const currentQuantity = getCartItemQuantity(product._id);
    console.log(`Increasing quantity for ${product._id} from ${currentQuantity}`);
    
    // Check stock limits before increasing
    let stockLimit = product.stock;
    if (product.hasVariations && product.variations && product.variations.length > 0) {
      const selectedVariation = product.variations.find(v => v._id === product.selectedVariationId);
      if (selectedVariation) {
        stockLimit = selectedVariation.stock;
      }
    }
    
    if (typeof stockLimit === 'number' && currentQuantity >= stockLimit) {
      Alert.alert("Stock Limit", `Cannot add more. Stock limit reached (${stockLimit} available)`);
      return;
    }
    
    // Directly update the quantity
    updateQuantity(product._id, currentQuantity + 1);
  };

  const handleDecreaseQuantity = (product: Product, e?: any) => {
    e?.stopPropagation();
    
    const currentQuantity = getCartItemQuantity(product._id);
    console.log(`Decreasing quantity for ${product._id} from ${currentQuantity}`);
    
    if (currentQuantity <= 1) {
      // Remove item when quantity is 1
      updateQuantity(product._id, 0);
      setProductsWithControls(prev => {
        const newControls = { ...prev };
        delete newControls[product._id];
        return newControls;
      });
    } else {
      // Directly update the quantity instead of remove and add
      updateQuantity(product._id, currentQuantity - 1);
    }
  };

  const handleSearch = () => {
    router.push('/search' as any);
  };

  // Render subcategory item
  const renderSubcategoryItem = (subcategory: SubCategory) => {
    const isActive = selectedSubcategory === subcategory._id;
    
    return (
      <TouchableOpacity
        style={[styles.subcategoryItem, isActive && styles.selectedSubcategory]}
        onPress={() => handleSubcategorySelect(subcategory._id)}
      >
        <View style={styles.subcategoryImageContainer}>
          {subcategory.image ? (
            <Image
              source={{ uri: getFullImageUrl(subcategory.image) }}
              style={styles.subcategoryImage}
              resizeMode="contain"
            />
          ) : (
            <MaterialIcons 
              name="category" 
              size={22} 
              color={isActive ? "#0CAF50" : "#666"} 
            />
          )}
        </View>
        <ThemedText 
          style={[styles.subcategoryName, isActive && styles.selectedSubcategoryText]}
          numberOfLines={2}
        >
          {subcategory.name}
        </ThemedText>
        {isActive && <View style={styles.greenSlider} />}
      </TouchableOpacity>
    );
  };

  // Render a single product card
  const renderProductCard = ({ item }: { item: Product }) => (
    <View style={styles.productCardWrapper}>
      <ProductCard product={item} />
    </View>
  );

  if (loading && !category) {
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
  
  if (!category) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>Category not found</ThemedText>
        <TouchableOpacity onPress={handleBack}>
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Header with title */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>
            {category?.name || 'Category'}
          </ThemedText>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search-outline" size={24} color="#212121" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main content */}
      <View style={styles.contentContainer}>
        {/* Subcategories list on the left */}
        <View style={styles.sidebar}>
          <FlatList
            data={subcategories || []}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => renderSubcategoryItem(item)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sidebarContent}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <ThemedText style={styles.emptyListText}>No subcategories</ThemedText>
              </View>
            }
          />
        </View>
        
        {/* Products grid on the right */}
        <View style={styles.productGrid}>
          {loading ? (
            <View style={styles.loadingProductsContainer}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <ThemedText style={styles.loadingProductsText}>Loading products...</ThemedText>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.noProductsContainer}>
              <MaterialIcons name="inventory" size={48} color="#DDD" />
              <ThemedText style={styles.noProductsText}>No products found in this category</ThemedText>
            </View>
          ) : (
            <FlatList
              data={products}
              renderItem={renderProductCard}
              keyExtractor={item => item._id}
              numColumns={2}
              contentContainerStyle={styles.productsContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <ThemedText style={styles.emptyListText}>No products found</ThemedText>
                </View>
              }
            />
          )}
        </View>
      </View>
      
      {/* Cart Summary Bar */}
      <CartSummaryBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: STATUSBAR_HEIGHT,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginTop: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  searchButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 79,
    backgroundColor: '#F8F8F8',
    borderRightWidth: 1,
    borderRightColor: '#EEEEEE',
  },
  sidebarContent: {
    paddingVertical: 8,
  },
  subcategoryItem: {
    alignItems: 'center',
    padding: 8,
    marginVertical: 4,
    position: 'relative',
  },
  selectedSubcategory: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 0,
  },
  greenSlider: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: '#0CAF50',
  },
  subcategoryImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    marginBottom: 4,
  },
  subcategoryImage: {
    width: 30,
    height: 30,
  },
  subcategoryName: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '400',
  },
  selectedSubcategoryText: {
    color: '#0CAF50',
    fontWeight: '500',
  },
  productGrid: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingProductsContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingProductsText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
  noProductsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noProductsText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  productsContainer: {
    padding: 8,
    paddingBottom: 100, // Extra space for the cart summary bar
  },
  productCardWrapper: {
    width: '50%',
    padding: 8,
    height: 'auto',
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButtonText: {
    color: '#0CAF50',
    fontSize: 16,
    fontWeight: '600',
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
