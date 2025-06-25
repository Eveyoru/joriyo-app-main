import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Animated, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function OrderSuccessScreen() {
  // Get parameters from the route
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  const totalAmount = params.totalAmount as string;
  const paymentMethod = params.paymentMethod as string;
  
  // Navigation
  const navigation = useNavigation();

  // If there's no order ID, redirect to home
  useEffect(() => {
    if (!orderId) {
      router.replace('/');
    }
  }, [orderId]);

  const handleContinueShopping = () => {
    router.replace('/');
  };

  const handleViewOrder = () => {
    router.push({
      pathname: '/user/orders',
      params: { viewOrderId: orderId }
    } as any);
  };

  if (!orderId) {
    return null; // Return null for immediate redirect
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.replace('/')}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Order Placed</ThemedText>
        <View style={{width: 40}} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successIconCircle}>
            <MaterialIcons name="check" size={60} color="#FFFFFF" />
          </View>
        </View>
        
        {/* Success Message */}
        <ThemedText style={styles.successTitle}>Thank You!</ThemedText>
        <ThemedText style={styles.successMessage}>
          Your order has been placed and is being processed
        </ThemedText>
        
        {/* Order Details Card */}
        <View style={styles.orderDetailsCard}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardHeaderText}>Order Details</ThemedText>
          </View>
          
          <View style={styles.orderDetailRow}>
            <ThemedText style={styles.orderDetailLabel}>Order ID</ThemedText>
            <ThemedText style={styles.orderDetailValue}>{orderId}</ThemedText>
          </View>
          
          <View style={styles.orderDetailRow}>
            <ThemedText style={styles.orderDetailLabel}>Total Amount</ThemedText>
            <ThemedText style={styles.orderDetailValue}>₹{totalAmount}</ThemedText>
          </View>
          
          <View style={styles.orderDetailRow}>
            <ThemedText style={styles.orderDetailLabel}>Payment Method</ThemedText>
            <ThemedText style={styles.orderDetailValue}>
              {paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Online Payment'}
            </ThemedText>
          </View>
        </View>
        
        {/* Delivery Steps Card */}
        <View style={styles.deliveryStepsCard}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardHeaderText}>Delivery Status</ThemedText>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepIconContainer}>
              <MaterialIcons name="check-circle" size={22} color="#4CAF50" />
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Order Confirmed</ThemedText>
              <ThemedText style={styles.stepDescription}>
                Your order has been confirmed
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.stepConnector} />
          
          <View style={styles.stepContainer}>
            <View style={[styles.stepIconContainer, styles.inactiveStep]}>
              <MaterialIcons name="local-shipping" size={22} color="#CCCCCC" />
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={[styles.stepTitle, styles.inactiveStepText]}>Shipping</ThemedText>
              <ThemedText style={[styles.stepDescription, styles.inactiveStepText]}>
                Your order will be shipped soon
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.stepConnector} />
          
          <View style={styles.stepContainer}>
            <View style={[styles.stepIconContainer, styles.inactiveStep]}>
              <MaterialIcons name="home" size={22} color="#CCCCCC" />
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={[styles.stepTitle, styles.inactiveStepText]}>Delivery</ThemedText>
              <ThemedText style={[styles.stepDescription, styles.inactiveStepText]}>
                Your order will be delivered to your doorstep
              </ThemedText>
            </View>
          </View>
        </View>
        
        {/* Help Note */}
        <View style={styles.helpNoteContainer}>
          <MaterialIcons name="info-outline" size={18} color="#666666" />
          <ThemedText style={styles.helpNoteText}>
            Need help with your order? Contact our support team.
          </ThemedText>
        </View>
      </ScrollView>
      
      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.viewOrderButton}
          onPress={handleViewOrder}
        >
          <ThemedText style={styles.viewOrderButtonText}>View Order</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.continueShoppingButton}
          onPress={handleContinueShopping}
        >
          <ThemedText style={styles.continueShoppingButtonText}>Continue Shopping</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginTop: 30,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Okra-Bold',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 120,
    alignItems: 'center',
  },
  successIconContainer: {
    marginTop: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Okra-Bold',
  },
  successMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Okra-Regular',
  },
  orderDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  cardHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Okra-Medium',
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  orderDetailLabel: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Okra-Regular',
  },
  orderDetailValue: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
    fontFamily: 'Okra-Medium',
  },
  deliveryStepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  stepContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  stepConnector: {
    width: 1,
    height: 20,
    backgroundColor: '#EEEEEE',
    marginLeft: 26,
  },
  stepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inactiveStep: {
    backgroundColor: '#F5F5F5',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
    fontFamily: 'Okra-Medium',
  },
  stepDescription: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Okra-Regular',
  },
  inactiveStepText: {
    color: '#999999',
  },
  helpNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    width: '100%',
  },
  helpNoteText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Okra-Regular',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'column',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    elevation: 8,
  },
  viewOrderButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  viewOrderButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Okra-Medium',
  },
  continueShoppingButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueShoppingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Okra-Medium',
  },
});