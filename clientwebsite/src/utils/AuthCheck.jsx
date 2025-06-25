import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * Component to check authentication status and redirect if not authenticated
 * Use this at the top level of protected routes
 */
export const AuthCheck = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for access token
        const accessToken = localStorage.getItem('accesstoken');
        
        if (accessToken) {
          // Validate the token by making a lightweight request
          try {
            const response = await axios.get('http://localhost:8080/api/user/user-details', {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            
            if (response.data.success) {
              setIsAuthenticated(true);
              setIsChecking(false);
              return;
            }
          } catch (tokenError) {
            console.log('Access token validation failed, trying refresh token');
            // Continue to refresh token flow if validation fails
          }
        }
        
        // If no access token or validation failed, check for refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        // If no tokens at all, redirect to login
        if (!refreshToken) {
          console.log('No tokens found, redirecting to login');
          navigate('/login', { replace: true });
          setIsChecking(false);
          return;
        }
        
        // If we have a refresh token, try to refresh the access token
        try {
          const response = await axios.post('http://localhost:8080/api/user/refresh-token', { refreshToken });
          
          if (response.data.success) {
            const { accesstoken, refreshToken: newRefreshToken } = response.data.data;
            localStorage.setItem('accesstoken', accesstoken);
            
            // Only update refresh token if we received a new one
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }
            
            console.log('Token refreshed successfully');
            setIsAuthenticated(true);
          } else {
            // If refresh failed, redirect to login
            console.log('Token refresh failed, redirecting to login');
            localStorage.removeItem('accesstoken');
            localStorage.removeItem('refreshToken');
            navigate('/login', { replace: true });
          }
        } catch (error) {
          // If refresh failed, redirect to login
          console.error('Token refresh error:', error);
          localStorage.removeItem('accesstoken');
          localStorage.removeItem('refreshToken');
          navigate('/login', { replace: true });
        }
      } finally {
        // Always set checking to false
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Show loading indicator while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  // Return children only if authenticated
  return isAuthenticated ? children : null;
};

export default AuthCheck; 