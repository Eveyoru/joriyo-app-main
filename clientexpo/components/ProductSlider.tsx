import React, { useMemo } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
// @ts-ignore - Fixing TypeScript issues with expo-linear-gradient
import { LinearGradient } from 'expo-linear-gradient';
import AutoScroll from '@homielab/react-native-auto-scroll';

const { width: screenWidth } = Dimensions.get('window');

// Product images from assets/products folder
const productImages = [
  require('../assets/products/1.png'),
  require('../assets/products/2.png'),
  require('../assets/products/3.png'),
  require('../assets/products/4.png'),
  require('../assets/products/5.png'),
  require('../assets/products/6.png'),
  require('../assets/products/7.png'),
  require('../assets/products/8.png'),
  require('../assets/products/9.png'),
  require('../assets/products/10.png'),
  require('../assets/products/11.png'),
  require('../assets/products/12.png'),
  require('../assets/products/13.png'),
  require('../assets/products/14.png'),
  require('../assets/products/15.png'),
  require('../assets/products/16.png'),
];

interface RowProps {
  row: any[];
  rowIndex: number;
}

const ProductSlider = () => {
  // Create rows of products for the slider
  const rows = useMemo(() => {
    const result: any[][] = [];
    for (let i = 0; i < productImages.length; i += 4) {
      result.push(productImages.slice(i, i + 4));
    }
    return result;
  }, []);

  return (
    <View style={styles.container}>
      <View pointerEvents="none">
        <AutoScroll 
          style={styles.autoScroll} 
          endPaddingWidth={0} 
          duration={10000}
        >
          <View style={styles.gridContainer}>
            {rows.map((row, rowIndex) => (
              <Row key={rowIndex} row={row} rowIndex={rowIndex} />
            ))}
          </View>
        </AutoScroll>
      </View>
      
      {/* Gradient fade at the bottom */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,1)']}
        style={styles.fadeGradient}
      />
    </View>
  );
};

const Row: React.FC<RowProps> = ({ row, rowIndex }) => {
  return (
    <View style={styles.row}>
      {row.map((image, imageIndex: number) => {
        const horizontalShift = rowIndex % 2 === 0 ? -15 : 15; 
        return (
          <View 
            key={imageIndex} 
            style={[styles.itemContainer, { transform: [{ translateX: horizontalShift }] }]}
          >
            <Image source={image} style={styles.image} resizeMode="contain" />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  itemContainer: {
    marginBottom: 8, 
    marginHorizontal: 8, 
    width: screenWidth * 0.24, 
    height: screenWidth * 0.24, 
    backgroundColor: '#e9f7f8',
    justifyContent: 'center',
    borderRadius: 20, 
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  autoScroll: {
    position: 'relative',
    height: screenWidth * 0.75, 
    marginTop: 5, 
  },
  gridContainer: {
    justifyContent: 'center',
    overflow: 'visible',
    alignItems: 'center'
  },
  row: {
    flexDirection: "row",
    marginBottom: 6 
  },
  fadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60, 
    zIndex: 1,
  }
});

export default ProductSlider;
