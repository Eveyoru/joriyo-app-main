import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router, useLocalSearchParams } from 'expo-router';
import { addUserAddress } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

export default function AddAddressScreen() {
  const params = useLocalSearchParams();
  const returnToCart = params.returnToCart === 'true';

  const [formData, setFormData] = useState({
    address_line: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    mobile: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.address_line.trim()) {
      newErrors.address_line = 'Address line is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{5,6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be 5-6 digits';
    }
    
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }
    
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10,12}$/.test(formData.mobile.trim())) {
      newErrors.mobile = 'Enter a valid mobile number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBack = () => {
    if (returnToCart) {
      router.push('/cart');
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await addUserAddress({
        ...formData,
        mobile: formData.mobile
      });
      
      if (response.error) {
        Alert.alert('Error', response.message || 'Failed to add address');
      } else {
        Alert.alert(
          'Success', 
          'Address added successfully',
          [{ 
            text: 'OK', 
            onPress: () => {
              if (returnToCart) {
                router.push('/cart');
              } else {
                router.back();
              }
            } 
          }]
        );
      }
    } catch (error) {
      console.error('Add address error:', error);
      Alert.alert('Error', 'An error occurred while adding the address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Add Address</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Address Line</ThemedText>
          <TextInput
            style={[styles.input, errors.address_line ? styles.inputError : null]}
            placeholder="Enter your address"
            value={formData.address_line}
            onChangeText={(text) => handleChange('address_line', text)}
          />
          {errors.address_line ? (
            <ThemedText style={styles.errorText}>{errors.address_line}</ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>City</ThemedText>
          <TextInput
            style={[styles.input, errors.city ? styles.inputError : null]}
            placeholder="Enter city"
            value={formData.city}
            onChangeText={(text) => handleChange('city', text)}
          />
          {errors.city ? (
            <ThemedText style={styles.errorText}>{errors.city}</ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>State</ThemedText>
          <TextInput
            style={[styles.input, errors.state ? styles.inputError : null]}
            placeholder="Enter state"
            value={formData.state}
            onChangeText={(text) => handleChange('state', text)}
          />
          {errors.state ? (
            <ThemedText style={styles.errorText}>{errors.state}</ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Pincode</ThemedText>
          <TextInput
            style={[styles.input, errors.pincode ? styles.inputError : null]}
            placeholder="Enter pincode"
            value={formData.pincode}
            onChangeText={(text) => handleChange('pincode', text)}
            keyboardType="numeric"
          />
          {errors.pincode ? (
            <ThemedText style={styles.errorText}>{errors.pincode}</ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Country</ThemedText>
          <TextInput
            style={[styles.input, errors.country ? styles.inputError : null]}
            placeholder="Enter country"
            value={formData.country}
            onChangeText={(text) => handleChange('country', text)}
          />
          {errors.country ? (
            <ThemedText style={styles.errorText}>{errors.country}</ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Mobile Number</ThemedText>
          <TextInput
            style={[styles.input, errors.mobile ? styles.inputError : null]}
            placeholder="Enter mobile number"
            value={formData.mobile}
            onChangeText={(text) => handleChange('mobile', text)}
            keyboardType="phone-pad"
          />
          {errors.mobile ? (
            <ThemedText style={styles.errorText}>{errors.mobile}</ThemedText>
          ) : null}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading ? styles.disabledButton : null]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <ThemedText style={styles.submitButtonText}>Submit</ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#495057',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 4,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
