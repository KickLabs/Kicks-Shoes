import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = authService.getCurrentUser();
        if (user) {
          // Check with server to ensure user is not banned
          const serverUser = await authService.getCurrentUserFromServer();
          if (serverUser) {
            setUser(serverUser);
          } else {
            // User is banned or token is invalid, clear everything
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear everything on error
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async credentials => {
    try {
      const data = await authService.login(credentials);
      setUser(data);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async userData => {
    try {
      const data = await authService.register(userData);
      setUser(data);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async userData => {
    try {
      const data = await authService.updateProfile(userData);
      setUser({ ...user, ...data });
      return data;
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const data = await authService.changePassword(currentPassword, newPassword);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const requestPasswordReset = async email => {
    try {
      const data = await authService.requestPasswordReset(email);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const data = await authService.resetPassword(token, newPassword);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const resendVerification = async email => {
    try {
      const data = await authService.resendVerification(email);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    setUser,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
