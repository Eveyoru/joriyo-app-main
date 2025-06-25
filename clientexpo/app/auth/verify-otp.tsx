import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { verifyForgotPasswordOtp, resendOtp } from '@/services/api';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [formValid, setFormValid] = useState(false);

  // Update form validity when OTP changes
  useEffect(() => {
    setFormValid(otp.length >= 4);
  }, [otp]);

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email information is missing. Please go back to the forgot password screen.');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyForgotPasswordOtp(email as string, otp);
      
      if (response.success) {
        Alert.alert(
          'OTP Verified', 
          'Please set your new password',
          [
            { 
              text: 'OK', 
              onPress: () => router.push({
                pathname: '/auth/reset-password',
                params: { email, token: response.token }
              })
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'An error occurred during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Email information is missing. Please go back to the forgot password screen.');
      return;
    }

    setResendLoading(true);
    try {
      const response = await resendOtp(email as string);
      
      if (response.success) {
        Alert.alert('OTP Sent', 'A new OTP has been sent to your email');
      } else {
        Alert.alert('Failed', response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'An error occurred while resending OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
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
          <ThemedText style={styles.title}>Verify OTP</ThemedText>
          <ThemedText style={styles.subtitle}>
            We've sent a verification code to{"\n"}
            <Text style={styles.emailText}>{email}</Text>
          </ThemedText>
        </View>
        
        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP from your email"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        </View>
        
        {/* Verify Button */}
        <TouchableOpacity 
          style={[styles.verifyButton, formValid && styles.verifyButtonActive]} 
          onPress={handleVerifyOtp}
          disabled={loading || !formValid}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.verifyButtonText}>Verify OTP</ThemedText>
          )}
        </TouchableOpacity>
        
        {/* Resend Link */}
        <TouchableOpacity 
          onPress={handleResendOtp} 
          style={styles.resendContainer}
          disabled={resendLoading}
        >
          {resendLoading ? (
            <ActivityIndicator size="small" color="#10b981" />
          ) : (
            <ThemedText style={styles.resendText}>Didn't receive code? Resend</ThemedText>
          )}
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
  emailText: {
    fontWeight: 'bold',
    color: '#333333',
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
  verifyButton: {
    backgroundColor: '#A0A0A0',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verifyButtonActive: {
    backgroundColor: '#10b981', // Green color when form is valid
  },
  verifyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  resendText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: 'bold',
  },
});
