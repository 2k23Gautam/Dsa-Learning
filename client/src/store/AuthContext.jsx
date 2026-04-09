import { createContext, useContext, useState, useCallback } from 'react';
import { API_BASE_URL } from './StoreContext.jsx';

const AuthContext = createContext(null);

const TOKEN_KEY = 'dsa_token';
const USER_KEY = 'dsa_user';

async function parseJsonSafely(res) {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;

  try {
    return await res.json();
  } catch {
    return null;
  }
}

function getNetworkErrorMessage() {
  if (API_BASE_URL) {
    return 'Unable to reach the backend. Check Render deployment, CORS, and VITE_API_URL.';
  }
  return 'Unable to reach the server. Please try again.';
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [authUser, setAuthUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch {
      return null;
    }
  });

  const signup = useCallback(async (name, email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await parseJsonSafely(res);
      if (!res.ok) return { error: data?.message || 'Signup failed' };
      if (!data?.token || !data?.user) return { error: 'Signup succeeded but response was invalid' };

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setAuthUser(data.user);
      return { user: data.user };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: getNetworkErrorMessage() };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await parseJsonSafely(res);
      if (!res.ok) return { error: data?.message || 'Login failed' };
      if (!data?.token || !data?.user) return { error: 'Login succeeded but response was invalid' };

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setAuthUser(data.user);
      return { user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { error: getNetworkErrorMessage() };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setAuthUser(null);
  }, []);

  const updateAuthUser = useCallback((newUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setAuthUser(newUser);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await parseJsonSafely(res);
        if (user) updateAuthUser(user);
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  }, [token, updateAuthUser]);

  return (
    <AuthContext.Provider value={{ authUser, token, login, signup, logout, updateAuthUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
