import { useEffect } from 'react';
import { router } from 'expo-router';

export default function OrderIndex() {
  useEffect(() => {
    // Redirect to the main page
    router.replace('/');
  }, []);

  return null;
} 