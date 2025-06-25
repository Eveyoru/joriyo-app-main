import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { verifyEmail } from '@/services/api';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyEmail = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email information is missing. Please go back to the registration screen.');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyEmail(email as string, otp);
      
      if (response.success) {
        Alert.alert(
          'Email Verified', 
          'Your email has been verified successfully. Please login to continue.',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/auth/login')
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      Alert.alert('Error', 'An error occurred during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Binkeyit</ThemedText>
      
      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle" style={styles.verifyText}>Verify Email</ThemedText>
        
        <ThemedText style={styles.emailInfo}>
          We've sent a verification code to {email}
        </ThemedText>

        <ThemedText style={styles.label}>Enter OTP</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Enter OTP from your email"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
        />

        <TouchableOpacity 
          style={styles.verifyButton} 
          onPress={handleVerifyEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.verifyButtonText}>Verify Email</ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={navigateToRegister} style={styles.resendContainer}>
          <ThemedText style={styles.resendText}>Didn't receive code? Resend</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  verifyText: {
    fontSize: 20,
    marginBottom: 20,
  },
  emailInfo: {
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
});
