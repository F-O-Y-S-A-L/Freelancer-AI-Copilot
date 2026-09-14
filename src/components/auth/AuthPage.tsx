import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';

export const AuthPage: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  
  // Detect initial mode from window pathname if specified (e.g. /login vs /signup or /register)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('signup') || path.includes('register')) {
        return 'signup';
      }
    }
    return 'login';
  });

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
    window.history.pushState(null, '', '/signup');
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
    window.history.pushState(null, '', '/login');
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased selection:bg-violet-500 selection:text-white">
      {/* Background Accent Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-40">
        <div className="w-[500px] h-[500px] bg-violet-200/50 rounded-full blur-3xl -translate-y-24" />
        <div className="w-[400px] h-[400px] bg-purple-100/60 rounded-full blur-3xl translate-x-32 translate-y-32" />
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
