import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { AuthRequired } from '@/components/AuthRequired';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { CachedImage } from '@/components/CachedImage';
import { getFullImageUrl } from '@/utils/api';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  const handleEditProfile = () => {
    router.push('/user/profile');
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!user) {
    return null;
  }

  return (
    <AuthRequired message="Please login to view your account information">
      <ThemedView style={styles.container}>
        {/* Profile Header */}
        <View style={styles.header}>
          {/* Back Button - Moved to header and made white */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <CachedImage 
                  uri={getFullImageUrl(user.avatar)} 
                  style={styles.avatar} 
                  resizeMode="cover"
                  placeholder={
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <ActivityIndicator color="#0CAF50" />
                    </View>
                  }
                />
              ) : (
                <View style={styles.avatar}>
                  <ThemedText style={styles.avatarText}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>{user?.name || 'User'}</ThemedText>
              <ThemedText style={styles.userEmail}>{user?.email || ''}</ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <MaterialIcons name="edit" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Account Information */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              <MaterialIcons name="person-outline" size={18} color="#333" style={styles.sectionIcon} />
              Account Information
            </ThemedText>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Email</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.email || 'Not provided'}</ThemedText>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Phone</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.mobile || 'Not provided'}</ThemedText>
              </View>
            </View>
          </View>

          {/* Order Section */}
          <TouchableOpacity 
            style={styles.section}
            onPress={() => router.push('/user/orders')}
          >
            <View style={styles.card}>
              <View style={styles.menuItem}>
                <View style={styles.menuIconContainer}>
                  <MaterialIcons name="shopping-bag" size={24} color="#4A90E2" />
                </View>
                <View style={styles.menuContent}>
                  <ThemedText style={styles.menuTitle}>My Orders</ThemedText>
                  <ThemedText style={styles.menuDescription}>View and track your orders</ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#CCCCCC" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Address Section */}
          <TouchableOpacity 
            style={styles.section}
            onPress={() => router.push('/user/addresses')}
          >
            <View style={styles.card}>
              <View style={styles.menuItem}>
                <View style={styles.menuIconContainer}>
                  <MaterialIcons name="location-on" size={24} color="#F5A623" />
                </View>
                <View style={styles.menuContent}>
                  <ThemedText style={styles.menuTitle}>My Addresses</ThemedText>
                  <ThemedText style={styles.menuDescription}>Manage delivery addresses</ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#CCCCCC" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity 
            style={[styles.section, styles.logoutSection]}
            onPress={logout}
          >
            <View style={[styles.card, styles.logoutCard]}>
              <View style={styles.menuItem}>
                <View style={styles.menuIconContainer}>
                  <MaterialIcons name="exit-to-app" size={24} color="#FF3B30" />
                </View>
                <View style={styles.menuContent}>
                  <ThemedText style={styles.logoutText}>Log Out</ThemedText>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    </AuthRequired>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333333',
    marginLeft: 10,
  },
  sectionIcon: {
    marginRight: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    marginBottom: 12,
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 13,
    color: '#888888',
  },
  logoutSection: {
    marginTop: 30,
    marginBottom: 40,
  },
  logoutCard: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  avatarPlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
