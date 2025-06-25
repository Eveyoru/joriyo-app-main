import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Image, FlatList, ActivityIndicator, StatusBar, Dimensions } from 'react-native';
import { router } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import { CachedImage } from '@/components/CachedImage';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Category, getCategories, getCategoryIcon } from '@/services/category';
import { CartSummaryBar } from '@/components/CartSummaryBar';
import { getFullImageUrl } from '@/utils/api';

const { width: screenWidth } = Dimensions.get('window');

function CategoryScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => router.push(`/category/${item._id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryImageContainer}>
        <CachedImage
          uri={item.image || ''}
          style={styles.categoryImage}
          resizeMode="contain"
          placeholder={
            <View style={styles.categoryImagePlaceholder}>
              <MaterialIcons name={getCategoryIcon(item) as any} size={28} color="#4CAF50" />
            </View>
          }
        />
      </View>
      <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <ThemedText style={styles.loadingText}>Loading categories...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF6B6B" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            getCategories().then(data => {
              setCategories(data);
              setLoading(false);
            }).catch(err => {
              setError('Failed to load categories');
              setLoading(false);
            });
          }}
        >
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with title and back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <ThemedText style={styles.headerTitle}>All Categories</ThemedText>
        
        <View style={styles.headerRight} />
      </View>
      
      <ThemedText style={styles.subheader}>Find products by category</ThemedText>

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item._id}
        numColumns={3}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <CartSummaryBar />
    </ThemedView>
  );
}

export default CategoryScreen;

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
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Okra-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Okra-Regular',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Okra-Bold',
  },
  header: {
    paddingTop: 27,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Okra-Bold',
    color: '#212121',
  },
  headerRight: {
    width: 36,
  },
  subheader: {
    fontSize: 14,
    fontFamily: 'Okra-Regular',
    color: '#666666',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  listContainer: {
    padding: 12,
  },
  categoryCard: {
    width: (screenWidth - 48) / 3,
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryImage: {
    width: 40,
    height: 40,
  },
  categoryImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#212121',
    fontFamily: 'Okra-Medium',
    maxWidth: 90,
  },
});