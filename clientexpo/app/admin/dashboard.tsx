import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

type AdminRoute = 
  | '/admin/profile'
  | '/admin/categories'
  | '/admin/subcategories'
  | '/admin/products'
  | '/admin/upload-product'
  | '/admin/banners'
  | '/admin/orders'
  | '/admin/customers'
  | '/admin/my-orders'
  | '/admin/address';

interface MenuItem {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  pathname?: AdminRoute;
  onPress?: () => void;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  if (!user || user.role !== 'ADMIN') {
    router.replace({
      pathname: '/auth/login'
    });
    return null;
  }

  const menuItems: MenuItem[] = [
    { title: 'Category', icon: 'grid-outline', pathname: '/admin/categories' },
    { title: 'Sub Category', icon: 'apps-outline', pathname: '/admin/subcategories' },
    { title: 'Upload Product', icon: 'cloud-upload-outline', pathname: '/admin/upload-product' },
    { title: 'Product', icon: 'cube-outline', pathname: '/admin/products' },
    { title: 'Banners', icon: 'images-outline', pathname: '/admin/banners' },
    { title: 'All Orders', icon: 'cart-outline', pathname: '/admin/orders' },
    { title: 'Customers', icon: 'people-outline', pathname: '/admin/customers' },
    { title: 'My Orders', icon: 'bag-outline', pathname: '/admin/my-orders' },
    { title: 'Save Address', icon: 'location-outline', pathname: '/admin/address' },
    { title: 'Log Out', icon: 'log-out-outline', onPress: logout },
  ];

  const handleNavigation = (pathname: AdminRoute) => {
    router.push({
      pathname
    });
  };

  const handleProfileNavigation = () => {
    handleNavigation('/admin/profile');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.profileSection} 
          onPress={handleProfileNavigation}
        >
          <View style={styles.avatar}>
            {user?.avatar ? (
              <Image 
                source={{ uri: user.avatar }} 
                style={styles.avatarImage} 
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person-outline" size={24} color="#666" />
            )}
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.userName}>{user?.name}</ThemedText>
            <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => {
            const onPress = item.onPress || (item.pathname && (() => handleNavigation(item.pathname)));
            if (!onPress) return null;
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={onPress}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={24} color="#FFC107" />
                </View>
                <ThemedText style={styles.menuLabel}>{item.title}</ThemedText>
              </TouchableOpacity>
            );
          })}
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
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuLabel: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});
