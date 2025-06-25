import { useEffect } from 'react';
import { Asset } from 'expo-asset';
import { getFullImageUrl } from '@/utils/api';

export function useImagePreloader(imageUrls: (string | null | undefined)[]) {
  useEffect(() => {
    const preloadImages = async () => {
      if (!imageUrls?.length) return;

      const validUrls = imageUrls
        .filter((url): url is string => typeof url === 'string')
        .map(url => getFullImageUrl(url))
        .filter((url): url is string => url !== null);

      try {
        await Promise.all(
          validUrls.map(url => 
            Asset.fromURI(url).downloadAsync()
          )
        );
        console.log(`Successfully preloaded ${validUrls.length} images`);
      } catch (error) {
        console.error('Error preloading images:', error);
      }
    };

    preloadImages();
  }, [imageUrls]);
}