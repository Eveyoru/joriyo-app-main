import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { MaterialIcons } from '@expo/vector-icons';

interface AuthRequiredProps {
  children: React.ReactNode;
  message?: string;
}

export function AuthRequired({ children, message = "Please login to access this feature" }: AuthRequiredProps) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // This effect runs when the component mounts to check auth status
    // The actual redirect is handled by AuthGuard in _layout.tsx
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1565C0" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <Image 
            source={require('../assets/images/login-required.png')} 
            style={styles.image}
            resizeMode="contain"
            defaultSource={require('../assets/images/login-required.png')}
          />
          
          <MaterialIcons name="account-circle" size={80} color="#1565C0" style={styles.icon} />
          
          <ThemedText style={styles.title}>Login Required</ThemedText>
          <ThemedText style={styles.message}>{message}</ThemedText>
          
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <ThemedText style={styles.loginButtonText}>Login Now</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  image: {
    width: 200,
    height: 120,
    marginBottom: 20,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1565C0',
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22
  },
  loginButton: {
    backgroundColor: '#1565C0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 12,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  }
}); 