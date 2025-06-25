import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getUserProfile, updateUserDetails, uploadAvatar, logoutUser } from '@/services/api';
import { CachedImage } from '@/components/CachedImage';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    mobile: string;
    avatar: string | null;
  }>({
    name: '',
    email: '',
    mobile: '',
    avatar: null,
  });
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await getUserProfile();
      
      if (response.success && response.user) {
        setProfile({
          name: response.user.name || '',
          email: response.user.email || '',
          mobile: response.user.mobile || '',
          avatar: response.user.avatar || null,
        });
      } else {
        Alert.alert('Error', 'Failed to load profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      Alert.alert('Error', 'An error occurred while loading your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile.name) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setUpdating(true);
    try {
      const response = await updateUserDetails({
        name: profile.name,
        mobile: profile.mobile,
      });
      
      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Update Failed', response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'An error occurred while updating your profile');
    } finally {
      setUpdating(false);
    }
  };

  const handlePickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      handleUploadAvatar(selectedAsset.uri);
    }
  };

  const handleUploadAvatar = async (imageUri: string) => {
    setUploadingAvatar(true);
    try {
      // Create form data
      const formData = new FormData();
      
      // Get file name from URI
      const uriParts = imageUri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      
      // Append the image to form data
      formData.append('avatar', {
        uri: imageUri,
        name: fileName,
        type: 'image/jpeg', // Adjust based on your image type
      } as any);

      const response = await uploadAvatar(formData);
      
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          avatar: response.avatarUrl || prev.avatar,
        }));
        Alert.alert('Success', 'Avatar uploaded successfully');
      } else {
        Alert.alert('Upload Failed', response.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      Alert.alert('Error', 'An error occurred while uploading your avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login even if logout API fails
      router.replace('/auth/login');
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <ThemedText style={{ marginTop: 20 }}>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>My Account</ThemedText>
      
      <ThemedView style={styles.avatarContainer}>
        {uploadingAvatar ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : (
          <>
            <CachedImage 
              uri={profile.avatar || ''} 
              style={styles.avatar}
              resizeMode="cover"
              placeholder={
                <View style={[styles.avatar, styles.placeholderAvatar]}>
                  <ThemedText style={styles.avatarText}>
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </ThemedText>
                </View>
              }
            />
          </>
        )}
        
        <TouchableOpacity 
          style={styles.editAvatarButton} 
          onPress={handlePickImage}
          disabled={uploadingAvatar}
        >
          <ThemedText style={styles.editButtonText}>Edit</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedView style={styles.formContainer}>
        <ThemedText style={styles.label}>Name</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={profile.name}
          onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
        />

        <ThemedText style={styles.label}>Email</ThemedText>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={profile.email}
          editable={false}
        />

        <ThemedText style={styles.label}>Mobile</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Enter your mobile"
          value={profile.mobile}
          onChangeText={(text) => setProfile(prev => ({ ...prev, mobile: text }))}
          keyboardType="phone-pad"
        />

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleUpdateProfile}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.submitButtonText}>Submit</ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <ThemedText style={styles.logoutButtonText}>Log Out</ThemedText>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderAvatar: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#757575',
  },
  editAvatarButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#2196F3',
    borderRadius: 4,
    width: 60,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
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
  },
  disabledInput: {
    backgroundColor: '#EEEEEE',
    color: '#757575',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
