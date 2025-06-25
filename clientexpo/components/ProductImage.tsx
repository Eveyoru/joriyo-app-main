import React, { useState } from 'react';
import { Image, ImageProps, StyleSheet, View } from 'react-native';
import { getFullImageUrl } from '@/services/api-helpers';
import { PlaceholderImage } from './PlaceholderImage';

interface ProductImageProps extends Omit<ImageProps, 'source'> {
  imageUrl: string;
  size?: number;
}

const getSecureImageUrl = (url: string) => {
  if (!url) return null;
  // Convert http to https
  return url.replace('http://', 'https://');
};

/**
 * A component to display product images with fallback handling
 */
export function ProductImage({ imageUrl, size = 100, style, ...props }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const secureImageUrl = getSecureImageUrl(imageUrl);
  
  if (!secureImageUrl || hasError) {
    return <PlaceholderImage size={size} />;
  }

  return (
    <Image
      source={{ 
        uri: secureImageUrl,
        cache: 'force-cache' // Add caching
      }}
      style={[{ width: size, height: size }, style]}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
