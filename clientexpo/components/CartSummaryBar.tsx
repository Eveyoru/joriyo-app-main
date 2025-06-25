import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import ThemedText from './ThemedText';
import { useCart } from '@/context/CartContext';
import { router, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getFullImageUrl } from '@/utils/api';

const { width: screenWidth } = Dimensions.get('window');

type CartSummaryBarProps = {
  itemCount?: number;
  total?: string;
  onPress?: () => void;
};

export function CartSummaryBar({ itemCount, total, onPress }: CartSummaryBarProps = {}) {
  const { cartItems } = useCart();
  const pathname = usePathname();

  // Hide on cart page
  if (pathname === '/cart' || cartItems.length === 0) {
    return null;
  }

  const totalItems = itemCount || cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate total if not provided
  const cartTotal = total || `₹${cartItems.reduce((sum, item) => {
    const price = typeof item.product.price === 'number' ? item.product.price : 0;
    return sum + price * item.quantity;
  }, 0).toFixed(2)}`;

  const handleViewCart = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/cart');
    }
  };

  // Get product images to display (max 3)
  const productImages = cartItems
    .slice(0, 3)
    .map(item => {
      if (!item.product.image) return null;
      
      if (Array.isArray(item.product.image) && item.product.image.length > 0) {
        const firstImage = item.product.image[0];
        if (typeof firstImage === 'string') {
          return getFullImageUrl(firstImage);
        } else if (typeof firstImage === 'object' && firstImage?.url) {
          return getFullImageUrl(firstImage.url);
        }
      } else if (typeof item.product.image === 'string') {
        return getFullImageUrl(item.product.image);
      }
      
      // Try other image properties if available
      if (item.product.imageValue && Array.isArray(item.product.imageValue) && item.product.imageValue.length > 0) {
        return getFullImageUrl(item.product.imageValue[0]);
      }
      
      return null;
    })
    .filter(img => img !== null);

  // Determine width based on content - start small and expand if needed
  const baseWidth = 160; // Base width for just text
  const imageWidth = 36; // Width each image adds
  const dynamicWidth = Math.min(baseWidth + (productImages.length * imageWidth), screenWidth - 32);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity 
        style={[styles.container, { width: dynamicWidth }]} 
        onPress={handleViewCart}
        activeOpacity={0.9}
      >
        {/* Product Images */}
        {productImages.length > 0 && (
          <View style={styles.imagesContainer}>
            {productImages.map((imageUrl, index) => (
              <View 
                key={index} 
                style={[
                  styles.imageCircle,
                  { marginLeft: index > 0 ? -12 : 0, zIndex: 3 - index }
                ]}
              >
                <Image 
                  source={{ uri: imageUrl as string }} 
                  style={styles.productImage} 
                  resizeMode="cover"
                />
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.contentContainer}>
          <ThemedText style={styles.viewCartText}>View cart</ThemedText>
          <ThemedText style={styles.itemCountText}>{totalItems} ITEM</ThemedText>
        </View>
        
        <MaterialIcons name="chevron-right" size={22} color="#FFFFFF" style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 75,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32', // Darker green color
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 32, // More rounded
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    marginRight: 12,
    alignItems: 'center',
  },
  imageCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  viewCartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Okra-Bold',
    marginBottom: 0,
  },
  itemCountText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontFamily: 'Okra-Regular',
    textTransform: 'uppercase',
  },
  icon: {
    marginLeft: 8,
  },
});
