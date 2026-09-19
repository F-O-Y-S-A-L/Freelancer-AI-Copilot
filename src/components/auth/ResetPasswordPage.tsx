import React, { useState, useEffect } from 'react';
import { Sparkles, Lock, Eye, EyeOff, RefreshCw, AlertCircle, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../../api/client';

interface ResetPasswordPageProps {
  initialToken?: string;
  initialEmail?: string;
  onResetPassword: (email: string, token: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  onSwitchToLogin: () => void;
  onSwitchToForgotPassword: () => void;
  isLoading?: boolean;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  initialToken,
  initialEmail,
  onResetPassword,
  onSwitchToLogin,
  onSwitchToForgotPassword,
  isLoading = false,
}) => {
  // Extract token & email from props or URL
  const [token, setToken] = useState(() => {
    if (initialToken) return initialToken;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });

  const [email, setEmail] = useState(() => {
    if (initialEmail) return initialEmail;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('email') || '';
    }
    return '';
  });

  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate token on mount
  useEffect(() => {
    async function validateLink() {
      if (!token || !email) {
        setIsVerifyingToken(false);
        setTokenValid(false);
        setTokenError('The password reset link is missing a required token or email parameter.');
        return;
      }

      try {
        const res = await api.verifyResetToken(token, email);
        if (res.success && res.data?.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setTokenError(res.error || res.data?.message || 'This password reset link is invalid, expired, or has already been used.');
        }
      } catch (err: any) {
        setTokenValid(false);
        setTokenError(err?.message || 'Failed to verify password reset token.');
      } finally {
        setIsVerifyingToken(false);
      }
    }

    validateLink();
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      setErrorMessage('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onResetPassword(email, token, password);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.error || 'Failed to reset password. The link may have expired.');
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
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Create new password
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {email ? (
              <>Resetting password for <span className="font-semibold text-slate-800">{email}</span></>
            ) : (
              'Enter your new account password below.'
            )}
          </p>
        </div>

        {/* State 1: Verifying token */}
        {isVerifyingToken && (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-violet-600" />
            <span className="text-xs font-semibold">Verifying secure reset token...</span>
          </div>
        )}

        {/* State 2: Invalid / Expired Token */}
        {!isVerifyingToken && !tokenValid && (
          <div className="space-y-5">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-rose-900">Reset Link Invalid or Expired</div>
                <div className="text-rose-700 leading-relaxed">
                  {tokenError || 'This reset link has either already been used or has expired after 1 hour.'}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                id="btn-request-new-reset-link"
                onClick={onSwitchToForgotPassword}
                className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Request New Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                id="btn-back-to-signin"
                onClick={onSwitchToLogin}
                className="w-full py-2 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer text-center"
              >
                Return to sign in
              </button>
            </div>
          </div>
        )}

        {/* State 3: Password successfully updated */}
        {!isVerifyingToken && tokenValid && isSuccess && (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-emerald-900">Password reset complete!</div>
                <div className="text-emerald-700 leading-relaxed">
                  Your password has been securely updated. Your previous password no longer works.
                </div>
              </div>
            </div>

            <button
              type="button"
              id="btn-login-with-new-password"
              onClick={onSwitchToLogin}
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Sign in with new password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* State 4: Form to enter new password */}
        {!isVerifyingToken && tokenValid && !isSuccess && (
          <>
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
              {/* New Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="reset-new-password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    required
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    disabled={isBusy}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition disabled:opacity-60"
                  />
                  <button
                    type="button"
                    id="btn-toggle-reset-password"
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

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="reset-confirm-password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
                    disabled={isBusy}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition disabled:opacity-60"
                  />
                  <button
                    type="button"
                    id="btn-toggle-reset-confirm-password"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    disabled={isBusy}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 focus:text-violet-600 focus:outline-none rounded-lg transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    {showConfirmPassword ? (
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
                id="btn-submit-reset-password"
                disabled={isBusy}
                className="w-full mt-2 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs shadow-violet-600/30 cursor-pointer"
              >
                {isBusy ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Set New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  id="btn-reset-back-to-login"
                  onClick={onSwitchToLogin}
                  disabled={isBusy}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  &larr; Back to sign in
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
