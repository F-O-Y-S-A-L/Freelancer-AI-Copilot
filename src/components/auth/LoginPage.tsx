import React, { useState } from 'react';
import { Sparkles, Eye, EyeOff, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSwitchToSignup: () => void;
  isLoading?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onSwitchToSignup,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onLogin(email.trim(), password);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isLoading || isSubmitting;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-600/30 mb-4">
          <Sparkles className="w-6 h-6 fill-current" />
        </div>
        <h1 className="text-xl font-bold flex items-center justify-center gap-1.5 tracking-tight">
          <span className="text-[#b61dd8]">Fiverr</span>
          <span className="text-violet-700">AI Assistant</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Your Fiverr Business Co-Pilot
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
        <div className="mb-6 text-center sm:text-left">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to continue to your workspace.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-slate-700"
            >
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              required
              autoComplete="email"
              placeholder="email@example.com"
              disabled={isBusy}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition disabled:opacity-60"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                disabled={isBusy}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition disabled:opacity-60"
              />
              <button
                type="button"
                id="btn-toggle-login-password"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isBusy}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 focus:text-violet-600 focus:outline-none rounded-lg transition cursor-pointer disabled:cursor-not-allowed"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-submit-login"
            disabled={isBusy}
            className="w-full mt-2 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs shadow-violet-600/30 cursor-pointer"
          >
            {isBusy ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider / Signup Navigation */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              id="link-go-to-signup"
              onClick={onSwitchToSignup}
              disabled={isBusy}
              className="font-bold text-violet-700 hover:text-violet-800 hover:underline transition cursor-pointer ml-1"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
