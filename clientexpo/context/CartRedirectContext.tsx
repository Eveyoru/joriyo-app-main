import React, { createContext, useContext, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from './AuthContext';

type CartRedirectContextType = {
  handleAddToCart: () => void;
};

const CartRedirectContext = createContext<CartRedirectContextType | undefined>(undefined);

export const CartRedirectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      // Redirect to login with a parameter indicating it's from add to cart
      router.push({ pathname: '/auth/login', params: { fromAddToCart: 'true' } });
      return;
    }
    
    // If user is authenticated, proceed with adding to cart
    // Add your cart logic here
    console.log('Adding to cart as authenticated user');
  };

  return (
    <CartRedirectContext.Provider value={{ handleAddToCart }}>
      {children}
    </CartRedirectContext.Provider>
  );
};

export const useCartRedirect = () => {
  const context = useContext(CartRedirectContext);
  if (context === undefined) {
    throw new Error('useCartRedirect must be used within a CartRedirectProvider');
  }
  return context;
};
