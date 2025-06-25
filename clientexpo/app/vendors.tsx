import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { Vendor, getActiveVendors } from '@/services/vendor';
import VendorGrid from '@/components/VendorGrid';

export default function AllVendorsScreen() {
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    router.back();
  };

  const navigateToVendor = (vendor: Vendor) => {
    console.log('Navigating to vendor from vendors page:', vendor._id);
    router.push({
      pathname: '/vendor/[id]',
      params: { id: vendor._id }
    });
  };

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
        <ThemedText style={styles.headerTitle}>All Vendors</ThemedText>
        <View style={styles.placeholderIcon} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Full height vendor grid with no limits */}
        <VendorGrid 
          title="" 
          maxItems={100} 
          showViewAll={false}
        />
      </ScrollView>
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
  },
});