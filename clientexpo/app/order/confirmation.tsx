import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function OrderConfirmationScreen() {
  // Get parameters from the route
  const params = useLocalSearchParams();
  
  // Animation values
  const circleSize = React.useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = React.useRef(new Animated.Value(0)).current;
  const textOpacity = React.useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Start animations in sequence
    Animated.sequence([
      // First grow the circle
      Animated.timing(circleSize, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true
      }),
      // Then show the checkmark
      Animated.timing(checkmarkOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      }),
      // Then show the text
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      })
    ]).start();
    
    // Automatically navigate to success page after animation completes
    const timer = setTimeout(() => {
      // Pass the same params that were passed to this screen
      router.replace({
        pathname: '/order/success',
        params: params
      });
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [params]);
  
  return (
    <ThemedView style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      <View style={styles.animationContainer}>
        <Animated.View 
          style={[
            styles.circle,
            {
              transform: [
                { scale: circleSize }
              ]
            }
          ]}
        >
          <Animated.View style={{ opacity: checkmarkOpacity }}>
            <MaterialIcons name="check" size={80} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
        
        <Animated.View style={{ opacity: textOpacity, marginTop: 40 }}>
          <ThemedText style={styles.confirmationText}>
            Order Confirmed!
          </ThemedText>
        </Animated.View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmationText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    fontFamily: 'Okra-Bold',
    textAlign: 'center',
  }
});
