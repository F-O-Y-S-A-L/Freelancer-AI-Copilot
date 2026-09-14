import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../shared/types';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../api/client';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCredits: (credits: number) => void;
  updateUser: (updatedFields: Partial<IUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const existingToken = getStoredToken();
      if (!existingToken) {
        setIsLoading(false);
        return;
      }

      const response = await api.getMe();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        removeStoredToken();
        setToken(null);
        setUser(null);
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      setStoredToken(res.data.token);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.register({ name, email, password });
    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      setStoredToken(res.data.token);
      return { success: true };
    }
    return { success: false, error: res.error || 'Registration failed' };
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const updateCredits = (credits: number) => {
    setUser((prev) => (prev ? { ...prev, aiCreditsRemaining: credits } : prev));
  };

  const updateUser = (updatedFields: Partial<IUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateCredits,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
