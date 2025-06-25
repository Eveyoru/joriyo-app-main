import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Image } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getUserOrders, getOrderDetails } from '@/services/api';
import { AuthRequired } from '@/components/AuthRequired';

// Order and order item interfaces
interface OrderProduct {
  _id: string;
  name: string;
  image: string[];
  quantity: number;
  price: number;
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

// Helper function to format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Get params if any
  const params = useLocalSearchParams();
  const viewOrderId = params.viewOrderId as string;

  // Fetch orders on mount and when viewOrderId changes
  useEffect(() => {
    fetchOrders();
  }, []);

  // Function to get status details based on status string
  const getStatusDetails = (status) => {
    const statusKey = status?.toUpperCase().replace(/ /g, '_') || 'PROCESSING';
    return ORDER_STATUS[statusKey] || ORDER_STATUS.PROCESSING;
  };

  // Function to render status icon
  const renderStatusIcon = (status) => {
    const statusDetails = getStatusDetails(status);
    
    if (statusDetails.iconType === 'font-awesome-5') {
      return (
        <FontAwesome5 
          name={statusDetails.icon} 
          size={16} 
          color={statusDetails.color} 
        />
      );
    } else {
      return (
        <Feather 
          name={statusDetails.icon} 
          size={16} 
          color={statusDetails.color} 
        />
      );
    }
  };

  // Fetch user orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserOrders();
      
      if (response.success) {
        setOrders(response.data);
        
        // If viewOrderId exists, find and select that order
        if (viewOrderId) {
          const order = response.data.find(o => o._id === viewOrderId || o.orderId === viewOrderId);
          if (order) {
            setSelectedOrder(order);
            setShowOrderDetails(true);
          }
        }
      } else {
        setError(response.message || 'Failed to load orders');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh functionality
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Handle order selection
  const handleViewOrderDetails = (order: Order) => {
    router.push(`/order/details?orderId=${order.orderId}`);
  };

  // Calculate order total
  const calculateTotal = (order: Order) => {
    return order.totalAmt.toLocaleString('en-IN');
  };

  // Render each order item in the list
  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusDetails = getStatusDetails(item.status);
    const formattedDate = formatDate(item.createdAt);
    const totalItems = item.products.reduce((total, product) => total + product.quantity, 0);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleViewOrderDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <ThemedText style={styles.orderIdLabel}>Order ID</ThemedText>
            <ThemedText style={styles.orderId}>
              #{item.orderId}
            </ThemedText>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusDetails.color}15` }]}>
              {renderStatusIcon(item.status)}
              <ThemedText style={[styles.statusText, { color: statusDetails.color }]}>
                {statusDetails.label}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.dateContainer}>
          <Feather name="calendar" size={14} color="#666" />
          <ThemedText style={styles.date}>{formattedDate}</ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderDetails}>
          <View style={styles.itemsSummary}>
            <ThemedText style={styles.itemCount}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </ThemedText>
          </View>
          <View style={styles.priceSummary}>
            <ThemedText style={styles.totalPrice}>₹{calculateTotal(item)}</ThemedText>
            <ThemedText style={styles.paymentMethod}>{item.payment_status === 'paid' ? 'PAID' : 'CASH ON DELIVERY'}</ThemedText>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.viewDetailsButton}
          onPress={() => handleViewOrderDetails(item)}
        >
          <ThemedText style={styles.viewDetailsText}>View Details</ThemedText>
          <MaterialIcons name="chevron-right" size={18} color="#4A90E2" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <AuthRequired message="Please login to view your orders">
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>My Orders</ThemedText>
          <View style={styles.placeholderIcon} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <ThemedText style={styles.loadingText}>Loading your orders...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#F44336" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchOrders}
            >
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image 
              source={require('../../assets/images/empty-order.png')} 
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <ThemedText style={styles.emptyTitle}>No Orders Yet</ThemedText>
            <ThemedText style={styles.emptyText}>
              Looks like you haven't placed any orders yet.
            </ThemedText>
            <TouchableOpacity 
              style={styles.shopNowButton}
              onPress={() => router.push('/(tabs)')}
            >
              <ThemedText style={styles.shopNowButtonText}>Start Shopping</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4A90E2']}
                tintColor="#4A90E2"
              />
            }
          />
        )}
      </ThemedView>
    </AuthRequired>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
  errorText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopNowButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shopNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#888888',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 12,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsSummary: {
    flex: 1,
  },
  itemCount: {
    fontSize: 14,
    color: '#555555',
  },
  priceSummary: {
    alignItems: 'flex-end',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    marginRight: 4,
  },
}); 