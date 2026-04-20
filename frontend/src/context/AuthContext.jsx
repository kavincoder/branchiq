import { createContext, useContext, useState } from 'react';
import { MOCK_CREDENTIALS } from '../data/mockData.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('branchiq_user')) || null; }
    catch { return null; }
  });

  const login = (username, password) => {
    const found = MOCK_CREDENTIALS[username];
    if (!found || found.password !== password) {
      return { success: false, error: 'Invalid username or password' };
    }
    setUser(found.user);
    localStorage.setItem('branchiq_user', JSON.stringify(found.user));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('branchiq_user');
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
