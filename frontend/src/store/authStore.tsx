import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/auth';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  simulatedRole: string | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: any) => void;
  logout: () => void;
  setSimulatedRole: (role: string | null) => void;
  effectiveRole: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    isLoading: true,
    simulatedRole: null,
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await getMe();
          setState(prev => ({ ...prev, user: res.data, token, isAuthenticated: true, isLoading: false }));
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setState(prev => ({ ...prev, user: null, token: null, isAuthenticated: false, isLoading: false }));
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    initAuth();
  }, []);

  const login = useCallback((token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setState(prev => ({ ...prev, user, token, isAuthenticated: true, isLoading: false }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState({ user: null, token: null, isAuthenticated: false, isLoading: true, simulatedRole: null });
  }, []);

  const setSimulatedRole = useCallback((role: string | null) => {
    setState(prev => ({ ...prev, simulatedRole: role }));
  }, []);

  const effectiveRole = state.simulatedRole || state.user?.role || 'template_admin';

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setSimulatedRole, effectiveRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
