import React, { useState } from "react";
import {
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface SignupPageProps {
  onRegister: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{
    success: boolean;
    error?: string;
    requiresVerification?: boolean;
    email?: string;
  }>;
  onRegistered?: (email: string) => void;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  onRegister,
  onRegistered,
  onSwitchToLogin,
  isLoading = false,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please create a password.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onRegister(name.trim(), email.trim(), password);

      if (!res.success) {
        setErrorMessage(res.error || "Registration failed. Please try again.");
        return;
      }

      if (res.requiresVerification) {
        if (onRegistered) {
          onRegistered(email.trim());
        }
        return;
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || "A network error occurred. Please try again.",
      );
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
            Create your account
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Start managing your freelance workflow with AI.
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
          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-name"
              className="block text-xs font-semibold text-slate-700"
            >
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              required
              autoComplete="name"
              placeholder="e.g. Jane Doe"
              disabled={isBusy}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition disabled:opacity-60"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-email"
              className="block text-xs font-semibold text-slate-700"
            >
              Email address
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage("");
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
            <label
              htmlFor="signup-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
                disabled={isBusy}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition disabled:opacity-60"
              />
              <button
                type="button"
                id="btn-toggle-signup-password"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isBusy}
                aria-label={showPassword ? "Hide password" : "Show password"}
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

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-confirm-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Confirm password
            </label>
            <div className="relative">
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                required
                autoComplete="new-password"
                placeholder="Re-enter your password"
                disabled={isBusy}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition disabled:opacity-60"
              />
              <button
                type="button"
                id="btn-toggle-signup-confirm-password"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                disabled={isBusy}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
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
            id="btn-submit-signup"
            disabled={isBusy}
            className="w-full mt-2 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs shadow-violet-600/30 cursor-pointer"
          >
            {isBusy ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider / Login Navigation */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <button
              type="button"
              id="link-go-to-login"
              onClick={onSwitchToLogin}
              disabled={isBusy}
              className="font-bold text-violet-700 hover:text-violet-800 hover:underline transition cursor-pointer ml-1"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
