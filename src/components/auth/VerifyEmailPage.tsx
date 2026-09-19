import React, { useState, useEffect } from 'react';
import { Sparkles, Mail, RefreshCw, AlertCircle, ArrowRight, CheckCircle2, RotateCw } from 'lucide-react';

interface VerifyEmailPageProps {
  email: string;
  onVerify: (email: string, code: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  onResend: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  email,
  onVerify,
  onResend,
  onSwitchToLogin,
  isLoading = false,
}) => {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanCode = code.replace(/\D/g, '').trim();
    if (cleanCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onVerify(email, cleanCode);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid verification code. Please check and try again.');
      } else {
        setSuccessMessage(res.message || 'Email verified successfully! Activating your account...');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsResending(true);

    try {
      const res = await onResend(email);
      if (res.success) {
        setSuccessMessage(res.message || 'A new 6-digit verification code has been sent to your email.');
        setResendCooldown(60);
      } else {
        setErrorMessage(res.error || 'Failed to resend verification code. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred. Please try again.');
    } finally {
      setIsResending(false);
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
            <Mail className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Verify your email
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            We sent a 6-digit verification code to:
          </p>
          <p className="text-xs font-semibold text-slate-800 break-all mt-0.5">
            {email}
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

        {/* Success Alert */}
        {successMessage && (
          <div
            role="status"
            className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* 6-Digit Code Input */}
          <div className="space-y-2 text-center">
            <label
              htmlFor="verification-code-input"
              className="block text-xs font-semibold text-slate-700 text-left"
            >
              6-digit verification code
            </label>
            <div className="relative">
              <input
                id="verification-code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(cleaned);
                  if (errorMessage) setErrorMessage('');
                }}
                required
                autoFocus
                placeholder="123456"
                disabled={isBusy}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-xl sm:text-2xl tracking-[0.5em] font-mono font-bold text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition disabled:opacity-60"
              />
            </div>
            <p className="text-[11px] text-slate-400 text-left">
              The code expires in 15 minutes. For security, maximum 5 attempts are allowed.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-verify-code-submit"
            disabled={isBusy || code.length !== 6}
            className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs shadow-violet-600/30 cursor-pointer"
          >
            {isBusy ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying code...</span>
              </>
            ) : (
              <>
                <span>Activate Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend Action */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <span className="text-slate-500">Didn't receive the email?</span>
          <button
            type="button"
            id="btn-resend-verification-code"
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || isResending || isBusy}
            className="font-semibold text-violet-700 hover:text-violet-800 disabled:text-slate-400 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer"
          >
            {isResending ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : resendCooldown > 0 ? (
              <span>Resend code in {resendCooldown}s</span>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5" />
                <span>Resend Code</span>
              </>
            )}
          </button>
        </div>

        {/* Back to Login Link */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            id="btn-back-to-login"
            onClick={onSwitchToLogin}
            disabled={isBusy}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            &larr; Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
};
