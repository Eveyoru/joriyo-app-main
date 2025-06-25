import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ViewAdminProfile() {
  const { user } = useAuth();

  if (!user || user.role !== 'ADMIN') {
    router.replace('/auth/login');
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/admin/dashboard')}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>View Profile</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
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
            </View>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoGroup}>
              <ThemedText style={styles.label}>Name</ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoText}>{user.name}</ThemedText>
              </View>
            </View>

            <View style={styles.infoGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoText}>{user.email}</ThemedText>
              </View>
            </View>

            <View style={styles.infoGroup}>
              <ThemedText style={styles.label}>Mobile</ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoText}>{user.mobile || 'Not provided'}</ThemedText>
              </View>
            </View>

            <View style={styles.infoGroup}>
              <ThemedText style={styles.label}>Role</ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoText}>{user.role}</ThemedText>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push('/admin/profile')}
            >
              <Ionicons name="pencil" size={20} color="#fff" style={styles.editIcon} />
              <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  },
  profileSection: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFC107',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  editButton: {
    backgroundColor: '#FFC107',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  editIcon: {
    marginRight: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
