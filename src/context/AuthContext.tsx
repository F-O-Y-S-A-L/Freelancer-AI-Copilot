import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../shared/types';
import {
  api,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  setStoredRefreshToken,
  removeStoredRefreshToken,
} from '../api/client';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
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

      // Try getMe with current token
      const response = await api.getMe();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // If access token was expired, try silent refresh before logging out!
        const refreshRes = await api.refreshToken();
        if (refreshRes.success && refreshRes.data?.token) {
          setToken(refreshRes.data.token);
          const retryMe = await api.getMe();
          if (retryMe.success && retryMe.data) {
            setUser(retryMe.data);
          } else {
            removeStoredToken();
            removeStoredRefreshToken();
            setToken(null);
            setUser(null);
          }
        } else {
          removeStoredToken();
          removeStoredRefreshToken();
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  // Multi-tab synchronization
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'freelancer_copilot_token') {
        if (!e.newValue) {
          // Logged out in another tab
          setUser(null);
          setToken(null);
        } else if (e.newValue !== token) {
          // Logged in with new token in another tab
          setToken(e.newValue);
          api.getMe().then((res) => {
            if (res.success && res.data) {
              setUser(res.data);
            }
          });
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      setStoredToken(res.data.token);
      if (res.data.refreshToken) {
        setStoredRefreshToken(res.data.refreshToken);
      }
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
      if (res.data.refreshToken) {
        setStoredRefreshToken(res.data.refreshToken);
      }
      return { success: true };
    }
    return { success: false, error: res.error || 'Registration failed' };
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    }
    removeStoredToken();
    removeStoredRefreshToken();
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
