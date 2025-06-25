import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { forgotPassword } from '@/services/api';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [formValid, setFormValid] = useState(false);

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Update form validity when email changes
  React.useEffect(() => {
    setFormValid(validateEmail(email));
  }, [email]);

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword(email);
      
      if (response.success) {
        Alert.alert(
          'OTP Sent', 
          'Please check your email for the OTP',
          [
            { 
              text: 'OK', 
              onPress: () => router.push({
                pathname: '/auth/verify-otp',
                params: { email }
              })
            }
          ]
        );
      } else {
        Alert.alert('Failed', response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.statusBarPadding} />
      
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/joiryologoicon.jpg')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>
        
        {/* Title */}
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>Forgot Password</ThemedText>
          <ThemedText style={styles.subtitle}>Enter your email to receive a verification code</ThemedText>
        </View>
        
        {/* Form */}
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
        </View>
        
        {/* Send OTP Button */}
        <TouchableOpacity 
          style={[styles.sendOtpButton, formValid && styles.sendOtpButtonActive]} 
          onPress={handleSendOtp}
          disabled={loading || !formValid}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.sendOtpButtonText}>Send Verification Code</ThemedText>
          )}
        </TouchableOpacity>
        
        {/* Login Link */}
        <TouchableOpacity onPress={navigateToLogin} style={styles.loginContainer}>
          <ThemedText style={styles.loginText}>Remember your password? <ThemedText style={styles.loginLink}>Login</ThemedText></ThemedText>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: Constants.statusBarHeight + 10 || 30,
    left: 15,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: '#333333',
  },
  sendOtpButton: {
    backgroundColor: '#A0A0A0',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sendOtpButtonActive: {
    backgroundColor: '#10b981', // Green color when form is valid
  },
  sendOtpButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: 'bold',
  },
});
