import { Stack } from 'expo-router';
import React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout() {
  const { user } = useAuth();

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Admin Dashboard',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Admin Profile',
        }}
      />
    </Stack>
  );
}
