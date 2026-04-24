import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token') || null;
    const savedUser = localStorage.getItem('user');
    const legacyEmail = localStorage.getItem('userEmail');
    const legacyName = localStorage.getItem('userName');
    const legacyRole = localStorage.getItem('userRole');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setToken(savedToken);
        axios.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else if (legacyEmail) {
      setUser({
        email: legacyEmail,
        name: legacyName || legacyEmail,
        fullName: legacyName || legacyEmail,
        username: legacyEmail.split('@')[0],
        role: legacyRole || 'USER',
      });
    }

    setLoading(false);
  }, []);

  const login = useCallback((arg1, arg2, arg3) => {
    if (typeof arg1 === 'object' && arg1 !== null) {
      const { token: t, accessToken, ...userData } = arg1;
      const resolvedToken = t || accessToken || null;

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      const legacyEmail = userData.email || userData.username || '';
      const legacyName = userData.fullName || userData.name || userData.username || '';
      const legacyRole = userData.role || 'USER';

      if (legacyEmail) localStorage.setItem('userEmail', legacyEmail);
      if (legacyName) localStorage.setItem('userName', legacyName);
      if (legacyRole) localStorage.setItem('userRole', legacyRole);

      if (resolvedToken) {
        setToken(resolvedToken);
        localStorage.setItem('token', resolvedToken);
        axios.defaults.headers.common.Authorization = `Bearer ${resolvedToken}`;
      } else {
        setToken(null);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common.Authorization;
      }

      return;
    }

    const email = arg1;
    const name = arg2;
    const role = arg3 || 'USER';
    const userData = {
      email,
      name,
      fullName: name,
      username: email ? String(email).split('@')[0] : name,
      role,
    };

    setUser(userData);
    setToken(null);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.removeItem('token');
    localStorage.setItem('userEmail', email || '');
    localStorage.setItem('userName', name || '');
    localStorage.setItem('userRole', role);
    delete axios.defaults.headers.common.Authorization;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    delete axios.defaults.headers.common.Authorization;
  }, []);

  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const t = localStorage.getItem('token');
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) logout();
        return Promise.reject(err);
      }
    );
    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [logout]);

  const isAdmin = user?.role === 'ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAdmin,
        isTechnician,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
