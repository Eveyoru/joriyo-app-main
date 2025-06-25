import React from 'react';
import { View, StyleSheet, Dimensions, ImageBackground } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const SummerBanner = () => {
  return (
    <ImageBackground 
      source={{ uri: 'https://thumbs.dreamstime.com/b/happy-summer-time-land-beach-tropical-landscape-sea-chair-square-banner-poster-template-147278500.jpg' }}
      style={styles.container}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: 180, // Increased height from default
    backgroundColor: '#1565C0', // Fallback color while image loads
  },
});