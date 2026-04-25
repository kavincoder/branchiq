import { createContext, useContext, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

// Stores only non-sensitive display metadata — NO token in localStorage
function loadUser() {
  try { return JSON.parse(localStorage.getItem('branchiq_user')) || null; }
  catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const login = async (username, password) => {
    try {
      const data = await api.post('/auth/login', { username, password });
      // Store token for Authorization header — works on mobile where cross-origin
      // cookies (SameSite=None) are blocked by iOS Safari / mobile Chrome ITP.
      if (data.access_token) {
        localStorage.setItem('branchiq_token', data.access_token);
      }
      const userObj = {
        user_id:   data.user_id,
        full_name: data.full_name,
        role:      data.role,
        username,
        initials:  data.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      };
      setUser(userObj);
      localStorage.setItem('branchiq_user', JSON.stringify(userObj));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid username or password' };
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* best-effort */ }
    setUser(null);
    localStorage.removeItem('branchiq_user');
    localStorage.removeItem('branchiq_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
