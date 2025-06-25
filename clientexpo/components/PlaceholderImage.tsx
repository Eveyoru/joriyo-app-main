import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';

interface PlaceholderImageProps {
  size?: number;
  iconSize?: number;
  text?: string;
}

/**
 * A component to display when product images fail to load
 */
export function PlaceholderImage({ size = 100, iconSize = 40, text = 'No Image' }: PlaceholderImageProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <MaterialIcons name="image-not-supported" size={iconSize} color="#aaa" />
      <ThemedText style={styles.text}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  text: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});
