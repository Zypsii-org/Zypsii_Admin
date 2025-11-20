import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const adminUser = localStorage.getItem('adminUser');
      const userToken = localStorage.getItem('userToken');
      const storedUser = localStorage.getItem('user');
      
      if (token && adminUser) {
        try {
          const parsedAdmin = JSON.parse(adminUser);
          setUser(parsedAdmin);
          setIsAuthenticated(true);
          return;
        } catch (parseError) {
          console.error('Failed to parse stored admin data:', parseError);
          logout();
        }
      }

      if (userToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          return;
        } catch (parseError) {
          console.error('Failed to parse stored user data:', parseError);
          logout();
        }
      }

      setIsAuthenticated(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (credentials) => {
    try {
      setLoading(true);
      
      // Check if this is a Google login
      if (credentials.googleToken) {
        return await handleGoogleLogin(credentials.googleToken);
      }
      
      const response = await authAPI.login(credentials);
      
      if (response.data && response.data.status === true) {
        const admin = response.data.admin;
        const token = response.data.token; // Get token from backend response
        
        if (!token) {
          console.error('Backend did not return a token');
          return { 
            success: false, 
            error: 'Authentication failed: No token received from server' 
          };
        }

        // Validate token format (should be a JWT token)
        if (typeof token !== 'string' || token.split('.').length !== 3) {
          console.error('Invalid JWT token format received from backend');
          return { 
            success: false, 
            error: 'Authentication failed: Invalid token format received from server' 
          };
        }
        
        // Store token and admin data from backend
        localStorage.setItem('token', token);
        localStorage.setItem('adminUser', JSON.stringify(admin));
        
        // Update state
        setUser(admin);
        setIsAuthenticated(true);
        

        
        return { success: true, admin };
      } else {
        const errorMessage = response.data?.message || 'Login failed';
        return { 
          success: false, 
          error: errorMessage 
        };
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Login failed';
        return { success: false, error: errorMessage };
      } else if (error.request) {
        // Network error
        return { success: false, error: 'Network error. Please check your connection.' };
      } else {
        // Other error
        return { success: false, error: 'An unexpected error occurred' };
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (googleToken) => {
    try {
      const response = await authAPI.googleLogin(googleToken);
      
      if (response.data && !response.data.error) {
        const { token, userDetails } = response.data;
        
        if (!token) {
          console.error('Backend did not return a token');
          return { 
            success: false, 
            error: 'Google authentication failed: No token received from server' 
          };
        }

        // Validate token format (should be a JWT token)
        if (typeof token !== 'string' || token.split('.').length !== 3) {
          console.error('Invalid JWT token format received from backend');
          return { 
            success: false, 
            error: 'Google authentication failed: Invalid token format received from server' 
          };
        }
        
        // Store token and user data from backend
        localStorage.setItem('token', token);
        localStorage.setItem('adminUser', JSON.stringify(userDetails));
        
        // Update state
        setUser(userDetails);
        setIsAuthenticated(true);
        
        return { success: true, admin: userDetails };
      } else {
        const errorMessage = response.data?.message || 'Google authentication failed';
        return { 
          success: false, 
          error: errorMessage 
        };
      }
    } catch (error) {
      console.error('Google login failed:', error);
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Google authentication failed';
        return { success: false, error: errorMessage };
      } else if (error.request) {
        // Network error
        return { success: false, error: 'Network error. Please check your connection.' };
      } else {
        // Other error
        return { success: false, error: 'An unexpected error occurred during Google authentication' };
      }
    }
  };

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authAPI.refreshToken({ token });
        if (response.data.success) {
          localStorage.setItem('token', response.data.token);
          setUser(response.data.user);
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    refreshToken,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
