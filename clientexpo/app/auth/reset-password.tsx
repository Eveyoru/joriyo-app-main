import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { resetPassword } from '@/services/api';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  const { email, token } = useLocalSearchParams<{ email: string; token: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formValid, setFormValid] = useState(false);

  // Update form validity when inputs change
  useEffect(() => {
    setFormValid(
      newPassword.length >= 6 && 
      newPassword === confirmPassword
    );
  }, [newPassword, confirmPassword]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please enter both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!email || !token) {
      Alert.alert('Error', 'Missing required information. Please restart the password reset process.');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(email as string, newPassword, token as string);
      
      if (response.success) {
        Alert.alert(
          'Password Reset Successful', 
          'Your password has been reset successfully. Please login with your new password.',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/auth/login')
            }
          ]
        );
      } else {
        Alert.alert('Reset Failed', response.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'An error occurred during password reset. Please try again.');
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
          <ThemedText style={styles.title}>Reset Password</ThemedText>
          <ThemedText style={styles.subtitle}>Create a new password for your account</ThemedText>
        </View>
        
        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
        </View>
        
        {/* Reset Button */}
        <TouchableOpacity 
          style={[styles.resetButton, formValid && styles.resetButtonActive]} 
          onPress={handleResetPassword}
          disabled={loading || !formValid}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.resetButtonText}>Reset Password</ThemedText>
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
  resetButton: {
    backgroundColor: '#A0A0A0',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resetButtonActive: {
    backgroundColor: '#10b981', // Green color when form is valid
  },
  resetButtonText: {
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
