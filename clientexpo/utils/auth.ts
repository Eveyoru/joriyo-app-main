import AsyncStorage from '@react-native-async-storage/async-storage';

// Token storage key
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Store authentication token
 */
export const storeToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

/**
 * Retrieve authentication token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

/**
 * Clear authentication token (logout)
 */
export const clearToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing token:', error);
  }
};

/**
 * Store user information
 */
export const storeUser = async (user: any): Promise<void> => {
  try {
    const userString = JSON.stringify(user);
    await AsyncStorage.setItem(USER_KEY, userString);
  } catch (error) {
    console.error('Error storing user:', error);
  }
};

/**
 * Retrieve user information
 */
export const getUser = async (): Promise<any | null> => {
  try {
    const userString = await AsyncStorage.getItem(USER_KEY);
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error retrieving user:', error);
    return null;
  }
};

/**
 * Clear user information
 */
export const clearUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error clearing user:', error);
  }
};

/**
 * Clear all auth data (logout)
 */
export const logout = async (): Promise<void> => {
  try {
    await clearToken();
    await clearUser();
  } catch (error) {
    console.error('Error during logout:', error);
  }
}; 