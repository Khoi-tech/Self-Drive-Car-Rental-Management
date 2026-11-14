import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const location = useLocation();
  const [user, setUser] = useState(() => authService.getSavedUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async ({ clearOnFail = false } = {}) => {
    const savedToken = authService.getToken();
    if (!savedToken) {
      setUser(null);
      setToken(null);
      return null;
    }

    try {
      const profile = await authService.getCurrentUser();
      setToken(savedToken);
      setUser(profile);
      localStorage.setItem('velora_user', JSON.stringify(profile));
      return profile;
    } catch (err) {
      if (clearOnFail || err.response?.status === 401) {
        console.warn('Session verification failed, logging out:', err);
        authService.logout();
        setUser(null);
        setToken(null);
      }
      return null;
    }
  }, []);

  // Initial verify on app mount
  useEffect(() => {
    const initAuth = async () => {
      await refreshUser({ clearOnFail: true });
      setLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  // Auto-sync user status (e.g. account locked/unlocked by Admin) on route changes, tab focus & polling
  useEffect(() => {
    if (!authService.getToken()) return;

    refreshUser();

    const handleFocus = () => {
      refreshUser();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshUser();
      }
    };

    const handleStorage = (e) => {
      if (e.key === 'velora_token' || e.key === 'velora_user') {
        setToken(authService.getToken());
        setUser(authService.getSavedUser());
        refreshUser();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshUser();
      }
    }, 5000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
      clearInterval(intervalId);
    };
  }, [location.pathname, token, refreshUser]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'STAFF' || user?.role === 'MANAGER' || user?.role === 'ADMIN',
    isStaff: user?.role === 'STAFF' || user?.role === 'MANAGER' || user?.role === 'ADMIN',
    login,
    register,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
