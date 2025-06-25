import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, StatusBar, Alert, Modal, ActivityIndicator } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useCart } from '@/context/CartContext';
import { getFullImageUrl } from '@/utils/api';
import { calculateDiscountedPrice } from '@/services/product';
import { getUserAddresses, placeOrder, getAuthToken } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_DELIVERY_CHARGE } from '@/constants/config';
import { CachedImage } from '@/components/CachedImage';

// Get base URL for API calls
const getBaseUrl = () => {
  // For development testing, use the correct IP address of your server
  return 'http://localhost:8080';
};

// Address interface
interface Address {
  _id: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  mobile: string;
  status: boolean;
}

// Payment method type
type PaymentMethod = 'CASH_ON_DELIVERY' | 'ONLINE_PAYMENT';

// Define a type for cart items that includes variation information
interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    discount?: number;
    image?: string | string[] | { url: string }[];
    images?: string | string[] | { url: string }[];
    variations?: any[];
    quantity?: number;
    unit?: string;
    selectedVariationId?: string;
    selectedSize?: string;
  };
  quantity: number;
  variationId?: string;
  selectedSize?: string;
}

export default function CartScreen() {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    totalItems, 
    totalAmount, 
    syncCart,
    clearCart
  } = useCart();
  const { isAuthenticated, user } = useAuth();

  // Get params from router
  const params = useLocalSearchParams();
  const selectedAddressId = params.selectedAddressId as string;
  const addressConfirmed = params.addressConfirmed === 'true';

  // State for addresses and selected address
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);
  
  // State for payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Local state for calculated values
  const [calculatedTotalPrice, setCalculatedTotalPrice] = useState(0);
  const [calculatedDeliveryCharge, setCalculatedDeliveryCharge] = useState(0);
  const [calculatedGrandTotal, setCalculatedGrandTotal] = useState(0);
  const [calculatedSaveAmount, setCalculatedSaveAmount] = useState(0);
  
  // Recalculate totals whenever cart items change
  useEffect(() => {
    let newTotalPrice = 0;
    let newSaveAmount = 0;
    
    cartItems.forEach(item => {
      const itemPrice = item.product.price !== null && item.product.price !== undefined ? item.product.price : 0;
      const discountedPrice = item.product.discount 
        ? calculateDiscountedPrice(item.product) 
        : itemPrice;
        
      newTotalPrice += discountedPrice * item.quantity;
      
      // Calculate savings if there's a discount
      if (item.product.discount && item.product.discount > 0) {
        const savings = (itemPrice - discountedPrice) * item.quantity;
        newSaveAmount += savings;
      }
    });
    
    setCalculatedTotalPrice(newTotalPrice);
    setCalculatedSaveAmount(newSaveAmount);
    
    // Set delivery charge based on total price
    const newDeliveryCharge = newTotalPrice >= 100 ? 0 : 20;
    setCalculatedDeliveryCharge(newDeliveryCharge);
    
    // Set grand total
    setCalculatedGrandTotal(newTotalPrice + newDeliveryCharge);
  }, [cartItems]);

  // Fetch user addresses on component mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  // Fetch addresses whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Cart screen focused - refreshing addresses');
      fetchAddresses();
      return () => {
        // Cleanup function when screen loses focus (optional)
      };
    }, [])
  );

  // Function to fetch user addresses
  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      setAddressError(null);
      console.log('Fetching user addresses...');
      const response = await getUserAddresses();
      if (response.error) {
        setAddressError(response.message || 'Failed to fetch addresses');
        console.error('Address fetch error:', response.message);
      } else {
        // Filter out addresses with status: false
        const activeAddresses = (response.data || []).filter((address: Address) => address.status !== false);
        setAddresses(activeAddresses);
        console.log(`Fetched ${activeAddresses.length} active addresses`);
        
        // If no address is currently selected but addresses are available, select the first one
        if ((!selectedAddress || !activeAddresses.find((addr: Address) => addr._id === selectedAddress._id)) && activeAddresses.length > 0) {
          setSelectedAddress(activeAddresses[0]);
          console.log('Auto-selected address:', activeAddresses[0].address_line);
        }
        
        // If an address ID is provided in the params, select that address
        if (selectedAddressId && activeAddresses.length > 0) {
          const addressToSelect = activeAddresses.find((address: Address) => address._id === selectedAddressId);
          if (addressToSelect) {
            setSelectedAddress(addressToSelect);
            console.log('Selected address from params:', addressToSelect.address_line);
          }
        }
      }
    } catch (err) {
      setAddressError('An error occurred while fetching addresses');
      console.error('Address fetch error:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleIncreaseQuantity = (productId: string, currentQty: number) => {
    updateQuantity(productId, currentQty + 1);
  };

  const handleDecreaseQuantity = (productId: string, currentQty: number) => {
    if (currentQty > 1) {
      updateQuantity(productId, currentQty - 1);
    } else {
      // If quantity becomes 0, remove the item
      removeFromCart(productId);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
  };

  const handleAddAddress = () => {
    router.push({
      pathname: '/user/addresses',  // This matches your actual file
      params: { returnToCart: 'true' }
    });
  };

  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
    console.log('Selected address:', address.address_line);
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setShowPaymentOptions(false);
  };

  // Handle checkout process
  const handleCheckout = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      Alert.alert(
        "Login Required", 
        "Please login to continue with checkout",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", 
        "Your cart is empty. Add some items before checkout.",
        [{ text: "OK" }]
      );
      return;
    }

    // Validate if an address is selected
    if (!selectedAddress) {
      Alert.alert('Missing Address', 'Please select a delivery address before proceeding.');
      return;
    }

    // Start order placement
    try {
      setLoading(true);
      console.log('Starting order placement with items:', cartItems.length);

      // Format cart items exactly like web client
      const formattedItems = cartItems.map(item => {
        // Log each item being processed
        console.log('Processing item:', {
          id: item.product._id,
          name: item.product.name,
          variation: item.product.selectedVariationId || 'none'
        });

        // Create the item object exactly as web client does
        const formattedItem: any = {
          productId: {
            _id: item.product._id,
            name: item.product.name,
            price: item.product.price,
            discount: item.product.discount,
            image: item.product.image || item.product.images,
            variations: item.product.variations
          },
          quantity: item.quantity
        };

        // Add variation data if present
        if (item.product.selectedVariationId) {
          formattedItem.variationId = item.product.selectedVariationId;
          formattedItem.selectedSize = item.product.selectedSize;
        }

        return formattedItem;
      });

      // Log the final formatted items
      console.log('Formatted order items:', JSON.stringify(formattedItems, null, 2));

      // Prepare order data exactly like web client
      const orderData = {
        list_items: formattedItems,
        addressId: selectedAddress._id,
        subTotalAmt: calculatedTotalPrice,
        totalAmt: calculatedGrandTotal
      };

      // Log the final order data being sent
      console.log('Sending order data:', JSON.stringify(orderData, null, 2));

      // Make the API call exactly like web client
      const response = await fetch(`${getBaseUrl()}/api/order/cash-on-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(orderData)
      });

      // Get response as text first for debugging
      const responseText = await response.text();
      console.log('API Response text:', responseText);

      // Parse response
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', e);
        Alert.alert('Error', 'Invalid response from server');
        return;
      }

      if (!result.success) {
        console.error('Order API error:', result);
        Alert.alert('Error', result.message || 'Failed to place order');
        return;
      }

      console.log('Order placed successfully:', result);

      // Clear cart and navigate to success
      clearCart();
      
      // Get order ID from response
      const orderId = result.data?.orderId || '';
      
      // Navigate to confirmation animation screen first
      router.push({
        pathname: '/order/confirmation',
        params: {
          orderId: orderId,
          totalAmount: calculatedGrandTotal.toString(),
          paymentMethod: paymentMethod
        }
      });

    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'An error occurred while placing your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render a placeholder for missing images
  const renderImagePlaceholder = (type: string = "missing") => {
    return (
      <View style={[styles.productImage, styles.imagePlaceholder]}>
        <MaterialIcons 
          name={type === "error" ? "image-not-supported" : "image"} 
          size={24} 
          color="#DDD" 
        />
      </View>
    );
  };

  // Helper function to render the product image
  const renderProductImage = (product: any) => {
    try {
      if (!product) return renderImagePlaceholder();

      // First try imageValue from API response
      if (product.imageValue && Array.isArray(product.imageValue) && product.imageValue.length > 0) {
        const imageUrl = getFullImageUrl(product.imageValue[0]);
        if (imageUrl) {
          return (
            <CachedImage 
              uri={imageUrl}
              style={styles.productImage}
              resizeMode="cover"
              placeholder={
                <View style={[styles.productImage, styles.imagePlaceholder]}>
                  <ActivityIndicator color="#0CAF50" />
                </View>
              }
            />
          );
        }
      }

      // Fallback to images array if imageValue is not available
      if (Array.isArray(product.images) && product.images.length > 0) {
        const imageUrl = typeof product.images[0] === 'string' 
          ? getFullImageUrl(product.images[0])
          : getFullImageUrl(product.images[0]?.url || '');
          
        if (imageUrl) {
          return (
            <CachedImage 
              uri={imageUrl}
              style={styles.productImage}
              resizeMode="cover"
              placeholder={
                <View style={[styles.productImage, styles.imagePlaceholder]}>
                  <ActivityIndicator color="#0CAF50" />
                </View>
              }
            />
          );
        }
      }

      // Last resort: try image field
      if (product.image) {
        const imageUrl = typeof product.image === 'string'
          ? getFullImageUrl(product.image)
          : Array.isArray(product.image) && product.image.length > 0
            ? typeof product.image[0] === 'string'
              ? getFullImageUrl(product.image[0])
              : getFullImageUrl(product.image[0]?.url || '')
            : '';

        if (imageUrl) {
          return (
            <CachedImage 
              uri={imageUrl}
              style={styles.productImage}
              resizeMode="cover"
              placeholder={
                <View style={[styles.productImage, styles.imagePlaceholder]}>
                  <ActivityIndicator color="#0CAF50" />
                </View>
              }
            />
          );
        }
      }

      return renderImagePlaceholder();
    } catch (error) {
      console.error('Error rendering product image:', error);
      return renderImagePlaceholder("error");
    }
  };

  // Render address item
  const renderAddressItem = (address: Address, isSelected: boolean) => (
    <TouchableOpacity 
      key={address._id} 
      style={[styles.addressCard, isSelected && styles.selectedAddressCard]}
      onPress={() => handleSelectAddress(address)}
    >
      <View style={styles.addressRadio}>
        <View style={styles.radioOuter}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </View>
      <View style={styles.addressContent}>
        <ThemedText style={styles.addressTitle}>{address.address_line.split(',')[0]}</ThemedText>
        <ThemedText style={styles.addressLine}>{address.address_line}</ThemedText>
        <ThemedText style={styles.addressDetails}>
          {address.city}, {address.state}, {address.pincode}
        </ThemedText>
        <ThemedText style={styles.addressDetails}>{address.country}</ThemedText>
        <ThemedText style={styles.mobileText}>Mobile: {address.mobile}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  // Calculate delivery charge based on cart total
  const deliveryCharge = totalItems > 0 ? DEFAULT_DELIVERY_CHARGE : 0;
  
  // Calculate grand total including delivery
  const grandTotal = totalAmount + deliveryCharge;

  // Handle clear cart confirmation
  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => clearCart()
        }
      ]
    );
  };
  
  // Render for empty cart
  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Cart</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        
        {/* Empty Cart Message */}
        <View style={styles.emptyCartContainer}>
          <MaterialIcons name="shopping-cart" size={80} color="#DDD" />
          <ThemedText style={styles.emptyCartText}>Your cart is empty</ThemedText>
          <TouchableOpacity 
            style={styles.continueShoppingButton} 
            onPress={handleBack}
          >
            <ThemedText style={styles.continueShoppingText}>Continue Shopping</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const imageUrl = getFullImageUrl(
      Array.isArray(item.product.image) 
        ? typeof item.product.image[0] === 'string' 
          ? item.product.image[0] 
          : (item.product.image[0] as { url: string })?.url ?? null
        : typeof item.product.image === 'string' 
          ? item.product.image 
          : null
    );

    return (
      <View style={styles.cartItem}>
        {/* Product Image */}
        <View style={styles.productImageContainer}>
          <CachedImage
            uri={imageUrl}
            style={styles.productImage}
            resizeMode="contain"
            placeholder={
              <View style={[styles.productImage, styles.imagePlaceholder]}>
                <ActivityIndicator color="#0CAF50" />
              </View>
            }
          />
        </View>

        {/* Product Details */}
        <View style={styles.productDetails}>
          <ThemedText style={styles.productName}>{item.product.name}</ThemedText>
          <ThemedText style={styles.productPrice}>₹{item.product.price}</ThemedText>
          
          {/* Quantity Controls */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              onPress={() => updateQuantity(item.product._id, Math.max(0, item.quantity - 1))}
              style={styles.quantityButton}
            >
              <Ionicons name="remove" size={20} color="#333" />
            </TouchableOpacity>
            
            <ThemedText style={styles.quantityText}>{item.quantity}</ThemedText>
            
            <TouchableOpacity 
              onPress={() => updateQuantity(item.product._id, item.quantity + 1)}
              style={styles.quantityButton}
            >
              <Ionicons name="add" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Cart</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {/* Savings Info */}
      <View style={styles.savingsContainer}>
        <ThemedText style={styles.savingsText}>
          Your total savings: ₹{calculatedSaveAmount.toFixed(2)}
        </ThemedText>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Cart Items Section */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Items in your order</ThemedText>
        {cartItems.map((item) => (
          <View key={item.product._id} style={styles.cartItemContainer}>
            <View style={styles.cartItemRow}>
              {/* Product Image */}
              <View style={styles.productImageContainer}>
                {renderProductImage(item.product)}
              </View>
              
              {/* Product Info */}
              <View style={styles.productInfo}>
                <ThemedText style={styles.productName}>{item.product.name}</ThemedText>
                
                {/* Show selected size when available */}
                {(item.selectedSize || item.product.selectedSize) && (
                  <ThemedText style={styles.productVariation}>
                    Size: {item.selectedSize || item.product.selectedSize}
                  </ThemedText>
                )}
                
                <ThemedText style={styles.productQuantity}>
                  {item.product.quantity} {item.product.unit || ''}
                </ThemedText>
                
                <View style={styles.itemPriceContainer}>
                  <ThemedText style={styles.itemDiscountedPrice}>
                    ₹{item.product.discount && item.product.price !== null && item.product.price !== undefined
                      ? calculateDiscountedPrice(item.product).toFixed(2)
                      : (item.product.price !== null && item.product.price !== undefined)
                        ? item.product.price.toFixed(2)
                        : '0.00'}
                  </ThemedText>
                  {item.product.discount && item.product.discount > 0 && item.product.price !== null && item.product.price !== undefined && (
                    <ThemedText style={styles.itemOriginalPrice}>
                      MRP ₹{item.product.price.toFixed(2)}
                    </ThemedText>
                  )}
                </View>

                {/* Quantity Controls */}
                <View style={styles.quantityControlsRow}>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityControlButton}
                      onPress={() => handleDecreaseQuantity(item.product._id, item.quantity)}
                    >
                      <MaterialIcons name="remove" size={16} color="#333" />
                    </TouchableOpacity>
                    
                    <View style={styles.quantityTextContainer}>
                      <ThemedText style={styles.quantityText}>{item.quantity}</ThemedText>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.quantityControlButton}
                      onPress={() => handleIncreaseQuantity(item.product._id, item.quantity)}
                    >
                      <MaterialIcons name="add" size={16} color="#333" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.product._id)}
                  >
                    <MaterialIcons name="delete-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
        </View>

        {/* Bill Details */}
        <View style={styles.billDetailsContainer}>
          <ThemedText style={styles.billDetailsTitle}>Bill details</ThemedText>
          
          <View style={styles.billDetailsRow}>
            <ThemedText style={styles.billDetailsLabel}>Items total</ThemedText>
            <ThemedText style={styles.billDetailsValue}>₹{calculatedTotalPrice.toFixed(2)}</ThemedText>
          </View>
          
          <View style={styles.billDetailsRow}>
            <ThemedText style={styles.billDetailsLabel}>Quantity total</ThemedText>
            <ThemedText style={styles.billDetailsValue}>{totalItems} item{totalItems !== 1 ? 's' : ''}</ThemedText>
          </View>
          
          <View style={styles.billDetailsRow}>
            <ThemedText style={styles.billDetailsLabel}>Delivery Charge</ThemedText>
            <ThemedText style={styles.billDetailsValue}>₹{calculatedDeliveryCharge.toFixed(2)}</ThemedText>
          </View>
          
          <View style={[styles.billDetailsRow, styles.grandTotalRow]}>
            <ThemedText style={styles.grandTotalLabel}>Grand total</ThemedText>
            <ThemedText style={styles.grandTotalValue}>₹{calculatedGrandTotal.toFixed(2)}</ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar with Address and Payment */}
      <View style={styles.bottomBar}>
        {/* Delivery Address Section */}
        <View style={styles.deliveryAddressSection}>
          <View style={styles.deliveryAddressIcon}>
            <MaterialIcons name="home" size={20} color="#4CAF50" />
          </View>
          <View style={styles.deliveryAddressContent}>
            <ThemedText style={styles.deliveryAddressLabel}>Delivering to {selectedAddress ? selectedAddress.address_line.split(',')[0] : 'Home'}</ThemedText>
            <ThemedText style={styles.deliveryAddressText} numberOfLines={1} ellipsizeMode="tail">
              {selectedAddress ? 
                `${selectedAddress.address_line}, ${selectedAddress.city}` : 
                'Select an address'}
            </ThemedText>
          </View>
          <TouchableOpacity 
            style={styles.changeAddressButton}
            onPress={() => {
              // Show address selection modal or navigate to address selection
              router.push({
                pathname: '/user/addresses',
                params: { returnToCart: 'true' }
              });
            }}
          >
            <ThemedText style={styles.changeAddressText}>Change</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Place Order Section */}
        <View style={styles.placeOrderSection}>
          <View style={styles.totalPriceContainer}>
            <ThemedText style={styles.totalPriceAmount}>₹{calculatedGrandTotal.toFixed(2)}</ThemedText>
            <ThemedText style={styles.totalPriceLabel}>TOTAL</ThemedText>
          </View>
          
          <View style={styles.paymentMethodContainer}>
            <TouchableOpacity 
              style={styles.paymentDropdownButton}
              onPress={() => setShowPaymentOptions(!showPaymentOptions)}
            >
              <ThemedText style={styles.paymentDropdownText}>
                {paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Online Payment'}
              </ThemedText>
              <MaterialIcons name="arrow-drop-down" size={20} color="#333" />
            </TouchableOpacity>
            
            {showPaymentOptions && (
              <View style={styles.paymentOptionsDropdown}>
                <TouchableOpacity 
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'CASH_ON_DELIVERY' && styles.selectedPaymentOption
                  ]}
                  onPress={() => handlePaymentMethodSelect('CASH_ON_DELIVERY')}
                >
                  <View style={styles.paymentOptionRadio}>
                    {paymentMethod === 'CASH_ON_DELIVERY' && <View style={styles.paymentOptionRadioSelected} />}
                  </View>
                  <ThemedText style={styles.paymentOptionText}>Cash on delivery</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'ONLINE_PAYMENT' && styles.selectedPaymentOption
                  ]}
                  onPress={() => handlePaymentMethodSelect('ONLINE_PAYMENT')}
                >
                  <View style={styles.paymentOptionRadio}>
                    {paymentMethod === 'ONLINE_PAYMENT' && <View style={styles.paymentOptionRadioSelected} />}
                  </View>
                  <ThemedText style={styles.paymentOptionText}>Online</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.placeOrderButton, loading && styles.disabledButton]}
            onPress={handleCheckout}
            disabled={loading || !selectedAddress}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ThemedText style={styles.placeOrderButtonText}>Processing...</ThemedText>
              </View>
            ) : (
              <>
                <ThemedText style={styles.placeOrderButtonText}>Order</ThemedText>
                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    fontFamily: 'Okra-Medium',
    marginBottom: 4,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Okra-Bold',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  savingsContainer: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  savingsText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Okra-Medium',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Okra-Bold',
  },
  addNewButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addNewButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Okra-Medium',
  },
  addressesContainer: {
    marginBottom: 8,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  selectedAddressCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  addressRadio: {
    justifyContent: 'center',
    paddingRight: 12,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  addressContent: {
    flex: 1,
  },
  addressTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    fontFamily: 'Okra-Bold',
    color: '#333333',
  },
  addressLine: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Okra-Regular',
    color: '#555555',
  },
  addressDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
    fontFamily: 'Okra-Regular',
  },
  mobileText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    fontFamily: 'Okra-Regular',
  },
  addressLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  addressErrorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#F44336',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Okra-Regular',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Okra-Medium',
  },
  noAddressContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noAddressText: {
    marginBottom: 15,
    textAlign: 'center',
    color: '#666666',
    fontFamily: 'Okra-Regular',
  },
  addAddressButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  addAddressButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Okra-Medium',
  },
  cartItemContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 16,
  },
  cartItemRow: {
    flexDirection: 'row',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333333',
    fontFamily: 'Okra-Bold',
  },
  productVariation: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
    fontFamily: 'Okra-Regular',
  },
  productQuantity: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
    fontFamily: 'Okra-Regular',
  },
  itemPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemDiscountedPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Okra-Bold',
  },
  itemOriginalPrice: {
    fontSize: 13,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
    fontFamily: 'Okra-Regular',
  },
  quantityControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 4,
    height: 28,
  },
  quantityControlButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityTextContainer: {
    paddingHorizontal: 8,
  },
  quantityText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333333',
    fontFamily: 'Okra-Medium',
  },
  removeButton: {
    paddingVertical: 4,
  },
  billDetailsContainer: {
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  billDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333333',
    fontFamily: 'Okra-Bold',
  },
  billDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billDetailsLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Okra-Regular',
  },
  billDetailsValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Okra-Medium',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Okra-Bold',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Okra-Bold',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  deliveryAddressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  deliveryAddressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deliveryAddressContent: {
    flex: 1,
  },
  deliveryAddressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Okra-Bold',
  },
  deliveryAddressText: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Okra-Regular',
  },
  changeAddressButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeAddressText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    fontFamily: 'Okra-Medium',
  },
  placeOrderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  totalPriceContainer: {
    flexDirection: 'column',
  },
  totalPriceAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    fontFamily: 'Okra-Bold',
  },
  totalPriceLabel: {
    fontSize: 10,
    color: '#666666',
    fontFamily: 'Okra-Regular',
  },
  paymentMethodContainer: {
    position: 'relative',
    marginHorizontal: 8,
  },
  paymentDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  paymentDropdownText: {
    fontSize: 13,
    color: '#333333',
    marginRight: 4,
    fontFamily: 'Okra-Medium',
  },
  paymentOptionsDropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 4,
    padding: 8,
    marginBottom: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  selectedPaymentOption: {
    backgroundColor: '#F1F8E9',
  },
  paymentOptionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentOptionRadioSelected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  paymentOptionText: {
    fontSize: 13,
    color: '#333333',
    fontFamily: 'Okra-Medium',
  },
  placeOrderButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  placeOrderButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 4,
    fontFamily: 'Okra-Bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#777777',
    marginTop: 20,
    marginBottom: 30,
    fontFamily: 'Okra-Regular',
  },
  continueShoppingButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  continueShoppingText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Okra-Bold',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
});
