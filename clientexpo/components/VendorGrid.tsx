import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { Vendor, getActiveVendors, getAllVendorsWithFallbacks } from '@/services/vendor';
import { ThemedText } from './ThemedText';
import { FontAwesome } from '@expo/vector-icons';

type VendorGridProps = {
  title?: string;
  maxItems?: number;
  showViewAll?: boolean;
  onPressViewAll?: () => void;
};

const VendorGrid = ({ 
  title = "Our Vendors", 
  maxItems = 6, 
  showViewAll = true,
  onPressViewAll 
}: VendorGridProps) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await getAllVendorsWithFallbacks();
      
      if (data.length === 0) {
        console.log('No vendors found with fallbacks, trying direct active vendors endpoint');
        const activeVendors = await getActiveVendors();
        if (activeVendors.length > 0) {
          setVendors(activeVendors);
          return;
        }
      }
      
      setVendors(data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setError('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorPress = (vendor: Vendor) => {
    console.log('Navigating to vendor:', vendor._id);
    router.push({
      pathname: '/vendor/[id]',
      params: { id: vendor._id }
    });
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity
      style={styles.vendorCard}
      onPress={() => handleVendorPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.vendorImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <FontAwesome name="shopping-bag" size={24} color="#DDD" />
          </View>
        )}
      </View>
      <View style={styles.vendorInfo}>
        <ThemedText style={styles.vendorName} numberOfLines={1}>
          {item.name}
        </ThemedText>
        {item.description && (
          <ThemedText style={styles.vendorDescription} numberOfLines={2}>
            {item.description}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <ThemedText style={styles.loadingText}>Loading vendors...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-circle" size={24} color="#F44336" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </View>
    );
  }

  if (vendors.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome name="shopping-bag" size={24} color="#CCC" />
        <ThemedText style={styles.emptyText}>No vendors available</ThemedText>
      </View>
    );
  }

  // Limit the number of vendors shown if maxItems is provided
  const displayVendors = maxItems ? vendors.slice(0, maxItems) : vendors;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {showViewAll && (
          <TouchableOpacity onPress={onPressViewAll}>
            <ThemedText style={styles.viewAllText}>See All</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={displayVendors}
        renderItem={renderVendorItem}
        keyExtractor={item => item._id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        style={styles.listContainer}
        contentContainerStyle={{ paddingBottom: 16 }}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4A90E2',
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  vendorCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    /* Remove border */
    borderWidth: 0,
    /* Remove shadow effects to match main app style */
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  imageContainer: {
    height: 150,
    width: '100%',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  vendorInfo: {
    padding: 10,
    paddingTop: 8,
  },
  vendorName: {
    fontSize: 13,
    fontFamily: 'Okra-Bold',
    color: '#212121',
    lineHeight: 18,
    marginBottom: 4,
  },
  vendorDescription: {
    fontSize: 12,
    fontFamily: 'Okra-Regular',
    color: '#666666',
    marginBottom: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    color: '#F44336',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#666',
  },
});

export default VendorGrid;