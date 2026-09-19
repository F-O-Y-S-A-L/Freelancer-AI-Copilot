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

  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
    requiresVerification?: boolean;
    email?: string;
  }>;

  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
    requiresVerification?: boolean;
    email?: string;
    message?: string;
  }>;

  verifyEmail: (
    email: string,
    code: string
  ) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;

  resendVerification: (
    email: string
  ) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;

  forgotPassword: (
    email: string
  ) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;

  resetPassword: (
    email: string,
    token: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;

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

    return {
      success: false,
      error: res.error || 'Login failed',
      requiresVerification: (res as any).requiresVerification,
      email: (res as any).email || email,
    };
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    const res = await api.register({
      name,
      email,
      password,
    });

    if (res.success) {
      // If server requires email verification,
      // do not log the user in yet.
      if ((res as any).requiresVerification || !res.data?.token) {
        return {
          success: true,
          requiresVerification: true,
          email,
          message:
            res.message || 'Verification code sent to your email',
        };
      }

      if (res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        setStoredToken(res.data.token);

        if (res.data.refreshToken) {
          setStoredRefreshToken(res.data.refreshToken);
        }
      }

      return {
        success: true,
        message: res.message,
      };
    }

    return {
      success: false,
      error: res.error || 'Registration failed',
    };
  };

  const verifyEmail = async (
    email: string,
    code: string
  ) => {
    const res = await api.verifyEmail({
      email,
      code,
    });

    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      setStoredToken(res.data.token);

      if (res.data.refreshToken) {
        setStoredRefreshToken(res.data.refreshToken);
      }

      return {
        success: true,
        message: res.message,
      };
    }

    return {
      success: false,
      error: res.error || 'Verification failed',
    };
  };

  const resendVerification = async (email: string) => {
    const res = await api.resendVerification({
      email,
    });

    if (res.success) {
      return {
        success: true,
        message:
          res.message || 'Verification code sent!',
      };
    }

    return {
      success: false,
      error:
        res.error ||
        'Failed to resend verification code',
    };
  };

  const forgotPassword = async (email: string) => {
    const res = await api.forgotPassword({
      email,
    });

    if (res.success) {
      return {
        success: true,
        message:
          res.message ||
          'Password reset link sent!',
      };
    }

    return {
      success: false,
      error:
        res.error ||
        'Failed to send password reset link',
    };
  };

  const resetPassword = async (
    email: string,
    token: string,
    password: string
  ) => {
    const res = await api.resetPassword({
      email,
      token,
      password,
    });

    if (res.success) {
      return {
        success: true,
        message:
          res.message ||
          'Password reset successfully!',
      };
    }

    return {
      success: false,
      error:
        res.error ||
        'Password reset failed',
    };
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
    setUser((prev) =>
      prev
        ? {
            ...prev,
            aiCreditsRemaining: credits,
          }
        : prev
    );
  };

  const updateUser = (
    updatedFields: Partial<IUser>
  ) => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            ...updatedFields,
          }
        : prev
    );
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
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
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
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}