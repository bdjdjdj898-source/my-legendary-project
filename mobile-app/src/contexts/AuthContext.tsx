import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setAccessToken } from '../api/client';
import { login as apiLogin, register as apiRegister, getCurrentUser, refreshToken as apiRefreshToken } from '../api/auth';
import { storage } from '../utils/storage';
import { User } from '../types/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load tokens and user from storage on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = await storage.getAccessToken();
        const refreshTokenValue = await storage.getRefreshToken();
        const savedUser = await storage.getUser();

        if (accessToken && savedUser) {
          // Set token in API client
          setAccessToken(accessToken);
          setUser(savedUser);

          // Try to fetch fresh user data
          try {
            const freshUser = await getCurrentUser();
            setUser(freshUser);
            await storage.setUser(freshUser);
          } catch (err) {
            // Access token might be expired, try to refresh
            if (refreshTokenValue) {
              try {
                const { accessToken: newAccessToken } = await apiRefreshToken(refreshTokenValue);
                await storage.setAccessToken(newAccessToken);
                setAccessToken(newAccessToken);

                // Fetch user with new token
                const freshUser = await getCurrentUser();
                setUser(freshUser);
                await storage.setUser(freshUser);
              } catch (refreshErr) {
                // Refresh failed, logout
                console.error('Failed to refresh token:', refreshErr);
                await handleLogout();
              }
            } else {
              // No refresh token, logout
              await handleLogout();
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await apiLogin({ email, password });

      // Save tokens and user
      await storage.setAccessToken(response.accessToken);
      await storage.setRefreshToken(response.refreshToken);
      await storage.setUser(response.user);

      // Set token in API client
      setAccessToken(response.accessToken);

      // Update state
      setUser(response.user);
    } catch (err: any) {
      const errorMessage = err?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await apiRegister({ email, password, name });

      // Save tokens and user
      await storage.setAccessToken(response.accessToken);
      await storage.setRefreshToken(response.refreshToken);
      await storage.setUser(response.user);

      // Set token in API client
      setAccessToken(response.accessToken);

      // Update state
      setUser(response.user);
    } catch (err: any) {
      const errorMessage = err?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout - clear all auth data
   */
  const handleLogout = async () => {
    await storage.clearAuth();
    setAccessToken(null);
    setUser(null);
  };

  const logout = useCallback(async () => {
    try {
      setError(null);
      await handleLogout();
    } catch (err: any) {
      console.error('Logout error:', err);
      // Still clear local data even if server request fails
      await handleLogout();
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
