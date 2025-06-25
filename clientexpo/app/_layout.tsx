import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator, Text } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { CartRedirectProvider } from '@/context/CartRedirectContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomSplashScreen from '@/components/SplashScreen';

// Keep the splash screen visible while we fetch resources
ExpoSplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

// Auth guard component to handle protected routes
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inAdminGroup = segments[0] === 'admin';
    const inUserGroup = segments[0] === 'user' || segments[0] === 'profile';
    
    // Protect these routes - require authentication
    const requiresAuth = inAdminGroup || inUserGroup;
    
    // If it's the first launch and not already in the auth group, redirect to login
    if (isFirstLaunch && !inAuthGroup) {
      setIsFirstLaunch(false);
      router.replace('/auth/login');
      return;
    }
    
    if (!isAuthenticated && requiresAuth) {
      // Redirect to login if not authenticated and trying to access protected routes
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to appropriate page if authenticated but in auth group
      if (user?.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/(tabs)'); // Redirect to tabs layout
      }
    } else if (isAuthenticated && user) {
      // Handle role-based access
      if (inAdminGroup && user.role !== 'ADMIN') {
        router.replace('/(tabs)'); // Redirect non-admin users to tabs
      }
    }
  }, [isAuthenticated, isLoading, segments, user, isFirstLaunch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayout() {
  const colorScheme = useColorScheme();
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  
  // Load Okra fonts from the correct paths
  const [loaded, error] = useFonts({
    'Okra-Regular': require('../assets/fonts/Okra-Regular.ttf'),
    'Okra-Medium': require('../assets/fonts/Okra-Medium.ttf'),
    'Okra-MediumLight': require('../assets/fonts/Okra-MediumLight.ttf'),
    'Okra-Bold': require('../assets/fonts/Okra-Bold.ttf'),
    'Okra-ExtraBold': require('../assets/fonts/Okra-ExtraBold.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Prepare the app
  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make API calls, etc.
        // Wait for fonts to load
        await new Promise(resolve => {
          if (loaded) {
            resolve(true);
          }
        });
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, [loaded]);

  // Handle the custom splash screen finish
  const handleSplashFinish = useCallback(() => {
    setShowCustomSplash(false);
  }, []);

  // This effect runs when appIsReady changes to true
  useEffect(() => {
    if (appIsReady) {
      // Hide the native splash screen
      ExpoSplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  // Show our custom splash screen if needed
  if (showCustomSplash) {
    return <CustomSplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <CartProvider>
          <CartRedirectProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AuthGuard>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="admin" />
                  <Stack.Screen name="cart" />
                  <Stack.Screen name="product/[id]" />
                  <Stack.Screen name="order/details" />
                  <Stack.Screen name="user/addresses" />
                  <Stack.Screen name="user/edit-address" />
                  <Stack.Screen
                    name="vendor"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right'
                    }}
                  />
                  <Stack.Screen
                    name="vendors"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right'
                    }}
                  />
                </Stack>
              </AuthGuard>
            </ThemeProvider>
          </CartRedirectProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default RootLayout;
