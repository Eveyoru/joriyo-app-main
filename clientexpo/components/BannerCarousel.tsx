import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Image, Dimensions, ActivityIndicator, TouchableOpacity, Text, Linking, Platform } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { runOnJS } from 'react-native-reanimated';
import { Banner, getBanners } from '@/services/banner';
import { ThemedView } from './ThemedView';
import { getBaseUrl } from '@/utils/api';
import { CachedImage } from './CachedImage';

const { width: screenWidth } = Dimensions.get('window');

// Component to display pagination dots
const PaginationDots = ({ total, current }: { total: number; current: number }) => {
  if (total <= 1) return null;
  
  return (
    <View style={styles.paginationContainer}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={`dot-${index}`}
          style={[
            styles.paginationDot,
            { backgroundColor: index === current ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)' }
          ]}
        />
      ))}
    </View>
  );
};

// Helper function to ensure image URLs are absolute
const getFullImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return ''; // Return empty string instead of null
  
  // If it's already an absolute URL, return it
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log('Using absolute URL:', imageUrl);
    return imageUrl;
  }
  
  // If it's a relative URL, prepend the base URL
  const baseUrl = getBaseUrl();
  // Remove any leading slash from the image URL to avoid double slashes
  const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
  const fullUrl = `${baseUrl}/${cleanImageUrl}`;
  console.log('Converted relative URL to:', fullUrl);
  return fullUrl;
};

export function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Avoid using ref directly with Reanimated components
  const carouselRef = useRef(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        console.log('BannerCarousel: Fetching real banners from database...');
        setLoading(true);
        setError(null);
        
        const data = await getBanners();
        console.log("BannerCarousel: Fetched banners count:", data.length);
        
        if (data && data.length > 0) {
          // Log the first banner's image URL for debugging
          console.log("First banner image URL:", data[0].image);
          console.log("Full image URL:", getFullImageUrl(data[0].image));
          setBanners(data);
        } else {
          console.log("BannerCarousel: No banners returned from API");
          setError("No banners available");
          setBanners([]);
        }
      } catch (error) {
        console.error('BannerCarousel: Error loading banners:', error);
        setError("Failed to load banners");
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Use useCallback for functions passed to Reanimated components
  const handleIndexChange = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleBannerPress = useCallback((url?: string) => {
    if (url) {
      console.log("Banner link clicked:", url);
      // Open link in device browser
      Linking.openURL(url).catch(err => {
        console.error("Error opening banner link:", err);
      });
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC107" />
      </View>
    );
  }

  if (error || banners.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || "No banners available"}
        </Text>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.carouselContainer}>
        <Carousel
          ref={carouselRef}
          loop
          width={screenWidth - 30}
          height={180}
          autoPlay={banners.length > 1}
          data={banners}
          scrollAnimationDuration={1000}
          autoPlayInterval={5000} // Match web timing (5 seconds)
          onSnapToItem={handleIndexChange}
          renderItem={({ item }: { item: Banner }) => {
            const imageUrl = getFullImageUrl(item.image);
            if (!imageUrl) return (
              <View style={[styles.slide, styles.placeholderContainer]}>
                <ActivityIndicator color="#0CAF50" />
              </View>
            );
            
            return (
              <TouchableOpacity 
                style={styles.slide}
                onPress={() => handleBannerPress(item.url)}
                activeOpacity={item.url ? 0.8 : 1}
              >
                <CachedImage
                  uri={imageUrl}
                  style={styles.image}
                  resizeMode="cover"
                  placeholder={
                    <View style={[styles.image, styles.placeholderContainer]}>
                      <ActivityIndicator color="#0CAF50" />
                    </View>
                  }
                />
              </TouchableOpacity>
            );
          }}
        />
        
        {/* Pagination dots */}
        <PaginationDots total={banners.length} current={currentIndex} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    marginHorizontal: 15,
  },
  carouselContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  slide: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  placeholderContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
