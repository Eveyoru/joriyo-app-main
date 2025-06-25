import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from './ThemedText';
import { MaterialIcons } from '@expo/vector-icons';

interface SeeAllProductsBarProps {
  onPress: () => void;
  categoryImages?: string[];
  title?: string;
}

const SeeAllProductsBar = ({ 
  onPress, 
  categoryImages = [], 
  title = "See all products" 
}: SeeAllProductsBarProps) => {
  // Use up to 2 images for the horizontal layout
  const displayImages = categoryImages.slice(0, 2);
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        {/* Display product images if available */}
        {displayImages.length > 0 ? (
          <View style={styles.imagesContainer}>
            {displayImages.map((imageUrl, index) => (
              <Image 
                key={index}
                source={{ uri: imageUrl }} 
                style={[styles.productImage, index > 0 && { marginLeft: 4 }]}
                resizeMode="contain"
              />
            ))}
          </View>
        ) : (
          // Fallback icon if no images - using MaterialIcons
          <View style={styles.iconContainer}>
            <MaterialIcons name="shopping-bag" size={24} color="#4CAF50" />
          </View>
        )}
        
        <ThemedText style={styles.text}>{title}</ThemedText>
        <MaterialIcons name="chevron-right" size={20} color="#5A5A5A" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagesContainer: {
    flexDirection: 'row',
    marginRight: 12,
  },
  productImage: {
    width: 32,
    height: 32,
    borderRadius: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Okra-Medium',
    color: '#5A5A5A',
    marginRight: 'auto',
  }
});

export default SeeAllProductsBar;
