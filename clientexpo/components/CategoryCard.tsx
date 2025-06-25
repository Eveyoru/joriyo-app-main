import React from 'react';
import { StyleSheet, TouchableOpacity, Image, View, ImageSourcePropType } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ThemedText from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getFullImageUrl } from '@/utils/api';
import { CachedImage } from './CachedImage';

interface CategoryCardProps {
  id: string;
  name: string;
  imageUrl?: string;
  icon?: string;
  onPress?: () => void;
}

export function CategoryCard({ id, name, imageUrl, icon, onPress }: CategoryCardProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <CachedImage
            uri={imageUrl}
            style={styles.image}
            resizeMode="contain"
            placeholder={
              <View style={[styles.image, styles.placeholderContainer]}>
                <MaterialIcons 
                  name={(icon as any) || 'category'} 
                  size={28} 
                  color={tintColor} 
                />
              </View>
            }
          />
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: tintColor + '20' }]}>
            <MaterialIcons name={(icon as any) || 'category'} size={30} color={tintColor} />
          </View>
        )}
      </View>
      <ThemedText style={styles.name} numberOfLines={2}>
        {name}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 100,
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  name: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
