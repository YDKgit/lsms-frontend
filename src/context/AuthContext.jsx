import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'lsms_token';
const USER_KEY = 'lsms_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const login = (loginData) => {
    const { accessToken, ...rest } = loginData;
    setToken(accessToken);
    setUser(rest);
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(rest));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const hasRole = (...roles) => roles.includes(user?.role);

  const value = useMemo(
    () => ({ token, user, login, logout, hasRole, isAuthenticated: !!token }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
