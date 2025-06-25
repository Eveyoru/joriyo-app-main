import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Register',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'Forgot Password',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="verify-otp"
        options={{
          title: 'Verify OTP',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="verify-email"
        options={{
          title: 'Verify Email',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          title: 'Reset Password',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
