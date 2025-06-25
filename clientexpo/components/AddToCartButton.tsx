import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ThemedText from './ThemedText';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useCartRedirect } from '@/context/CartRedirectContext';
import { Product } from '@/services/product';
import { router } from 'expo-router';
import ProductVariationModal from './ProductVariationModal';

type AddToCartButtonProps = {
  product: Product;
  style?: any;
};

export function AddToCartButton({ 
  product,
  style,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { handleAddToCart: redirectToLogin } = useCartRedirect();
  const [isInCart, setIsInCart] = useState(false);
  const [quantity, setQuantity] = useState(0);
  // State for handling variations
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  useEffect(() => {
    // Check if item is in cart
    const cartItem = cartItems.find(item => item.product._id === product._id);
    setIsInCart(!!cartItem);
    setQuantity(cartItem?.quantity || 0);
    
    // For products with variations, pre-set the default variation based on product props
    if (product && product.hasVariations && product.variations && product.variations.length > 0) {
      if (product.selectedVariationId) {
        const foundVariation = product.variations.find(v => v._id === product.selectedVariationId);
        if (foundVariation) {
          setSelectedVariation(foundVariation);
        }
      } else if (product.selectedSize) {
        const foundVariation = product.variations.find(v => v.size === product.selectedSize);
        if (foundVariation) {
          setSelectedVariation(foundVariation);
        }
      }
    }
  }, [product, cartItems]);

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!isAuthenticated) {
        setLoading(false);
        // Use the CartRedirectContext to handle login redirection
        redirectToLogin();
        return;
      }
      
      // Check for variations
      if (product.hasVariations) {
        console.log('Product has variations, checking selected variation');
        console.log('Product variations:', product.variations?.length || 0);
        
        // If no variation is selected and we have variations, show the modal
        if (!selectedVariation && product.variations && product.variations.length > 0) {
          console.log('No variation selected, showing modal for:', product.name);
          console.log('Setting showVariationModal to true');
          setShowVariationModal(true);
          setLoading(false);
          return;
        }
        
        // Log selected variation details
        console.log('Selected variation:', selectedVariation);
        
        // Check if selected variation is out of stock
        if (selectedVariation && selectedVariation.stock <= 0) {
          Alert.alert("Out of Stock", `Sorry, ${selectedVariation.size} is out of stock`);
          setLoading(false);
          return;
        }
        
        // Add variation to cart
        if (selectedVariation) {
          console.log('Adding product with variation to cart:', {
            productId: product._id,
            variationId: selectedVariation._id,
            size: selectedVariation.size,
            price: selectedVariation.price
          });
          
          // Ensure price is always valid
          const variationPrice = typeof selectedVariation.price === 'string' 
            ? parseFloat(selectedVariation.price) 
            : selectedVariation.price;
            
          // Create product with variation, ensuring price is set properly
          const productWithVariation = {
            ...product,
            price: variationPrice > 0 ? variationPrice : (product.price || 0),
            stock: selectedVariation.stock,
            selectedVariationId: selectedVariation._id,
            selectedSize: selectedVariation.size
          };
          
          await addToCart(productWithVariation, 1);
          setIsInCart(true);
          setQuantity(1);
          setLoading(false);
          return;
        }
      }
      
      // Regular product without variations (or with variations already selected)
      // Check if product is out of stock
      if (typeof product.stock === 'number' && product.stock <= 0) {
        Alert.alert("Out of Stock", "Sorry, this product is out of stock");
        setLoading(false);
        return;
      }

      console.log('Adding regular product to cart:', product._id);
      await addToCart(product, 1);
      setIsInCart(true);
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncreaseQuantity = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Show login prompt
      Alert.alert(
        "Login Required",
        "Please login to manage your cart",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    
    // Check if increasing would exceed available stock
    let stockLimit = product.stock;
    if (product.hasVariations && selectedVariation) {
      stockLimit = selectedVariation.stock;
    }
    
    if (typeof stockLimit === 'number' && quantity >= stockLimit) {
      Alert.alert("Stock Limit", `Cannot add more. Stock limit reached (${stockLimit} available)`);
      return;
    }

    // Use the direct updateQuantity method with the new quantity
    const newQuantity = quantity + 1;
    console.log(`Increasing quantity for ${product._id} to ${newQuantity}`);
    await updateQuantity(product._id, newQuantity);
    setQuantity(newQuantity);
  };

  const handleDecreaseQuantity = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Show login prompt
      Alert.alert(
        "Login Required",
        "Please login to manage your cart",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    
    if (quantity > 1) {
      // Use the direct updateQuantity method with the new quantity
      const newQuantity = quantity - 1;
      console.log(`Decreasing quantity for ${product._id} to ${newQuantity}`);
      await updateQuantity(product._id, newQuantity);
      setQuantity(newQuantity);
    } else {
      // Remove item from cart when quantity becomes 0
      console.log(`Removing ${product._id} from cart`);
      await updateQuantity(product._id, 0);
      setIsInCart(false);
      setQuantity(0);
    }
  };
  
  // Handle variation selection from modal
  const handleVariationSelect = (variationId: string, size: string) => {
    console.log('Variation selected from modal:', { variationId, size });
    const selectedVar = product.variations?.find(v => v._id === variationId);
    
    if (selectedVar) {
      console.log('Found variation data:', selectedVar);
      setSelectedVariation(selectedVar);
      
      // Create a product with the selected variation
      const productWithVariation = {
        ...product,
        price: selectedVar.price,
        stock: selectedVar.stock,
        selectedVariationId: variationId,
        selectedSize: size
      };
      
      console.log('Adding product with variation to cart');
      // Add to cart
      addToCart(productWithVariation, 1);
      setIsInCart(true);
      setQuantity(1);
      
      // Important: DO NOT close the modal here - it will stay open until user explicitly closes it
    } else {
      console.error('Selected variation not found in product variations:', variationId);
    }
  };

  // Determine if product or selected variation is out of stock
  const isOutOfStock = () => {
    if (product.hasVariations) {
      if (selectedVariation) {
        return selectedVariation.stock <= 0;
      }
      // If no variation selected yet, check if ANY variation has stock
      return !product.variations?.some(v => v.stock > 0);
    }
    
    return typeof product.stock === 'number' && product.stock <= 0;
  };

  if (isInCart) {
    return (
      <View style={[styles.quantityContainer, style]}>
        <TouchableOpacity 
          style={styles.quantityButton} 
          onPress={handleDecreaseQuantity}
        >
          <MaterialIcons name="remove" size={16} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.quantityTextContainer}>
          <ThemedText style={styles.quantityText}>
            {quantity}
            {typeof product.stock === 'number' && quantity === product.stock && (
              <ThemedText style={styles.maxText}> (max)</ThemedText>
            )}
          </ThemedText>
        </View>

        <TouchableOpacity 
          style={[
            styles.quantityButton,
            typeof product.stock === 'number' && quantity >= product.stock && styles.disabledButton
          ]} 
          onPress={handleIncreaseQuantity}
          disabled={typeof product.stock === 'number' && quantity >= product.stock}
        >
          <MaterialIcons name="add" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity 
        style={[
          styles.addButton,
          isOutOfStock() && styles.disabledButton,
          style
        ]}
        onPress={handleAddToCart}
        disabled={isOutOfStock() || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <ThemedText style={styles.addButtonText}>
            {isOutOfStock() ? "Out of Stock" : "ADD"}
          </ThemedText>
        )}
      </TouchableOpacity>
      
      {/* Product Variation Modal */}
      <ProductVariationModal
        product={product}
        visible={showVariationModal}
        onClose={() => {
          // Only close the modal when the X button is clicked
          console.log('User explicitly closed variation modal');
          setShowVariationModal(false);
        }}
        onSelectVariation={(variationId, size) => {
          // This function will only be called if we need to select a variation
          // DO NOT close the modal here
          console.log('Variation selected from modal:', { variationId, size });
          const selectedVar = product.variations?.find(v => v._id === variationId);
          
          if (selectedVar) {
            console.log('Found variation data:', selectedVar);
            setSelectedVariation(selectedVar);
            
            // Create a product with the selected variation
            const productWithVariation = {
              ...product,
              price: selectedVar.price,
              stock: selectedVar.stock,
              selectedVariationId: variationId,
              selectedSize: size
            };
            
            console.log('Adding product with variation to cart');
            // Add to cart
            addToCart(productWithVariation, 1);
            setIsInCart(true);
            setQuantity(1);
            
            // IMPORTANT: Do NOT close the modal by setting showVariationModal to false
          } else {
            console.error('Selected variation not found in product variations:', variationId);
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    overflow: 'hidden',
    height: 32,
  },
  quantityButton: {
    backgroundColor: '#4CAF50',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  quantityTextContainer: {
    paddingHorizontal: 6,
    minWidth: 28,
    alignItems: 'center',
  },
  quantityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  maxText: {
    color: '#FFF',
    fontSize: 12,
    opacity: 0.8,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
    opacity: 0.8,
  },
});
