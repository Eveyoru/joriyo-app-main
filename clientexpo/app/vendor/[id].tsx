import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { Vendor, getVendorById, getProductsByVendor, getActiveVendors } from '@/services/vendor';
import { Product, getProducts } from '@/services/product';
import ProductCard from '@/components/ProductCard';
import { StatusBar } from 'expo-status-bar';
import { CachedImage } from '@/components/CachedImage';

// Get screen width to calculate product card width
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function VendorDetailsScreen() {
  const params = useLocalSearchParams();
  const vendorId = typeof params.id === 'string' ? params.id : '';
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) {
      router.replace('/');
      return;
    }
    
    fetchVendorDetails();
    fetchVendorProducts();
  }, [vendorId]);

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching vendor:', vendorId);
      
      // Add detailed error handling and logging
      if (!vendorId) {
        console.error('No vendor ID provided');
        setError('Vendor ID is missing');
        return;
      }
      
      const vendorData = await getVendorById(vendorId);
      
      if (!vendorData) {
        console.log('No vendor found with direct method, trying alternative fetch');
        try {
          const allVendors = await getActiveVendors();
          console.log(`Found ${allVendors.length} active vendors, looking for match with ID: ${vendorId}`);
          
          const matchingVendor = allVendors.find(v => 
            String(v._id) === String(vendorId)
          );
          
          if (matchingVendor) {
            console.log('Found matching vendor:', matchingVendor.name);
            setVendor(matchingVendor);
          } else {
            console.error('No matching vendor found in active vendors list');
            setError('Vendor not found');
            setTimeout(() => router.replace('/'), 2000);
          }
        } catch (fallbackError) {
          console.error('Fallback vendor fetch error:', fallbackError);
          setError('Failed to load vendor information');
          setTimeout(() => router.replace('/'), 2000);
        }
      } else {
        console.log('Vendor found successfully:', vendorData.name);
        setVendor(vendorData);
      }
    } catch (error) {
      console.error('Vendor fetch error:', error);
      setError('Failed to load vendor');
      setTimeout(() => router.replace('/'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorProducts = async () => {
    try {
      setLoadingProducts(true);
      const productsData = await getProductsByVendor(vendorId);
      
      if (!productsData || productsData.length === 0) {
        const allProducts = await getProducts();
        const filteredProducts = allProducts.filter(p => 
          String(p.vendor) === String(vendorId) || 
          (p.vendor && String(p.vendor._id) === String(vendorId))
        ) as Product[];  // Add explicit type assertion here
        setProducts(filteredProducts);
      } else {
        setProducts(productsData as Product[]); // Add explicit type assertion here
      }
    } catch (error) {
      console.error('Products fetch error:', error);
      setProducts([]); // Set empty array on error
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <ThemedText style={styles.loadingText}>Loading vendor details...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !vendor) {
    return (
      <ThemedView style={styles.errorContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.errorContent}>
          <FontAwesome name="exclamation-circle" size={64} color="#F44336" />
          <ThemedText style={styles.errorText}>{error || 'Vendor not found'}</ThemedText>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={handleBack}
          >
            <ThemedText style={styles.errorButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header - Transparent and positioned over the banner */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{flexDirection: 'row'}}>
          <TouchableOpacity style={[styles.backButton, {marginRight: 10}]}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Vendor Cover/Banner with centered title overlay */}
        <View style={styles.vendorBanner}>
          {vendor.coverImageUrl ? (
            <CachedImage 
              uri={vendor.coverImageUrl}
              style={styles.vendorCoverImage}
              resizeMode="cover"
              placeholder={
                <View style={[styles.vendorCoverPlaceholder]}>
                  <ActivityIndicator color="#0CAF50" />
                </View>
              }
            />
          ) : vendor.imageUrl ? (
            <CachedImage 
              uri={vendor.imageUrl}
              style={styles.vendorCoverImage}
              resizeMode="cover"
              placeholder={
                <View style={[styles.vendorCoverPlaceholder]}>
                  <ActivityIndicator color="#0CAF50" />
                </View>
              }
            />
          ) : (
            <View style={styles.vendorCoverPlaceholder}>
              <FontAwesome name="image" size={32} color="#DDD" />
            </View>
          )}
          
          <View style={styles.titleOverlay}>
            <ThemedText style={styles.vendorName}>{vendor.name}</ThemedText>
          </View>
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <ThemedText style={styles.productsSectionTitle}>
            {vendor.name}
          </ThemedText>
          
          {loadingProducts ? (
            <View style={styles.productsLoadingContainer}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <ThemedText style={styles.loadingText}>Loading products...</ThemedText>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.noProductsContainer}>
              <FontAwesome name="shopping-bag" size={48} color="#DDD" />
              <ThemedText style={styles.noProductsText}>
                No products available from this vendor yet
              </ThemedText>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {/* 3-column grid layout */}
              {chunkArray(products, 3).map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.productRow}>
                  {row.map((product) => (
                    <View key={product._id} style={styles.productCardWrapper}>
                      <ProductCard product={product} />
                    </View>
                  ))}
                  {/* Add empty views for proper spacing if row is not complete */}
                  {row.length < 3 && Array(3 - row.length).fill(0).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.emptyCardSpace} />
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// Helper function to chunk array into groups of size n
const chunkArray = <T extends any>(array: T[], size: number): T[][] => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  vendorBanner: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  vendorCoverImage: {
    width: '100%',
    height: '100%',
  },
  vendorCoverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  categoryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  productsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  productsSectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    marginLeft: 4,
  },
  productsLoadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  noProductsContainer: {
    padding: 30,
    alignItems: 'center',
  },
  noProductsText: {
    marginTop: 12,
    color: '#666666',
    textAlign: 'center',
  },
  productsGrid: {
    paddingBottom: 16,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCardWrapper: {
    width: (SCREEN_WIDTH - 32) / 3,
    height: 'auto',
  },
  emptyCardSpace: {
    width: (SCREEN_WIDTH - 32) / 3,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
