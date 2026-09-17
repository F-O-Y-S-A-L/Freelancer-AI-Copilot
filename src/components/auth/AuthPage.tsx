import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onNavigate?: (path: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode, onNavigate }) => {
  const { login, register, isLoading } = useAuth();
  
  // Detect initial mode from prop or window pathname
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(() => {
    if (initialMode) return initialMode;
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('signup') || path.includes('register')) {
        return 'signup';
      }
    }
    return 'login';
  });

  useEffect(() => {
    if (initialMode && initialMode !== authMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('signup') || path.includes('register')) {
        setAuthMode('signup');
      } else if (path.includes('login')) {
        setAuthMode('login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSwitchToSignup = () => {
    setAuthMode('signup');
    if (onNavigate) {
      onNavigate('/signup');
    } else {
      window.history.pushState(null, '', '/signup');
    }
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
    if (onNavigate) {
      onNavigate('/login');
    } else {
      window.history.pushState(null, '', '/login');
    }
  };

  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate('/');
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased selection:bg-violet-500 selection:text-white">
      {/* Background Accent Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-40">
        <div className="w-[500px] h-[500px] bg-violet-200/50 rounded-full blur-3xl -translate-y-24" />
        <div className="w-[400px] h-[400px] bg-purple-100/60 rounded-full blur-3xl translate-x-32 translate-y-32" />
      </div>

      {/* Top Bar with Back Link */}
      <div className="relative z-20 flex items-center justify-between max-w-5xl mx-auto w-full pt-2">
        <button
          type="button"
          id="btn-auth-back-home"
          onClick={handleGoHome}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Website</span>
        </button>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-violet-600 fill-violet-600" />
          <span className="font-semibold hidden sm:inline">Freelancer AI Copilot</span>
        </div>
      </div>

      <div className="w-full flex-1 flex items-center justify-center relative z-10 py-6 sm:py-10">
        {authMode === 'login' ? (
          <LoginPage
            onLogin={login}
            onSwitchToSignup={handleSwitchToSignup}
            isLoading={isLoading}
          />
        ) : (
          <SignupPage
            onRegister={register}
            onSwitchToLogin={handleSwitchToLogin}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Clean Footer */}
      <footer className="relative z-10 text-center py-4 text-xs text-slate-500 border-t border-slate-200/60 mt-auto">
        <p>
          Freelancer AI Business Copilot &bull; Deterministic proposal intelligence
        </p>
      </footer>
    </div>
  );
};
