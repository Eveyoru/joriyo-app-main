import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { 
  loginUser, 
  logoutUser, 
  refreshToken, 
  setAuthToken, 
  clearAuthToken, 
  getAuthToken,
  getUserProfile 
} from '@/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  avatar?: string;
  mobile?: string;
}

// Define the shape of our authentication context
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userToken: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  refreshUser: () => Promise<boolean>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userToken: null,
  user: null,
  login: async () => false,
  logout: async () => {},
  checkAuthStatus: async () => false,
  refreshUser: async () => false,
});

// Storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Fetch user profile
  const fetchUserProfile = async (token: string) => {
    try {
      // Normal user profile fetch
      const response = await getUserProfile();
      if (response.success && response.user) {
        const userData: User = {
          id: response.user._id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role || 'USER',
          avatar: response.user.avatar,
          mobile: response.user.mobile,
        };
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
        setUser(userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Check if the user is authenticated on app start
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await checkAuthStatus();
      
      // If authenticated, route based on role
      if (isAuth && user) {
        routeBasedOnRole(user);
      }
    };
    
    checkAuth();
  }, []);

  // Route user based on their role
  const routeBasedOnRole = (userData: User) => {
    if (userData.role === 'ADMIN') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/(tabs)');
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log(`Attempting to login with email: ${email}`);
      const response = await loginUser(email, password);
      
      if (response.success) {
        // Store tokens securely
        await SecureStore.setItemAsync(TOKEN_KEY, response.token);
        if (response.refreshToken) {
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refreshToken);
        }
        
        // Update auth state
        setAuthToken(response.token);
        setUserToken(response.token);
        
        // Fetch and store user profile
        const userData = await fetchUserProfile(response.token);
        if (userData) {
          setIsAuthenticated(true);
          
          // Route based on user role
          routeBasedOnRole(userData);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Wrap the logout API call in a try-catch to handle any network errors
      try {
        await logoutUser();
        console.log('Logout successful');
      } catch (error) {
        // Just log the error but continue with local logout
        console.error('Logout API error:', error);
        console.log('Continuing with local logout...');
      }
      
      // Clear tokens and state regardless of API success
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      clearAuthToken();
      setUserToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Navigate to login screen
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout process error:', error);
      // Show an alert but still try to clear local state
      Alert.alert(
        'Logout Error',
        'There was a problem logging out, but we\'ve cleared your local session.',
        [{ text: 'OK' }]
      );
      
      // Force clear local state even if there was an error
      clearAuthToken();
      setUserToken(null);
      setUser(null);
      setIsAuthenticated(false);
      router.push('/auth/login');
    }
  };

  // Check authentication status
  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUserData = await SecureStore.getItemAsync(USER_KEY);

      if (token && storedUserData) {
        setAuthToken(token);
        setUserToken(token);
        setUser(JSON.parse(storedUserData));
        setIsAuthenticated(true);
        setIsLoading(false);
        return true;
      }

      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  };

  // Refresh user function
  const refreshUser = async (): Promise<boolean> => {
    try {
      console.log('Refreshing user data...');
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      
      if (!storedToken) {
        console.log('No token found, cannot refresh user');
        return false;
      }
      
      // Normal user profile fetch
      const response = await getUserProfile();
      if (response.success && response.user) {
        const userData: User = {
          id: response.user._id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role || 'USER',
          avatar: response.user.avatar,
          mobile: response.user.mobile,
        };
        
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
        setUser(userData);
        console.log('User data refreshed:', userData);
        return true;
      }
      
      console.log('Failed to refresh user data');
      return false;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return false;
    }
  };

  // Context value
  const value = {
    isAuthenticated,
    isLoading,
    userToken,
    user,
    login,
    logout,
    checkAuthStatus,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
