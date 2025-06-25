import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import { getUserAddresses, deleteUserAddress } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { AuthRequired } from '@/components/AuthRequired';
// Add this import at the top with other imports
import { useLocalSearchParams } from 'expo-router';



interface Address {
  _id: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  mobile: string;
  status: boolean;
}
export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useLocalSearchParams();
  const returnToCart = params.returnToCart === 'true';
  const refresh = params.refresh;
  

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching addresses from server...');
      const response = await getUserAddresses();
      
      if (response.error) {
        console.error('Error fetching addresses:', response.message);
        setError(response.message || 'Failed to fetch addresses');
      } else {
        // Filter out addresses with status: false
        const activeAddresses = (response.data || []).filter((address: Address) => address.status !== false);
        console.log(`Found ${activeAddresses.length} active addresses`);
        setAddresses(activeAddresses);
      }
    } catch (err) {
      console.error('Address fetch error:', err);
      setError('An error occurred while fetching addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [refresh]);

  const handleAddAddress = () => {
    router.push('/user/add-address');
  };

  const handleEditAddress = (address: Address) => {
    router.push({
      pathname: '/user/edit-address',
      params: {
        id: address._id,
        address_line: address.address_line,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
        mobile: address.mobile
      }
    });
  };

  const handleSelectAddress = (address: Address) => {
    if (returnToCart) {
      // Navigate back to cart with the selected address
      router.push({
        pathname: '/cart',
        params: { 
          selectedAddressId: address._id,
          selectedAddress: JSON.stringify({
            address_line: address.address_line,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country,
            mobile: address.mobile
          })
        }
      });
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('Attempting to delete address:', addressId);
              
              const response = await deleteUserAddress(addressId);
              console.log('Delete response received:', JSON.stringify(response));
              
              if (response.error) {
                console.error('Delete error from API:', response.message);
                Alert.alert('Error', response.message || 'Failed to delete address');
              } else {
                // Remove the deleted address from the state
                setAddresses(addresses.filter(addr => addr._id !== addressId));
                Alert.alert('Success', 'Address deleted successfully');
                
                // Refresh the addresses list from the server to ensure it's up to date
                fetchAddresses();
              }
            } catch (err) {
              console.error('Address delete error:', err);
              Alert.alert('Error', 'An error occurred while deleting the address');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderAddressItem = ({ item }: { item: Address }) => (
    <TouchableOpacity 
      style={styles.addressCard}
      onPress={() => handleSelectAddress(item)}
    >
      <View style={styles.addressContent}>
        <ThemedText style={styles.addressLine}>{item.address_line}</ThemedText>
        <ThemedText style={styles.addressDetails}>
          {item.city}, {item.state}, {item.pincode}
        </ThemedText>
        <ThemedText style={styles.addressDetails}>{item.country}</ThemedText>
        <ThemedText style={styles.addressDetails}>Mobile: {item.mobile}</ThemedText>
      </View>
      <View style={styles.addressActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditAddress(item)}
        >
          <Ionicons name="pencil" size={18} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteAddress(item._id)}
        >
          <Ionicons name="trash" size={18} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <AuthRequired message="Please login to manage your delivery addresses">
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Saved Addresses</ThemedText>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddAddress}
          >
            <ThemedText style={styles.addButtonText}>+ Add New</ThemedText>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchAddresses}
            >
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#6c757d" />
            <ThemedText style={styles.emptyText}>No addresses saved yet</ThemedText>
            <TouchableOpacity 
              style={styles.addAddressButton}
              onPress={handleAddAddress}
            >
              <ThemedText style={styles.addAddressButtonText}>Add Address</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={addresses}
            renderItem={renderAddressItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ThemedView>
    </AuthRequired>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  addButtonText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 15,
  },
  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addressContent: {
    flex: 1,
  },
  addressLine: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  addressActions: {
    justifyContent: 'space-around',
    paddingLeft: 10,
  },
  actionButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  addAddressButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  addAddressButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});



