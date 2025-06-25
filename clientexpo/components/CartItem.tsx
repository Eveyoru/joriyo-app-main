import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from './ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { CachedImage } from './CachedImage';
import { useCart } from '@/context/CartContext';
import { router } from 'expo-router';

interface CartItemProps {
  item: {
    product: {
      _id: string;
      name: string;
      price: number;
      image?: string[] | string | { url: string }[];
      imageValue?: string[];
      stock?: number;
      selectedSize?: string;
      selectedVariationId?: string;
      variations?: Array<{
        _id: string;
        size: string;
        price: number;
        stock: number;
      }>;
    };
    quantity: number;
  };
  onRemove: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
}

export function CartItem({ item, onRemove, updateQuantity }: CartItemProps) {
  const [loading, setLoading] = useState(false);
  const { quantity } = item;

  // Get the current variation if it exists
  const getCurrentVariation = () => {
    if (item.product.selectedVariationId && item.product.variations) {
      return item.product.variations.find(v => v._id === item.product.selectedVariationId);
    }
    return null;
  };

  // Get the available stock based on variation or product
  const getAvailableStock = () => {
    const variation = getCurrentVariation();
    if (variation) {
      return variation.stock;
    }
    return item.product.stock || 0;
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      updateQuantity(item.product._id, quantity - 1);
    } else {
      onRemove(item.product._id);
    }
  };

  const handleIncreaseQuantity = () => {
    const availableStock = getAvailableStock();
    if (quantity < availableStock) {
      updateQuantity(item.product._id, quantity + 1);
    } else {
      // Show stock limit message
      Alert.alert('Stock Limit', `Only ${availableStock} items available`);
    }
  };

  const handleProductPress = () => {
    router.push(`/product/${item.product._id}`);
  };

  // Get the current price based on variation or product
  const getCurrentPrice = () => {
    const variation = getCurrentVariation();
    if (variation) {
      return variation.price;
    }
    return item.product.price;
  };

  const getImageUrl = () => {
    if (item.product.imageValue?.[0]) {
      return item.product.imageValue[0];
    }
    if (typeof item.product.image === 'string') {
      return item.product.image;
    }
    if (Array.isArray(item.product.image) && item.product.image[0]) {
      return typeof item.product.image[0] === 'string' 
        ? item.product.image[0] 
        : item.product.image[0].url;
    }
    return null;
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handleProductPress}
      activeOpacity={0.7}
    >
      <CachedImage
        uri={getImageUrl()}
        style={styles.image}
        resizeMode="contain"
        placeholder={
          <View style={[styles.image, styles.imagePlaceholder]}>
            <ActivityIndicator color="#0CAF50" />
          </View>
        }
      />

      <View style={styles.details}>
        <ThemedText style={styles.name} numberOfLines={2}>
          {item.product.name}
        </ThemedText>

        {item.product.selectedSize && (
          <ThemedText style={styles.variation}>
            Size: {item.product.selectedSize}
          </ThemedText>
        )}

        <ThemedText style={styles.price}>
          ₹{getCurrentPrice()}
        </ThemedText>

        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={handleDecreaseQuantity}
          >
            <MaterialIcons name="remove" size={20} color="#4CAF50" />
          </TouchableOpacity>

          <ThemedText style={styles.quantity}>{quantity}</ThemedText>

          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={handleIncreaseQuantity}
          >
            <MaterialIcons name="add" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  variation: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '500',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
    height: 30,
    alignSelf: 'flex-end',
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  quantity: {
    fontSize: 14,
    fontWeight: '500',
  },
});