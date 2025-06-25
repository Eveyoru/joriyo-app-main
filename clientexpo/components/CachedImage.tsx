import React, { useState, useEffect } from 'react';
import { Image, ImageProps, View, ActivityIndicator, Platform, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { getFullImageUrl } from '@/utils/api';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string | null;
  placeholder?: React.ReactNode;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export function CachedImage({ uri, style, placeholder, resizeMode = 'cover', ...props }: CachedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!uri) {
      setImageUrl(null);
      return;
    }

    const secureUrl = getFullImageUrl(uri);
    setImageUrl(secureUrl);
    setHasError(false);
    setIsLoading(true);
  }, [uri]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
  };

  if (!imageUrl || hasError) {
    return placeholder || <View style={[styles.placeholderContainer, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ 
          uri: imageUrl,
          cache: Platform.OS === 'android' ? 'force-cache' : 'reload',
          headers: {
            'Accept': 'image/*',
            'Cache-Control': 'max-age=31536000'
          }
        }}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        resizeMode={resizeMode}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(error) => {
          console.error('Image loading error:', { url: imageUrl, error });
          setHasError(true);
        }}
        {...props}
      />
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator color="#0CAF50" size="small" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  placeholderContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.7)',
  }
});