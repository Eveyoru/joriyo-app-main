import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Image, KeyboardAvoidingView, Dimensions, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import ProductSlider from '@/components/ProductSlider';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { fromAddToCart } = useLocalSearchParams();
  const [formValid, setFormValid] = useState(false);

  useEffect(() => {
    // Check if both email and password are filled
    setFormValid(email.trim().length > 0 && password.trim().length > 0);
  }, [email, password]);

  const handleContinue = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login with:', email, password);
      const success = await login(email, password);
      if (!success) {
        Alert.alert('Login Failed', 'Please check your email and password');
      }
      // On success, the AuthContext will automatically navigate to the appropriate dashboard
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Error', `An error occurred during login: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  const handleSkip = () => {
    // Navigate to the main app without login
    router.push('/(tabs)');
  };

  const handleBack = () => {
    // Go back to previous screen
    router.back();
  };

  const handleForgotPassword = () => {
    // Navigate to forgot password screen
    router.push('/auth/forgot-password');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.statusBarPadding} />
      
      {/* Back button if coming from add to cart */}
      {fromAddToCart && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      )}
      
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <View style={styles.skipButtonCircle}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </View>
      </TouchableOpacity>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Product Grid */}
        <View style={styles.productGrid}>
          <ProductSlider />
        </View>
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/joiryologoicon.jpg')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>
        
        {/* App Title */}
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>Nepal's Most Convenient App</ThemedText>
          <ThemedText style={styles.subtitle}>Log In or Sign Up</ThemedText>
        </View>
        
        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          {/* Forgot Password */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
            <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Continue Button */}
        <TouchableOpacity 
          style={[styles.continueButton, formValid && styles.continueButtonActive]} 
          onPress={handleContinue}
          disabled={loading || !formValid}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
          )}
        </TouchableOpacity>
        
        {/* Sign Up Link */}
        <TouchableOpacity onPress={navigateToRegister} style={styles.signupContainer}>
          <ThemedText style={styles.signupText}>Don't have an account? <ThemedText style={styles.signupLink}>Sign Up</ThemedText></ThemedText>
        </TouchableOpacity>
        
        {/* Terms */}
        <View style={styles.termsContainer}>
          <ThemedText style={styles.termsText}>By continuing, you agree to our Terms of service & Privacy policy</ThemedText>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  statusBarPadding: {
    height: Constants.statusBarHeight || 20,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  backButton: {
    position: 'absolute',
    top: Constants.statusBarHeight + 10 || 30,
    left: 15,
    zIndex: 10,
  },
  skipButton: {
    position: 'absolute',
    top: Constants.statusBarHeight + 10 || 30,
    right: 15,
    zIndex: 10,
  },
  skipButtonCircle: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  skipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  productGrid: {
    height: height * 0.42, 
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 70, 
    height: 70,
    borderRadius: 18,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 15, 
  },
  title: {
    fontSize: 22, 
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 14, 
    color: '#666666',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 15, 
  },
  inputContainer: {
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 45, 
    justifyContent: 'center',
  },
  input: {
    fontSize: 15, 
    color: '#333333',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 3, 
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 13, 
  },
  continueButton: {
    backgroundColor: '#A0A0A0',
    borderRadius: 8,
    height: 45, 
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 12, 
  },
  continueButtonActive: {
    backgroundColor: '#10b981', 
  },
  continueButtonText: {
    color: 'white',
    fontSize: 15, 
    fontWeight: 'bold',
  },
  signupContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: 'bold',
  },
  termsContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 10, 
  },
  termsText: {
    fontSize: 11, 
    color: '#999999',
    textAlign: 'center',
  },
});
