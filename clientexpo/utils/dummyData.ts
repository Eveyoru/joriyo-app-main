// Dummy product data for the login screen slider
import { Dimensions } from 'react-native';

export const imageData = [
  {
    id: 1,
    image: require('../assets/images/product1.png'),
    title: 'Fresh Vegetables'
  },
  {
    id: 2,
    image: require('../assets/images/product2.png'),
    title: 'Dairy Products'
  },
  {
    id: 3,
    image: require('../assets/images/product3.png'),
    title: 'Snacks & Beverages'
  },
  {
    id: 4,
    image: require('../assets/images/product4.png'),
    title: 'Household Items'
  },
  {
    id: 5,
    image: require('../assets/images/product5.png'),
    title: 'Personal Care'
  },
  {
    id: 6,
    image: require('../assets/images/product6.png'),
    title: 'Fruits & Berries'
  },
  {
    id: 7,
    image: require('../assets/images/product7.png'),
    title: 'Bakery Items'
  },
  {
    id: 8,
    image: require('../assets/images/product8.png'),
    title: 'Frozen Foods'
  },
];

// Utility for scaling dimensions
export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Dimensions.get('window').height;
