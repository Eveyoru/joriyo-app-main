import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateUserDetails, uploadAvatar } from '@/services/api';

export default function AdminProfile() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mobile, setMobile] = useState(user?.mobile || '');

  if (!user || user.role !== 'ADMIN') {
    router.replace('/auth/login');
    return null;
  }

  const handleUpdateProfile = async () => {
    if (!mobile) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateUserDetails({ mobile });
      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully');
        await refreshUser();
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant permission to access your photos');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        const formData = new FormData();
        formData.append('avatar', {
          uri: selectedImage.uri,
          type: 'image/jpeg',
          name: 'profile-picture.jpg',
        } as any);
        
        setIsUploading(true);
        
        try {
          const response = await uploadAvatar(formData);
          if (response.success) {
            Alert.alert('Success', 'Profile picture updated successfully');
            await refreshUser();
          } else {
            Alert.alert('Error', response.message || 'Failed to update profile picture');
          }
        } catch (error) {
          console.error('Upload avatar error:', error);
          Alert.alert('Error', 'An error occurred while uploading your profile picture');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'An error occurred while selecting an image');
      setIsUploading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/admin/dashboard')}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Admin Dashboard - {user.name.substring(0, 2)}...</ThemedText>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.dashboardTitle}>Admin Dashboard</ThemedText>

        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleUploadAvatar}
            disabled={isUploading}
          >
            {isUploading ? (
              <View style={styles.avatar}>
                <ActivityIndicator size="large" color="#FFC107" />
              </View>
            ) : (
              <View style={styles.avatar}>
                {user.avatar ? (
                  <Image 
                    source={{ uri: user.avatar }} 
                    style={styles.avatarImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person-outline" size={40} color="#666" />
                )}
                <View style={styles.editIconOverlay}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.formSection}>
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Name</ThemedText>
              <TextInput 
                style={[styles.input, styles.readOnlyInput]}
                value={user.name}
                editable={false}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput 
                style={[styles.input, styles.readOnlyInput]}
                value={user.email}
                editable={false}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Mobile</ThemedText>
              <TextInput 
                style={styles.input}
                value={mobile}
                onChangeText={setMobile}
                placeholder="Enter your mobile number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleUpdateProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.submitText}>Submit</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  menuButton: {
    marginBottom: 15,
  },
  dashboardTitle: {
    fontSize: 24,
    color: '#ccc',
    marginBottom: 30,
  },
  profileSection: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  editIconOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#FFC107',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#FFE082',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
