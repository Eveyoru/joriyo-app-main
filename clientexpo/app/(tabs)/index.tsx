import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
  RefreshControl,
  Alert
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler,
  withTiming,
  Easing,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';
// import { CategoryCard } from '@/components/CategoryCard';
import { getCategories, Category, getFeaturedCategories, FeaturedCategory } from '@/services/category';
import { Product, getProducts, getFeaturedProducts, calculateDiscountedPrice } from '@/services/product';
import { getBaseUrl } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { CartSummaryBar } from '@/components/CartSummaryBar';
import { useCart } from '@/context/CartContext';
import { AddToCartButton } from '@/components/AddToCartButton';
import { Ionicons } from '@expo/vector-icons';
import { Banner, getBanners } from '@/services/banner';
import Carousel from 'react-native-reanimated-carousel';
import { getProductsByCategory } from '@/services/product';
import { getHomeCategories } from '@/services/category';
import { SummerBanner } from '../../components/SummerBanner';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VendorGrid from '@/components/VendorGrid';
import ProductCard from '@/components/ProductCard';
import SeeAllProductsBar from '@/components/SeeAllProductsBar';
import { Vendor, getActiveVendors } from '@/services/vendor';
import { CachedImage } from '@/components/CachedImage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define a type for valid MaterialIcons names
type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

// Define a mapping of category names to icon names from MaterialIcons
const CATEGORY_ICON_MAP: Record<string, MaterialIconName> = {
  'Fruits & Vegetables': 'eco',
  'Grocery & Staples': 'inventory-2',
  'Meat': 'restaurant',
  'Fish': 'set-meal',
  'Eggs': 'egg-alt',
  'Bakery': 'cake',
  'Dairy': 'breakfast-dining',
  // Add more categories and their corresponding outline icons as needed
};

// Enhanced getCategoryIcon function that handles both exact matches and pattern matching
function getCategoryIcon(categoryName: string): MaterialIconName {
  // First try direct match from the map
  if (CATEGORY_ICON_MAP[categoryName]) {
    return CATEGORY_ICON_MAP[categoryName];
  }
  
  // If no direct match, try pattern matching
  const name_lower = categoryName.toLowerCase();
  if (name_lower.includes('fruit') || name_lower.includes('vegetable')) return 'eco';
  if (name_lower.includes('meat') || name_lower.includes('chicken')) return 'restaurant';
  if (name_lower.includes('dairy') || name_lower.includes('milk')) return 'local-drink';
  if (name_lower.includes('bread') || name_lower.includes('bakery')) return 'breakfast-dining';
  if (name_lower.includes('snack')) return 'fastfood';
  if (name_lower.includes('clean')) return 'cleaning-services';
  if (name_lower.includes('beauty') || name_lower.includes('care')) return 'spa';
  if (name_lower.includes('baby')) return 'child-care';
  if (name_lower.includes('breakfast')) return 'breakfast-dining';
  if (name_lower.includes('rice') || name_lower.includes('dal')) return 'dinner-dining';
  
  // Default fallback
  return 'shopping-cart';
}

// Add a constant for status bar height at the top of the file
const STATUSBAR_HEIGHT = StatusBar.currentHeight || 0;

// Add a constant for cart storage key
const CART_STORAGE_KEY = '@joriyo_cart';

function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Prayagraj, Uttar Pradesh, India');
  const [deliveryTime, setDeliveryTime] = useState('19 minutes');
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartVisible, setCartVisible] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [productsWithControls, setProductsWithControls] = useState<Record<string, boolean>>({});
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
  const [loadingFeaturedCategories, setLoadingFeaturedCategories] = useState(true);
  const [featuredThisWeek, setFeaturedThisWeek] = useState<FeaturedCategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  const scrollY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentScrollY = event.contentOffset.y;
      scrollY.value = currentScrollY;
      lastScrollY.value = currentScrollY;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    // For the header content, we need to make sure it doesn't slide up behind status bar
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -80], // Increased sliding distance to bring search bar closer to top
      Extrapolate.CLAMP
    );

    // Background color transition - trigger earlier for smoother effect
    const backgroundColor = interpolate(
      scrollY.value,
      [0, 40],
      [0, 1],
      Extrapolate.CLAMP
    );

    // Calculate opacity for the header text
    const headerTextOpacity = interpolate(
      scrollY.value,
      [0, 40],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      backgroundColor: `rgba(21, 101, 192, ${backgroundColor})`,
      paddingTop: STATUSBAR_HEIGHT,
      opacity: 1,
      headerTextOpacity,
    };
  });

  // Add a style for the deliveryInfo container to handle its own opacity
  const deliveryInfoAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 40],
      [1, 0],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
    };
  });

  // Add a status bar animation
  const statusBarBackgroundStyle = useAnimatedStyle(() => {
    // Use the same threshold as the header background color
    const backgroundColor = interpolate(
      scrollY.value,
      [0, 40],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: StatusBar.currentHeight || 0,
      zIndex: 101, // Higher than header
      backgroundColor: `rgba(21, 101, 192, ${backgroundColor})`,
    };
  });

  // Add placeholder text animation
  const placeholderTexts = [
    "Search 'scented candle'",
    "Search 'fresh fruits'",
    "Search 'dairy products'",
    "Search 'snacks'",
    "Search 'beverages'"
  ];
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);

  // Animate placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 3000); // Change text every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // State for storing category products
  const [categoryProductsMap, setCategoryProductsMap] = useState<Record<string, Product[]>>({});
  const [loadingCategoryProducts, setLoadingCategoryProducts] = useState<Record<string, boolean>>({});

  // Function to fetch products for a specific category
  const fetchCategoryProducts = async (categoryId: string) => {
    try {
      console.log(`Fetching products for category ID: ${categoryId}`);
      setLoadingCategoryProducts(prev => ({ ...prev, [categoryId]: true }));
      
      const products = await getProductsByCategory(categoryId);
      console.log(`Received ${products.length} products for category ${categoryId}`);
      
      setCategoryProductsMap(prev => ({
        ...prev,
        [categoryId]: products.slice(0, 10) // Show up to 10 products per category
      }));
    } catch (error) {
      console.error(`Error fetching products for category ${categoryId}:`, error);
    } finally {
      setLoadingCategoryProducts(prev => ({ ...prev, [categoryId]: false }));
    }
  };
  
  // Fetch products for each category once categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !loading) {
      // Fetch products for each category (up to first 5 categories)
      categories.slice(0, 5).forEach(category => {
        fetchCategoryProducts(category._id);
      });
    }
  }, [categories, loading]);

  useEffect(() => {
    // Fetch all data on component mount
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingProducts(true);
      setError(null);
      
      // Fetch categories
      const categoriesData = await getCategories();
      if (categoriesData && categoriesData.length > 0) {
        console.log('Fetched categories:', categoriesData.length);
        setCategories(categoriesData);
        
        // Fetch featured categories - for now, we'll use the first 3-4 categories as featured
        const featured = categoriesData.filter(cat => cat.isActive).slice(0, 4);
        setFeaturedCategories(featured);
        setLoadingFeaturedCategories(false);
        
        // Fetch products for each featured category (first 5)
        featured.slice(0, 5).forEach(category => {
          fetchCategoryProducts(category._id);
        });
      }
      
      // Fetch banners
      const bannersData = await getBanners();
      if (bannersData && bannersData.length > 0) {
        console.log('Fetched banners:', bannersData.length);
        setBanners(bannersData);
      }
      
      // Fetch featured products
      const productsData = await getFeaturedProducts();
      if (productsData && productsData.length > 0) {
        console.log('Fetched featured products:', productsData.length);
        setProducts(productsData);
      }
      
      // Fetch featured this week categories
      const featuredWeekData = await getFeaturedCategories();
      if (featuredWeekData && featuredWeekData.length > 0) {
        console.log('Fetched featured this week categories:', featuredWeekData.length);
        setFeaturedThisWeek(featuredWeekData);
      }
      
      // Initialize products with controls state
      const initialProductControls: Record<string, boolean> = {};
      productsData.forEach(p => {
        initialProductControls[p._id] = false;
      });
      setProductsWithControls(initialProductControls);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load app data');
    } finally {
      setLoading(false);
      setLoadingProducts(false);
    }
  };

  // Add onRefresh function to handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, []);

  const handleLoginPress = () => {
    if (isAuthenticated) {
      if (user?.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/user/dashboard');
      }
    } else {
      router.push('/auth/login');
    }
  };

  // Get cartItems directly from the context
  const { 
    addToCart, 
    removeFromCart,
    cartItems,
    totalItems: cartItemCount, 
    totalAmount: cartTotal,
    isInCart,
    getCartItemQuantity,
    updateQuantity
  } = useCart();
  
  // Show cart button when items are in cart
  useEffect(() => {
    setCartVisible(cartItemCount > 0);
    
    // Update productsWithControls based on cart items
    const newControlsState: Record<string, boolean> = {};
    cartItems.forEach(item => {
      newControlsState[item.product._id] = true;
    });
    
    setProductsWithControls(newControlsState);
  }, [cartItems]);

  // Update the handleAddToCart function to toggle quantity controls
  const handleAddToCart = (product: Product) => {
    try {
      addToCart(product, 1);
      setProductsWithControls(prev => ({
        ...prev,
        [product._id]: true
      }));
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };
  
  // Update the handleDecreaseQuantity and handleIncreaseQuantity functions to properly stop event propagation
  const handleDecreaseQuantity = (product: Product, event: any) => {
    // Make sure event doesn't bubble up to the product card
    event.preventDefault();
    event.stopPropagation();
    
    const currentQuantity = getCartItemQuantity(product._id);
    console.log(`Decreasing quantity for ${product._id} from ${currentQuantity}`);
    
    if (currentQuantity <= 1) {
      // Remove item when quantity is 1
      updateQuantity(product._id, 0);
      setProductsWithControls(prev => {
        const newState = { ...prev };
        delete newState[product._id];
        return newState;
      });
    } else {
      // Directly update the quantity instead of remove and add
      updateQuantity(product._id, currentQuantity - 1);
    }
  };
  
  const handleIncreaseQuantity = (product: Product, event: any) => {
    // Make sure event doesn't bubble up to the product card
    event.preventDefault();
    event.stopPropagation();
    
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

  // Add function to go to the cart page
  const handleViewCart = () => {
    router.push('/cart');
  };

  // Search functionality
  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const handleSearchSubmit = () => {
    if (searchText.trim().length > 0) {
      // Navigate to search results page with the search query
      router.push({
        pathname: '/search',
        params: { query: searchText.trim() }
      });
      setSearchText('');
    }
  };

  const handleAllCategoriesPress = () => {
    setSelectedCategory(null);
    console.log('All categories selected');
    // Reset any filters or fetch all products
    fetchData();
  };

  const handleCategoryPress = (category: Category) => {
    setSelectedCategory(category._id);
    console.log(`Category selected: ${category.name}`);
    // Navigate to category detail page
    router.push(`/category/${category._id}`);
  };

  const handleProductPress = (product: Product) => {
    // Navigate to product detail page using the proper type format
    router.push(`/product/${product._id}`);
  };

  const handleLocationPress = () => {
    console.log('Location pressed');
    // Implement location selection
  };

  const handleSeeAllCategories = () => {
    console.log('See all categories pressed');
    // Navigate to the dedicated category tab instead of explore
    // This should work better without gesture handler errors
    router.push('/(tabs)/category');
  };

  const handleSeeAllProducts = () => {
    console.log('See all products pressed');
    // Implement see all products functionality
  };

  // Helper function to get full image URL with proper error handling
  const getFullImageUrl = (imageUrl: string | string[] | undefined): string => {
    if (!imageUrl) return '';
    
    try {
      const url = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
      if (typeof url === 'object' && url !== null && 'url' in url && typeof (url as { url: string }).url === 'string') {
        return (url as { url: string }).url;
      }
      if (typeof url === 'string') {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        return `${getBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
      }
      return '';
    } catch (error) {
      console.error('Error processing image URL:', error);
      return '';
    }
  };

  // Helper function to safely render product images
  const renderProductImage = (product: any) => {
    try {
      // Check if product has images or image fields
      if (!product) {
        return renderImagePlaceholder();
      }
      
      // First try to use the images array if it exists
      if (product.images) {
        const fullImageUrl = getFullImageUrl(product.images);
        if (fullImageUrl) {
          return renderImage(fullImageUrl);
        }
      }
      
      // If images array doesn't exist or is empty, try the image field
      if (product.image) {
        const fullImageUrl = getFullImageUrl(product.image);
        if (fullImageUrl) {
          return renderImage(fullImageUrl);
        }
      }
      
      // No valid image found
      return renderImagePlaceholder();
    } catch (error) {
      console.error('Error rendering product image:', error);
      return renderImagePlaceholder("error");
    }
  };

  // Helper function to render an image with the given URL
  const renderImage = (imageUrl: string) => {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.productImage}
        resizeMode="cover"
        onError={(e) => console.error('Image loading error:', e.nativeEvent.error)}
      />
    );
  };

  // Helper function to render a placeholder for missing images
  const renderImagePlaceholder = (type: string = "missing") => {
    return (
      <View style={[styles.productImage, styles.productImagePlaceholder]}>
        <MaterialIcons 
          name={type === "error" ? "image-not-supported" : "image"} 
          size={24} 
          color="#ccc" 
        />
      </View>
    );
  };

  // Function to render category image
  const renderCategoryImage = (category: Category) => {
    return (
      <Image
        source={{ uri: getFullImageUrl(category.image) }}
        style={styles.categoryImageLarge}
        resizeMode="contain"
      />
    );
  };

  // Add a new helper function for rendering images with proper error handling
  const renderCachedImage = (imageUrl: string, style: any, resizeMode: 'cover' | 'contain' = 'cover') => {
    return (
      <CachedImage
        uri={imageUrl}
        style={style}
        resizeMode={resizeMode}
      />
    );
  };

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
  }, []);

  // Render a section of products by category
  const renderCategorySection = ({ category, products }: { category: Category, products: Product[] }) => {
    console.log(`Rendering category section for ${category.name} with ${products.length} products`);
    
    if (!products || products.length === 0) {
      console.log(`No products for category ${category.name}`);
      return null;
    }
    
    // Get product images for SeeAllProductsBar
    const productImages = products.slice(0, 3).map(product => {
      // Try to get a valid image URL
      if (product.image) {
        if (Array.isArray(product.image) && product.image.length > 0) {
          const firstImage = product.image[0];
          if (typeof firstImage === 'string') {
            return getFullImageUrl(firstImage);
          } else if (typeof firstImage === 'object' && firstImage?.url) {
            return getFullImageUrl(firstImage.url);
          }
        } else if (typeof product.image === 'string') {
          return getFullImageUrl(product.image);
        }
      }
      
      // Try other image properties if available
      if (product.imageValue && Array.isArray(product.imageValue) && product.imageValue.length > 0) {
        return getFullImageUrl(product.imageValue[0]);
      }
      
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];
        if (typeof firstImage === 'string') {
          return getFullImageUrl(firstImage);
        } else if (typeof firstImage === 'object' && firstImage?.url) {
          return getFullImageUrl(firstImage.url);
        }
      }
      
      return '';
    }).filter(url => url !== '');
    
    return (
      <View style={styles.sectionContainer} key={category._id}>
        {/* Section Header with Category Title and See All Button */}
        <View style={styles.sectionHeader}>
          <View style={styles.categoryTitleContainer}>
            <ThemedText style={styles.sectionTitleNew}>{category.name}</ThemedText>
          </View>
          <TouchableOpacity 
            onPress={() => handleCategoryPress(category)}
            style={styles.seeAllButton}
          >
            <ThemedText style={styles.seeAllButtonText}>See All Products</ThemedText>
            <MaterialIcons name="chevron-right" size={18} color="#0a7ea4" />
          </TouchableOpacity>
        </View>
        
        {/* Products Horizontal List */}
        <FlatList
          data={products}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.productsContainer}
          renderItem={({ item: product }) => (
            <View style={styles.productCardHorizontal}>
              <ProductCard product={product} />
            </View>
          )}
        />
        
        {/* See All Products Bar */}
        <SeeAllProductsBar 
          onPress={() => handleCategoryPress(category)} 
          categoryImages={productImages}
          title={`See all ${category.name} products`}
        />
      </View>
    );
  };

  // Render quick action buttons
  const renderQuickActions = () => {
    return (
      <View style={styles.quickActionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={styles.quickActionIconContainer}>
              <MaterialIcons name="local-offer" size={20} color="#0CAF50" />
            </View>
            <ThemedText style={styles.quickActionText}>Offers</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={styles.quickActionIconContainer}>
              <MaterialIcons name="timelapse" size={20} color="#0CAF50" />
            </View>
            <ThemedText style={styles.quickActionText}>Fast Delivery</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={styles.quickActionIconContainer}>
              <MaterialIcons name="grade" size={20} color="#0CAF50" />
            </View>
            <ThemedText style={styles.quickActionText}>Top Picks</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <View style={styles.quickActionIconContainer}>
              <MaterialIcons name="shopping-basket" size={20} color="#0CAF50" />
            </View>
            <ThemedText style={styles.quickActionText}>Daily Essentials</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // Render search results
  const renderSearchResults = () => {
    if (!showSearchResults) return null;

    return (
      <View style={styles.searchResultsContainer}>
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const imageUrl = Array.isArray(item.image) ? item.image[0] : item.image;
            return (
              <TouchableOpacity 
                style={styles.searchResultItem}
                onPress={() => {
                  handleProductPress(item);
                  setShowSearchResults(false);
                  setSearchText('');
                }}
              >
                <CachedImage
                  uri={getFullImageUrl(typeof imageUrl === 'object' && 'url' in imageUrl ? imageUrl.url : imageUrl || '')}
                  style={styles.searchResultImage}
                  resizeMode="cover"
                />
                <View style={styles.searchResultInfo}>
                  <ThemedText style={styles.searchResultName}>{item.name}</ThemedText>
                  <ThemedText style={styles.searchResultPrice}>₹{item.price}</ThemedText>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.noResultsContainer}>
              <ThemedText style={styles.noResultsText}>No products found</ThemedText>
            </View>
          }
        />
      </View>
    );
  };

  // Add a useEffect to log categories for debugging purposes
  useEffect(() => {
    if (categories.length > 0) {
      console.log(`Loaded ${categories.length} categories`);
      categories.forEach(cat => console.log(`- ${cat.name}`));
    }
  }, [categories]);

  // Handle press on "View All Vendors"
  const handleViewAllVendors = () => {
    router.push('/vendors');
  };

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      const vendorsData = await getActiveVendors();
      setVendors(vendorsData);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };
  
  useEffect(() => {
    // Fetch all data on component mount
    fetchData();
    fetchVendors();
  }, []);

  // First add a new animated style for the header background
  const headerBackgroundStyle = useAnimatedStyle(() => {
    // Simple translation without scaling
    const translateY = interpolate(
      scrollY.value,
      [0, 350],
      [0, -350],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
    };
  });

  return (
    <ThemedView style={styles.container}>
      <StatusBar 
        translucent={true}
        backgroundColor="transparent" 
        barStyle="light-content" 
      />
      
      {/* Replace the static header background with animated one */}
      <Animated.View style={[styles.headerBackground, headerBackgroundStyle]}>
        <CachedImage
          uri="https://img.freepik.com/free-vector/abstract-modern-fluid-line-blue-backdrop-design_1017-50096.jpg"
          style={styles.headerBackgroundImage}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay} />
      </Animated.View>

      {/* Status Bar Background */}
      <Animated.View style={statusBarBackgroundStyle} />
      
      {/* Animated Header Container */}
      <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
        {/* Add a drop shadow/elevation container that only shows when scrolled */}
        <View style={styles.headerShadow} />
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Animated.View style={[styles.deliveryInfo, deliveryInfoAnimatedStyle]}>
              <ThemedText style={styles.deliveryTimeSmall}>Joriyo</ThemedText>
              <ThemedText style={styles.deliveryTime}>in 1 minute</ThemedText>
            </Animated.View>
            <Animated.View style={deliveryInfoAnimatedStyle}>
              <TouchableOpacity onPress={handleLoginPress} style={styles.accountButton}>
                <MaterialIcons name="account-circle" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          <Animated.View style={deliveryInfoAnimatedStyle}>
            <TouchableOpacity onPress={handleLocationPress} style={styles.locationButton}>
              <ThemedText style={styles.locationText}>Make shopping simple</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.searchBar}
            onPress={() => router.push('/search')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="search" size={22} color="#333333" />
            <ThemedText 
              style={[styles.searchInput, { color: '#666666' }]}
              numberOfLines={1}
            >
              {placeholderTexts[currentPlaceholderIndex]}
            </ThemedText>
            <MaterialIcons name="mic" size={22} color="#333333" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{
          paddingTop: 350, // Add padding for header height
        }}
      >
        {/* Category Section (Order No. 1) - First category with 3 products in single row */}
        {!loading && categories.length > 0 && (
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <ThemedText style={styles.categoryTitleNew}>{categories[0]?.name}</ThemedText>
            </View>
            
            {loadingCategoryProducts[categories[0]?._id] ? (
              <View style={styles.categoryLoading}>
                <ActivityIndicator size="small" color="#0CAF50" />
              </View>
            ) : categoryProductsMap[categories[0]?._id] && categoryProductsMap[categories[0]?._id].length > 0 ? (
              <View style={styles.productsGrid}>
                {categoryProductsMap[categories[0]?._id].slice(0, 3).map((product) => (
                  <View key={`product-${product._id}`} style={styles.productCardGrid}>
                    <ProductCard product={product} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noCategoryProducts}>
                <ThemedText style={styles.noCategoryProductsText}>No products available</ThemedText>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.seeAllButtonPrimary} 
              onPress={() => handleCategoryPress(categories[0])}
            >
              <ThemedText style={styles.seeAllButtonText}>See All Products</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Featured This Week Section */}
        {featuredThisWeek.length > 0 && (
          <View style={styles.featuredThisWeekSection}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 15, marginBottom: 8 }]}>
              <ThemedText style={styles.sectionTitleNew}>
                Featured This Week
              </ThemedText>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.featuredThisWeekContainerSmall}
            >
              {featuredThisWeek.map((category, index) => {
                const imageUrl = getFullImageUrl(category.image);
                if (!imageUrl) return null;
                return (
                  <TouchableOpacity 
                    key={`featured-${category._id}`}
                    style={styles.featuredThisWeekCardSmall}
                    onPress={() => {
                      console.log('Navigating to featured category:', category._id);
                      router.push(`/featured-category/${category._id}`);
                    }}
                  >
                    <CachedImage
                      uri={imageUrl}
                      style={styles.featuredThisWeekImageSmall}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Shop by Category Section - Horizontal scrollable */}
        <View style={styles.categoriesSection}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 15 }]}>
            <ThemedText style={styles.sectionTitleNew}>Shop by Category</ThemedText>
          </View>
          
          <View style={styles.categoryGridFourColumn}>
            {categories.slice(0, 8).map(item => {
              const imageUrl = getFullImageUrl(item.image);
              if (!imageUrl) return null;
              return (
                <TouchableOpacity 
                  key={item._id}
                  style={styles.categoryGridItemSmall}
                  onPress={() => handleCategoryPress(item)}
                >
                  <View style={styles.categoryImageContainerSmall}>
                    <CachedImage
                      uri={imageUrl}
                      style={styles.categoryImageSmall}
                      resizeMode="cover"
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Shop by Brands Section - Horizontal scrollable */}
        <View style={styles.brandsSection}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 15 }]}>
            <ThemedText style={styles.sectionTitleNew}>Shop by Brands</ThemedText>
          </View>
          
          <View style={styles.categoryGridFourColumn}>
            {vendors.slice(0, 8).map(vendor => {
              if (!vendor.imageUrl) return null;
              const imageUrl = getFullImageUrl(vendor.imageUrl);
              if (!imageUrl) return null;
              
              return (
                <TouchableOpacity 
                  key={vendor._id}
                  style={styles.categoryGridItemSmall}
                  onPress={() => router.push(`/vendor/${vendor._id}`)}
                >
                  <View style={styles.categoryImageContainerSmall}>
                    <CachedImage
                      uri={imageUrl}
                      style={styles.brandImageSmall}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Category Section (Order No. 2) - Second category with 3 products in single row */}
        {!loading && categories.length > 1 && (
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <ThemedText style={styles.categoryTitleNew}>{categories[1]?.name}</ThemedText>
            </View>
            
            {loadingCategoryProducts[categories[1]?._id] ? (
              <View style={styles.categoryLoading}>
                <ActivityIndicator size="small" color="#0CAF50" />
              </View>
            ) : categoryProductsMap[categories[1]?._id] && categoryProductsMap[categories[1]?._id].length > 0 ? (
              <View style={styles.productsGrid}>
                {categoryProductsMap[categories[1]?._id].slice(0, 3).map((product) => (
                  <View key={`product-${product._id}`} style={styles.productCardGrid}>
                    <ProductCard product={product} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noCategoryProducts}>
                <ThemedText style={styles.noCategoryProductsText}>No products available</ThemedText>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.seeAllButtonPrimary} 
              onPress={() => handleCategoryPress(categories[1])}
            >
              <ThemedText style={styles.seeAllButtonText}>See All Products</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Section (Order No. 3) - Third category with 3x2 grid (6 products) */}
        {!loading && categories.length > 2 && (
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <ThemedText style={styles.categoryTitleNew}>{categories[2]?.name}</ThemedText>
            </View>
            
            {loadingCategoryProducts[categories[2]?._id] ? (
              <View style={styles.categoryLoading}>
                <ActivityIndicator size="small" color="#0CAF50" />
              </View>
            ) : categoryProductsMap[categories[2]?._id] && categoryProductsMap[categories[2]?._id].length > 0 ? (
              <View style={styles.productsMultiRowLayout}>
                {categoryProductsMap[categories[2]?._id].slice(0, 6).map((product) => (
                  <View key={`product-${product._id}`} style={styles.productCardGrid}>
                    <ProductCard product={product} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noCategoryProducts}>
                <ThemedText style={styles.noCategoryProductsText}>No products available</ThemedText>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.seeAllButtonPrimary} 
              onPress={() => handleCategoryPress(categories[2])}
            >
              <ThemedText style={styles.seeAllButtonText}>See All Products</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* After the third category section, add the banner carousel */}
        {/* Move this section from the top to here */}
        {banners.length > 0 && (
          <View style={styles.bannersContainer}>
            <ScrollView 
              horizontal 
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              {banners.map((banner, index) => {
                const imageUrl = getFullImageUrl(banner.image);
                if (!imageUrl) return null;
                return (
                  <View key={`banner-${index}`} style={styles.bannerSlide}>
                    <CachedImage
                      uri={imageUrl}
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Additional Category Sections (Order No. 4, 5, etc.) - 3x2 grid format */}
        {!loading && categories.slice(3).map((category, index) => (
          <View key={`category-section-${category._id}`} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <ThemedText style={styles.categoryTitleNew}>{category.name}</ThemedText>
            </View>
            
            {loadingCategoryProducts[category._id] ? (
              <View style={styles.categoryLoading}>
                <ActivityIndicator size="small" color="#0CAF50" />
              </View>
            ) : categoryProductsMap[category._id] && categoryProductsMap[category._id].length > 0 ? (
              <View style={styles.productsMultiRowLayout}>
                {categoryProductsMap[category._id].slice(0, 6).map((product) => (
                  <View key={`product-${product._id}`} style={styles.productCardGrid}>
                    <ProductCard product={product} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noCategoryProducts}>
                <ThemedText style={styles.noCategoryProductsText}>No products available</ThemedText>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.seeAllButtonPrimary} 
              onPress={() => handleCategoryPress(category)}
            >
              <ThemedText style={styles.seeAllButtonText}>See All Products</ThemedText>
            </TouchableOpacity>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerTextUnique}>
            Joriyo - Make Shopping Simple 
          </ThemedText>
        </View>

      </Animated.ScrollView>

      {/* Cart summary bar - only show when cart has items */}
      {cartItemCount > 0 && (
        <CartSummaryBar
          itemCount={cartItemCount}
          total={`₹${cartTotal.toFixed(2)}`}
          onPress={handleViewCart}
        />
      )}
    </ThemedView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    paddingTop: 4,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTime: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  deliveryTimeSmall: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  accountButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  locationText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.85,
    fontWeight: '400',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    marginTop: 4,
    position: 'relative',
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#333333',
    paddingVertical: 8,
    height: '100%',
    textAlignVertical: 'center',
  },
  scrollView: {
    flex: 1,
  },
  categoriesSection: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
    padding: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    padding: 0,
    margin: 0,
  },
  categoryGridItem: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    padding: 8,
    width: '25%',
    height: screenWidth / 2.8,
    maxWidth: screenWidth / 4,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 8,
  },
  categoryImageLarge: {
    width: screenWidth / 2,
    height: screenWidth / 2,
    resizeMode: 'contain',
    borderRadius: 0,
  },
  categoryImagePlaceholder: {
    width: 105,
    height: 105,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    color: '#1C1C1C',
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionTitleNew: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    fontFamily: 'Okra-Bold',
    marginBottom: 0,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  sectionTitleSmall: {
    fontSize: 18,
    color: '#1C1C1C',
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: 'Okra-Bold',
  },
  bannersSection: {
    paddingHorizontal: 16,
    marginTop: 5,
    marginBottom: 5,
  },
  bannerSlide: {
    width: screenWidth - 32,
    height: 180,
  },
  bannerImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginVertical: 10,
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  noProductsContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginVertical: 10,
    borderRadius: 8,
  },
  noProductsText: {
    fontSize: 16,
    color: '#666666',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bannerTitleContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
    borderRadius: 10,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  bannerDescription: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  loadingProductsContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  noDataText: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
  },
  quickActionsContainer: {
    padding: 15,
    marginBottom: 10,
  },
  quickActionsScroll: {
    paddingLeft: 10,
    paddingRight: 5,
    paddingBottom: 10,
  },
  quickActionButton: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 75,
  },
  quickActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    height: 32,
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '500',
    fontFamily: 'Okra-Medium',
  },
  productsContainer: {
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  productCardHorizontal: {
    width: 170,
    marginHorizontal: 6,
  },
  productGridCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
    padding: 8,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120, 
    marginBottom: 8,
    padding: 5,
  },
  productImage: {
    width: '100%',
    height: '100%', 
    resizeMode: 'contain',
    backgroundColor: '#f9f9f9',
  },
  productImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  productMeta: {
    flexDirection: 'row',
    marginTop: 6,
    paddingHorizontal: 8,
  },
  productSpec: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
    marginRight: 4,
  },
  productType: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  gridProductName: {
    fontSize: 13,
    color: '#1C1C1C',
    marginVertical: 4,
    fontWeight: '500',
    lineHeight: 20,
    paddingHorizontal: 8,
    height: 22, 
    fontFamily: 'Okra-Medium',
  },
  ratingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 11,
    color: '#666666',
  },
  deliveryTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  deliveryTimeText: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 4,
    fontWeight: '500',
  },
  discountText: {
    fontSize: 12,
    color: '#0CAF50',
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1C',
    fontFamily: 'Okra-Bold',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
    marginTop: 2,
    fontFamily: 'Okra-Regular',
  },
  trendingTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#FEF0D7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  trendingText: {
    color: '#936500',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Okra-Bold',
  },
  bestsellerTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#FEF0D7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bestsellerText: {
    color: '#936500',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Okra-Bold',
  },
  addButtonText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '700',
  },
  seeMoreContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeMoreText: {
    fontSize: 11,
    color: '#0CAF50',
    fontWeight: '500',
    marginRight: 2,
    fontFamily: 'Okra-Medium',
  },
  productsGridContainer: {
    paddingHorizontal: 8,
  },
  footerSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    marginTop: 20,
  },
  footerBlock: {
    marginBottom: 24,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  footerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  footerGridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  footerHighlight: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 4,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
    fontFamily: 'Okra-Regular',
  },
  searchResultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  searchResultItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
    fontFamily: 'Okra-Medium',
  },
  searchResultPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666666',
  },
  cartWrapper: {
    position: 'absolute',
    bottom: 75,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  viewCartButton: {
    backgroundColor: '#097C17',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    height: 50,
    width: '68%',
    maxWidth: 270,
  },
  cartImagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 0,
    width: '28%',
  },
  cartImageCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  cartExtraItemsCircle: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartExtraItemsText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#097C17',
  },
  cartProductImage: {
    width: '100%',
    height: '100%',
  },
  cartTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  cartViewText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 20,
  },
  cartItemText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
  },
  cartChevronIcon: {
    marginLeft: 4,
    marginRight: 8,
  },
  productCardGrid: {
    width: '31%',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  seeAllButtonPrimary: {
    backgroundColor: '#f0f7ff',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  seeAllButtonText: {
    color: '#1565C0',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryGridFourColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 4,
    marginBottom: 8,
  },
  categoryGridItemSmall: {
    width: '24%', 
    marginBottom: 16,
    alignItems: 'center',
  },
  categoryImageContainerSmall: {
    width: 85,
    height: 100, // Increased height to prevent cutting off
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  categoryImageSmall: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // Ensures image fills the container
  },
  brandsSection: {
    marginVertical: 12,
  },
  brandsScrollContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  brandItemSmall: {
    marginHorizontal: 4,
  },
  brandImageContainerSmall: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  brandImageSmall: {
    width: '100%', // Increased to fill container completely
    height: '100%', // Increased to fill container completely
    resizeMode: 'contain',
  },
  brandImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerTextUnique: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  productsMultiRowLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  categorySection: {
    marginVertical: 10,
    backgroundColor: '#FFFFFF',
    zIndex: 2, // Ensure content appears above header background
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  categoryTitle: {
    fontSize: 22,
    color: '#1C1C1C',
    fontWeight: '700',
    fontFamily: 'Okra-Bold',
  },
  seeAllLink: {
    fontSize: 14,
    color: '#0CAF50',
    fontWeight: '500',
    fontFamily: 'Okra-Medium',
  },
  categoryLoading: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productsRow: {
    paddingHorizontal: 10,
    paddingBottom: 15,
  },
  productCardSkeleton: {
    width: 160,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 6,
    padding: 8,
    height: 250,
  },
  skeletonImage: {
    width: '100%',
    height: 110,
    backgroundColor: '#EEEEEE',
    marginBottom: 8,
    borderRadius: 4,
  },
  skeletonText: {
    width: '100%',
    height: 20,
    backgroundColor: '#EEEEEE',
    marginBottom: 8,
    borderRadius: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
    padding: 4,
    fontFamily: 'Okra-Medium',
  },
  noCategoryProducts: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCategoryProductsText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Okra-Medium',
  },
  featuredCategoriesSection: {
    marginVertical: 16,
  },
  featuredCategoriesContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  featuredCategoryCard: {
    width: 100,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  featuredCategoryImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featuredCategoryName: {
    fontSize: 12,
    textAlign: 'center',
  },
  featuredThisWeekSection: {
    marginVertical: 12,
    marginTop: 16,
  },
  featuredThisWeekContainerSmall: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 4,
  },
  featuredThisWeekCardSmall: {
    marginHorizontal: 8,
    borderRadius: 10,
    overflow: 'hidden',
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
  },
  featuredThisWeekImageSmall: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryScrollContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  categoryItemSmall: {
    marginHorizontal: 4,
  },
  categoryTitleNew: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    fontFamily: 'Okra-Bold',
    letterSpacing: -0.2,
  },
  imagePlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannersContainer: {
    height: 180,
    marginVertical: 16,
    marginHorizontal: 16,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
    zIndex: 1,
    overflow: 'hidden',
  },
  headerBackgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});
