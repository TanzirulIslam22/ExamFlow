import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('examflow_user')) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const persist = (token, u) => {
    localStorage.setItem('examflow_token', token);
    localStorage.setItem('examflow_user', JSON.stringify(u));
    setUser(u);
  };

  const login = async (role, email, password) => {
    setLoading(true);
    try {
      const res = await client.post(`/auth/${role}/login`, { email, password });
      persist(res.token, res.user);
      return { ok: true, user: res.user };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const res = await client.post('/auth/institute/register', payload);
      persist(res.token, res.user);
      return { ok: true, user: res.user };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem('examflow_token');
    if (!token) return;
    try {
      const res = await client.get('/auth/me');
      setUser(res.user);
      localStorage.setItem('examflow_user', JSON.stringify(res.user));
    } catch {
      /* interceptor handles 401 */
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('examflow_token');
    localStorage.removeItem('examflow_user');
    setUser(null);
    window.location.href = '/';
  };

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  return (
    <AuthContext.Provider value={{ user, setUser: persist, login, register, logout, refreshMe, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
