import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Modal, ActivityIndicator, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ThemedText from './ThemedText';
import { Product, calculateDiscountedPrice } from '@/services/product';
import { getFullImageUrl } from '@/utils/api';
import { useCart } from '@/context/CartContext';
import { CartSummaryBar } from '@/components/CartSummaryBar';

interface ProductVariationModalProps {
  product: Product;
  visible: boolean;
  onClose: () => void;
  onSelectVariation: (variationId: string, size: string) => void;
}

export default function ProductVariationModal({ 
  product, 
  visible, 
  onClose,
  onSelectVariation 
}: ProductVariationModalProps) {
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [addedVariations, setAddedVariations] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Access cart context to handle adding to cart directly
  const { addToCart, getCartItemQuantity, updateQuantity, isInCart } = useCart();
  
  useEffect(() => {
    console.log('ProductVariationModal - visible:', visible);
    console.log('ProductVariationModal - product:', product?.name);
    console.log('ProductVariationModal - variations:', JSON.stringify(product?.variations));
    
    if (product?.variations && product.variations.length > 0) {
      // Find first in-stock variation or default to first variation
      const defaultVariation = product.variations.find(v => v.stock > 0) || product.variations[0];
      setSelectedVariation(defaultVariation);
      console.log('ProductVariationModal - default variation:', defaultVariation?.size);
    }
    
    // Reset added variations when modal opens
    if (visible) {
      // Initialize with current cart state
      const newAddedVariations: Record<string, boolean> = {};
      if (product?.variations) {
        product.variations.forEach(variation => {
          // Check if this variation is in cart
          if (isInCart(product._id, variation._id)) {
            newAddedVariations[variation._id] = true;
          }
        });
      }
      setAddedVariations(newAddedVariations);
      setShowSuccess(false); // Reset success message on open
    }
  }, [product, visible]);

  // This is the key change - ensure we don't close the modal immediately
  useEffect(() => {
    // When the modal becomes visible, reset the success message
    if (visible) {
      setShowSuccess(false);
    }
  }, [visible]);

  const handleVariationSelect = (variation: any) => {
    console.log('Variation selected in modal:', variation.size);
    setSelectedVariation(variation);
  };
  
  // Ensure we're not closing the modal from handleAddVariationToCart
  const handleAddVariationToCart = (variation: any, event?: any) => {
    if (!variation || variation.stock <= 0) return;
    
    try {
      // Prevent any event bubbling
      event?.stopPropagation?.();
      event?.preventDefault?.();
      
      // Ensure price is always valid
      const variationPrice = typeof variation.price === 'string' 
        ? parseFloat(variation.price) 
        : variation.price;
      
      // Create a product with the selected variation
      const productWithVariation = {
        ...product,
        price: variationPrice > 0 ? variationPrice : (product.price || 0),
        stock: variation.stock,
        selectedVariationId: variation._id,
        selectedSize: variation.size
      };
      
      // Add to cart logic
      if (isInCart(product._id, variation._id)) {
        const currentQuantity = getCartItemQuantity(product._id, variation._id);
        updateQuantity(product._id, currentQuantity + 1, variation._id);
      } else {
        addToCart(productWithVariation, 1);
      }
      
      // Update UI
      setAddedVariations(prev => ({
        ...prev,
        [variation._id]: true
      }));
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      // Notify parent component
      onSelectVariation(variation._id, variation.size);
      
      // Important: DO NOT close modal
      console.log(`Added ${product.name} - Size ${variation.size} to cart`);
    } catch (error) {
      console.error('Error adding variation to cart:', error);
      Alert.alert("Error", "Failed to add item to cart");
    }
  };
  
  const getVariationQuantity = (variationId: string) => {
    return getCartItemQuantity(product._id, variationId);
  };

  if (!product || !product.variations) {
    console.log('ProductVariationModal - No product or variations available');
    return null;
  }

  console.log('Rendering modal with variations:', product.variations.length);

  // Get image URL
  const getImageUrl = () => {
    if (!product.image) return null;
    
    if (typeof product.image === 'string') {
      return getFullImageUrl(product.image);
    }
    
    if (Array.isArray(product.image) && product.image.length > 0) {
      const firstImage = product.image[0];
      if (typeof firstImage === 'string') {
        return getFullImageUrl(firstImage);
      }
      if (firstImage && typeof firstImage === 'object' && 'url' in firstImage) {
        return getFullImageUrl(firstImage.url);
      }
    }
    
    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        // Completely empty to prevent any hardware back button from closing the modal
        // Only the X button should close this modal
        return null;
      }}
      hardwareAccelerated={true}
    >
      <View 
        style={styles.modalOverlay}
        onStartShouldSetResponder={() => true}
        onTouchEnd={(e) => {
          // Prevent touches on the overlay from closing the modal
          e.stopPropagation();
        }}
      >
        <View 
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => {
            // Prevent touches on the content from bubbling up
            e.stopPropagation();
          }}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>{product.name}</ThemedText>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                // This is the ONLY place that should close the modal
                onClose();
              }} 
              style={styles.closeButton}
              hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {/* Success notification */}
          {showSuccess && (
            <View style={styles.successNotification}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <ThemedText style={styles.successText}>Added to cart successfully</ThemedText>
            </View>
          )}
          
          {/* Subtitle */}
          <View style={styles.subtitle}>
            <ThemedText style={styles.subtitleText}>Select size</ThemedText>
          </View>
          
          {/* Variations List - Web-like style */}
          <ScrollView style={styles.variationsContainer} contentContainerStyle={styles.variationsContent}>
            {product.variations.map((variation) => {
              const isSelected = selectedVariation && selectedVariation._id === variation._id;
              const isOutOfStock = variation.stock <= 0;
              const hasDiscount = product.discount && product.discount > 0;
              const discountedPrice = hasDiscount 
                ? calculateDiscountedPrice(product, variation.price) 
                : variation.price;
              const isInCart = addedVariations[variation._id];
              const quantity = getVariationQuantity(variation._id);
              
              return (
                <TouchableOpacity
                  key={variation._id}
                  style={[
                    styles.variationRow,
                    isSelected && styles.selectedVariationRow
                  ]}
                  onPress={() => !isOutOfStock && handleVariationSelect(variation)}
                  disabled={isOutOfStock}
                >
                  {/* Product image and size */}
                  <View style={styles.variationLeft}>
                    <Image 
                      source={{ uri: getImageUrl() || 'https://via.placeholder.com/40' }}
                      style={styles.variationImage}
                      resizeMode="contain"
                    />
                    <ThemedText style={[
                      styles.sizeText,
                      isSelected && styles.selectedSizeText
                    ]}>
                      {variation.size}
                    </ThemedText>
                  </View>
                  
                  {/* Price information */}
                  <View style={styles.priceInfo}>
                    <ThemedText style={styles.discountedPrice}>
                      ₹{Math.round(discountedPrice)}
                    </ThemedText>
                    
                    {hasDiscount && (
                      <View style={styles.originalPriceContainer}>
                        <ThemedText style={styles.originalPrice}>
                          ₹{Math.round(variation.price)}
                        </ThemedText>
                        <ThemedText style={styles.discountPercent}>
                          {product.discount}% off
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  
                  {/* Add to cart button or quantity */}
                  <View style={styles.cartActionContainer}>
                    {isInCart && quantity > 0 ? (
                      <View style={styles.quantityContainer}>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            e?.preventDefault?.();
                            if (quantity <= 1) {
                              updateQuantity(product._id, 0, variation._id);
                              setAddedVariations(prev => {
                                const newState = {...prev};
                                delete newState[variation._id];
                                return newState;
                              });
                            } else {
                              updateQuantity(product._id, quantity - 1, variation._id);
                            }
                          }}
                        >
                          <MaterialIcons name="remove" size={16} color="#FFF" />
                        </TouchableOpacity>
                        <View style={styles.quantityTextContainer}>
                          <ThemedText style={styles.quantityText}>{quantity}</ThemedText>
                        </View>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            e?.preventDefault?.();
                            if (variation.stock > quantity) {
                              updateQuantity(product._id, quantity + 1, variation._id);
                            } else {
                              Alert.alert("Stock Limit", `Cannot add more. Stock limit reached (${variation.stock} available)`);
                            }
                          }}
                          disabled={variation.stock <= quantity}
                        >
                          <MaterialIcons name="add" size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.variationAddButton,
                          isOutOfStock && styles.disabledButton
                        ]}
                        activeOpacity={1}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          e?.preventDefault?.();
                          handleAddVariationToCart(variation, e);
                          
                          // IMPORTANT: Return false to prevent any navigation
                          return false;
                        }}
                        disabled={isOutOfStock}
                      >
                        <ThemedText style={styles.variationAddButtonText}>
                          {isOutOfStock ? "Out of Stock" : "ADD"}
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Empty space for cart summary */}
          <View style={styles.cartSummarySpace} />

          {/* Cart Summary Bar */}
          <CartSummaryBar />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '85%', // Increased from 80%
    paddingBottom: 60, // Additional padding for cart summary
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
  },
  variationsContainer: {
    height: 300, // Fixed height for scrollable area
  },
  variationsContent: {
    paddingBottom: 20, // Extra padding at bottom of scrollable content
  },
  variationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  selectedVariationRow: {
    backgroundColor: '#F1F8E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  variationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  variationImage: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginRight: 12,
  },
  sizeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedSizeText: {
    fontWeight: '700',
    color: '#4CAF50',
  },
  priceInfo: {
    alignItems: 'flex-end',
    flex: 1,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  originalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  discountPercent: {
    fontSize: 12,
    color: '#4CAF50',
  },
  cartActionContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  variationAddButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  variationAddButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    overflow: 'hidden',
    height: 30,
  },
  quantityButton: {
    width: 24,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  quantityTextContainer: {
    paddingHorizontal: 6,
    minWidth: 24,
    alignItems: 'center',
  },
  quantityText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.8,
  },
  cartSummarySpace: {
    height: 60, // Space for cart summary bar
  },
  successNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 4,
    marginHorizontal: 16,
    marginTop: 8,
  },
  successText: {
    color: '#4CAF50',
    marginLeft: 8,
    fontSize: 14,
  }
}); 