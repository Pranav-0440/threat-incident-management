/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading] = useState(false);

  const login = async (username, password) => {
    const response = await authAPI.login({ username, password });
    const data = response.data;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
      username: data.username,
      roles: data.roles,
    }));
    setToken(data.token);
    setUser({ username: data.username, roles: data.roles });
    return data;
  };

  const register = async (registerData) => {
    const response = await authAPI.register(registerData);
    const data = response.data;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
      username: data.username,
      roles: data.roles,
    }));
    setToken(data.token);
    setUser({ username: data.username, roles: data.roles });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => {
    return user?.roles?.some(r => r === 'ROLE_ADMIN');
  };

  const isAnalyst = () => {
    return user?.roles?.some(r => r === 'ROLE_ANALYST');
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isAnalyst,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
