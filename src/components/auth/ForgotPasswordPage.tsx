import React, { useState } from 'react';
import { Sparkles, KeyRound, RefreshCw, AlertCircle, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';

interface ForgotPasswordPageProps {
  onForgotPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onForgotPassword,
  onSwitchToLogin,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onForgotPassword(email.trim());
      if (!res.success) {
        setErrorMessage(res.error || 'Unable to process password reset request. Please try again.');
      } else {
        setIsSubmitted(true);
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
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Reset your password
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your account email address and we'll send you a secure password reset link.
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

        {/* Success Confirmation State */}
        {isSubmitted ? (
          <div className="space-y-5 text-center sm:text-left">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-emerald-900">Reset link dispatched</div>
                <div className="text-emerald-700 leading-relaxed">
                  If an account exists for <span className="font-semibold text-slate-900">{email}</span>, a secure reset link has been sent. Check your inbox and spam folder.
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              The reset link expires in 1 hour and is single-use for your security.
            </p>

            <button
              type="button"
              id="btn-return-to-login"
              onClick={onSwitchToLogin}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to sign in</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="forgot-password-email"
                className="block text-xs font-semibold text-slate-700"
              >
                Email address
              </label>
              <input
                id="forgot-password-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                required
                autoFocus
                autoComplete="email"
                placeholder="email@example.com"
                disabled={isBusy}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition disabled:opacity-60"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-submit-forgot-password"
              disabled={isBusy}
              className="w-full mt-2 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs shadow-violet-600/30 cursor-pointer"
            >
              {isBusy ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Back to Login Link */}
            <div className="pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                id="btn-forgot-pwd-back-login"
                onClick={onSwitchToLogin}
                disabled={isBusy}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                &larr; Back to sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
