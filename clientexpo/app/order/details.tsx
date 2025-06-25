import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons, Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { getOrderDetails, getAuthToken } from '@/services/api';
import { getBaseUrl } from '@/utils/api';
import { CachedImage } from '@/components/CachedImage';

// Order and order item interfaces
interface OrderProduct {
  _id: string;
  name: string;
  image: string[];
  quantity: number;
  price: number;
  selectedSize?: string;
  variationId?: string;
}

interface Order {
  _id: string;
  orderId: string;
  userId: string;
  products: OrderProduct[];
  paymentId: string;
  payment_status: string;
  status: string;
  delivery_address: any;
  subTotalAmt: number;
  totalAmt: number;
  createdAt: string;
  updatedAt: string;
}

// Order status types and colors
const ORDER_STATUS = {
  PLACED: {
    label: 'Order Placed',
    color: '#FF9800',
    icon: 'shopping-bag',
    iconType: 'feather'
  },
  CONFIRMED: {
    label: 'Order Confirmed',
    color: '#4A90E2',
    icon: 'check-circle',
    iconType: 'feather'
  },
  PROCESSING: {
    label: 'Processing',
    color: '#9C27B0',
    icon: 'package',
    iconType: 'feather'
  },
  SHIPPED: {
    label: 'On the way',
    color: '#673AB7',
    icon: 'truck',
    iconType: 'font-awesome-5'
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for delivery',
    color: '#00BCD4',
    icon: 'shipping-fast',
    iconType: 'font-awesome-5'
  },
  DELIVERED: {
    label: 'Delivered',
    color: '#4CAF50',
    icon: 'check-circle',
    iconType: 'feather'
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#F44336',
    icon: 'x-circle',
    iconType: 'feather'
  },
  RETURNED: {
    label: 'Returned',
    color: '#795548',
    icon: 'rotate-ccw',
    iconType: 'feather'
  }
};

export default function OrderDetailsScreen() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get the order ID from URL params
  const params = useLocalSearchParams();
  // Get orderId from params.id (might be MongoDB _id) or params.orderId (the actual order ID string)
  const paramId = params.id as string;
  const paramOrderId = params.orderId as string;
  const orderId = paramOrderId || paramId;

  useEffect(() => {
    if (!orderId) {
      Alert.alert('Error', 'Order ID is missing');
      router.back();
      return;
    }
    
    fetchOrderDetails();
  }, [orderId]);

  // Function to get status details based on status string
  const getStatusDetails = (status: string) => {
    const statusKey = status?.toUpperCase().replace(/ /g, '_') || 'PROCESSING';
    return ORDER_STATUS[statusKey as keyof typeof ORDER_STATUS] || ORDER_STATUS.PROCESSING;
  };

  // Function to render status icon
  const renderStatusIcon = (status: string, size = 16) => {
    const statusDetails = getStatusDetails(status);
    
    if (statusDetails.iconType === 'font-awesome-5') {
      return (
        <FontAwesome5 
          name={statusDetails.icon} 
          size={size} 
          color={statusDetails.color} 
        />
      );
    } else {
      return (
        <Feather 
          name={statusDetails.icon as any} 
          size={size} 
          color={statusDetails.color} 
        />
      );
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching order details for ID:', orderId);
      
      // Use the API service function which handles authorization correctly
      const response = await getOrderDetails(orderId);
      console.log('Order details response:', JSON.stringify(response));
      
      if (!response || response.error || !response.success) {
        const errorMsg = response?.message || 'Failed to fetch order details';
        console.error('API error:', errorMsg);
        setError(errorMsg);
        return;
      }
      
      // Check if we have a valid order object
      if (!response.data || !response.data.orderId) {
        console.error('Invalid order data received:', JSON.stringify(response.data || {}));
        setError('Order data is invalid or incomplete');
        return;
      }
      
      // Process products array, ensuring all items are properly formatted
      let products = [];
      if (Array.isArray(response.data.products)) {
        products = response.data.products.map((product: any) => {
          if (!product) return null;
          
          // Extract product details - check if product_details exists
          const productDetails = product.product_details || product;
          
          // Get image from the correct location based on DB structure
          let imageUrl = null;
          if (productDetails.image && Array.isArray(productDetails.image) && productDetails.image.length > 0) {
            // Use first image URL from array
            imageUrl = productDetails.image[0];
          }
          
          // If no image from product_details, check if there's a direct URL in the product
          if (!imageUrl && product.image) {
            imageUrl = typeof product.image === 'string' ? product.image : null;
          }
          
          // Calculate individual product price if not directly available
          // For orders, the price might be stored per item or as a total
          let productPrice = 0;
          
          // Try to get price from different possible locations
          if (typeof product.price === 'number' && product.price > 0) {
            productPrice = product.price;
          } else if (typeof productDetails.price === 'number' && productDetails.price > 0) {
            productPrice = productDetails.price;
          } else if (product.subtotal) {
            // If there's a subtotal field, use that divided by quantity
            productPrice = product.subtotal / (product.quantity || 1);
          }
          
          // Extract size information from the product
          let size = null;
          
          // Check all possible locations where size could be stored
          if (product.selectedSize) {
            size = product.selectedSize;
          } else if (product.size) {
            size = product.size;
          } else if (productDetails.selectedSize) {
            size = productDetails.selectedSize;
          } else if (product.variationId && productDetails.variations) {
            // Try to find the variation by ID and get its size
            const variation = productDetails.variations.find((v: any) => 
              v._id === product.variationId || v._id.toString() === product.variationId.toString()
            );
            if (variation && variation.size) {
              size = variation.size;
            }
          }
          
          return {
            ...product,
            // Use product_details fields if available, otherwise use direct properties
            _id: product._id || productDetails._id || `temp-${Math.random().toString(36).substring(7)}`,
            name: productDetails.name || product.name || 'Unknown Product',
            price: productPrice,
            quantity: typeof product.quantity === 'number' ? product.quantity : 1,
            image: imageUrl,
            selectedSize: size,
            variationId: product.variationId
          };
        }).filter(Boolean); // Remove null items
      }
      
      // Ensure order data is fully sanitized
      const orderData = {
        ...response.data,
        products: products,
        status: response.data.status || 'processing',
        payment_status: response.data.payment_status || 'Cash on Delivery',
        createdAt: response.data.createdAt || new Date().toISOString(),
        updatedAt: response.data.updatedAt || new Date().toISOString()
      };
      
      // If we have zero prices but non-zero total, try to distribute prices
      const totalProducts = orderData.products.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0);
      const hasZeroPrices = orderData.products.every((p: any) => p.price === 0);
      
      if (hasZeroPrices && totalProducts > 0 && orderData.totalAmt > 0) {
        console.log('Calculating prices from total amount');
        // Distribute total amount among products based on quantity
        orderData.products = orderData.products.map((product: any) => {
          // Calculate price per unit based on total quantity and amount
          const pricePerUnit = orderData.totalAmt / totalProducts;
          return {
            ...product,
            price: pricePerUnit
          };
        });
      }
      
      setOrder(orderData);
    } catch (err) {
      console.error('Order details fetch error:', err);
      setError('An error occurred while fetching order details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to format currency values
  const formatCurrency = (value: any): string => {
    if (value === undefined || value === null) return '₹0.00';
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? '₹0.00' : `₹${parsed.toLocaleString('en-IN')}`;
    }
    return typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : '₹0.00';
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <ThemedText style={styles.loadingText}>Loading order details...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !order) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Feather name="alert-circle" size={64} color="#F44336" />
        <ThemedText style={styles.errorText}>{error || 'Order not found'}</ThemedText>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={handleBack}
        >
          <ThemedText style={styles.errorButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const statusDetails = getStatusDetails(order.status);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Order Details</ThemedText>
        <View style={styles.placeholderIcon} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <ThemedText style={styles.orderIdText}>
              #{order.orderId}
            </ThemedText>
            <ThemedText style={styles.orderDateText}>
              {formatDate(order.createdAt)}
            </ThemedText>
          </View>

          <View style={styles.statusTimeline}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusDetails.color}15` }]}>
              {renderStatusIcon(order.status, 20)}
              <ThemedText style={[styles.statusText, { color: statusDetails.color }]}>
                {statusDetails.label}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Items in this order</ThemedText>
          
          {order.products && Array.isArray(order.products) && order.products.length > 0 ? (
            order.products.map((product, index) => {
              // Handle image source properly
              let imageSource = { uri: 'https://via.placeholder.com/100' };
              if (product.image && typeof product.image === 'string') {
                imageSource = { uri: product.image };
              } else if (product.image && Array.isArray(product.image) && product.image.length > 0) {
                imageSource = { uri: product.image[0] };
              }

              return (
                <View key={`product-${product._id || index}`} style={styles.productCard}>
                  <CachedImage 
                    uri={imageSource.uri}
                    style={styles.productImage} 
                    resizeMode="cover"
                    placeholder={
                      <View style={[styles.productImage, styles.productImagePlaceholder]}>
                        <ActivityIndicator color="#0CAF50" />
                      </View>
                    }
                  />
                  <View style={styles.productDetails}>
                    <ThemedText style={styles.productName}>{product.name || 'Unnamed Product'}</ThemedText>
                    
                    {/* Show size information only if available and not empty string and if the product has variations */}
                    {product.selectedSize && 
                     product.selectedSize.trim() !== '' && 
                     product.variationId && (
                      <ThemedText style={styles.productSize}>
                        Size: <ThemedText style={styles.sizeValue}>{product.selectedSize}</ThemedText>
                      </ThemedText>
                    )}
                    
                    <View style={styles.productPriceRow}>
                      <ThemedText style={styles.productPrice}>{formatCurrency(product.price)}</ThemedText>
                      <ThemedText style={styles.productQuantity}>Qty: {product.quantity || 0}</ThemedText>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyProducts}>
              <Feather name="package" size={48} color="#CCCCCC" />
              <ThemedText style={styles.emptyProductsText}>No items in this order</ThemedText>
            </View>
          )}
        </View>

        {/* Shipping Details */}
        {order.delivery_address && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Delivery Address</ThemedText>
            
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.addressIconContainer}>
                  <Feather name="map-pin" size={16} color="#FFFFFF" />
                </View>
                <ThemedText style={styles.addressType}>Delivery Address</ThemedText>
              </View>
              
              <View style={styles.addressDetails}>
                <ThemedText style={styles.addressLine}>
                  {order.delivery_address.address_line || 'No address provided'}
                </ThemedText>
                <ThemedText style={styles.addressCity}>
                  {order.delivery_address.city || ''}{order.delivery_address.city ? ', ' : ''}
                  {order.delivery_address.state || ''}{order.delivery_address.state ? ' - ' : ''}
                  {order.delivery_address.pincode || ''}
                </ThemedText>
                <View style={styles.addressPhoneRow}>
                  <Feather name="phone" size={14} color="#666" />
                  <ThemedText style={styles.addressPhone}>
                    {order.delivery_address.mobile || 'Not provided'}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Payment Details */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Payment Details</ThemedText>
          
          <View style={styles.paymentCard}>
            <View style={styles.paymentMethodRow}>
              <ThemedText style={styles.paymentLabel}>Payment Method</ThemedText>
              <View style={styles.paymentMethodBadge}>
                <Feather 
                  name={order.payment_status.toLowerCase().includes('cash') ? 'dollar-sign' : 'credit-card'} 
                  size={14} 
                  color="#4A90E2"
                />
                <ThemedText style={styles.paymentMethodText}>
                  {order.payment_status || 'N/A'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <ThemedText style={styles.priceLabel}>Price ({order.products?.length || 0} items)</ThemedText>
                <ThemedText style={styles.priceValue}>{formatCurrency(order.subTotalAmt)}</ThemedText>
              </View>
              
              <View style={styles.priceRow}>
                <ThemedText style={styles.priceLabel}>Delivery Charges</ThemedText>
                <ThemedText style={[
                  styles.priceValue, 
                  order.totalAmt && order.subTotalAmt && order.totalAmt - order.subTotalAmt <= 0 ? styles.freeText : {}
                ]}>
                  {order.totalAmt && order.subTotalAmt && order.totalAmt - order.subTotalAmt > 0
                    ? formatCurrency(order.totalAmt - order.subTotalAmt)
                    : 'FREE'}
                </ThemedText>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>Total Amount</ThemedText>
                <ThemedText style={styles.totalValue}>{formatCurrency(order.totalAmt)}</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  productImagePlaceholder: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
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
    color: '#666666',
    textAlign: 'center',
    marginVertical: 20,
  },
  errorButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  placeholderIcon: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statusHeader: {
    marginBottom: 16,
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
  },
  orderDateText: {
    fontSize: 13,
    color: '#666666',
  },
  statusTimeline: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  productCard: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  productSize: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  sizeValue: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  productPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  productQuantity: {
    fontSize: 13,
    color: '#666666',
  },
  emptyProducts: {
    alignItems: 'center',
    padding: 24,
  },
  emptyProductsText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  addressCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  addressIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addressType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  addressDetails: {
    padding: 12,
  },
  addressLine: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  addressCity: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  addressPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressPhone: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
  },
  paymentCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666666',
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  paymentMethodText: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '500',
    marginLeft: 4,
  },
  priceBreakdown: {
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666666',
  },
  priceValue: {
    fontSize: 14,
    color: '#333333',
  },
  freeText: {
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
});