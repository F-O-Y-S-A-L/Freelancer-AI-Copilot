import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { LoginPage } from "./LoginPage";
import { SignupPage } from "./SignupPage";
import { VerifyEmailPage } from "./VerifyEmailPage";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { ResetPasswordPage } from "./ResetPasswordPage";
import { ArrowLeft, Sparkles } from "lucide-react";

export type AuthMode =
  | "login"
  | "signup"
  | "verify-email"
  | "forgot-password"
  | "reset-password";

interface AuthPageProps {
  initialMode?: AuthMode;
  initialEmail?: string;
  initialToken?: string;
  onNavigate?: (path: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode,
  initialEmail = "",
  initialToken = "",
  onNavigate,
}) => {
  const {
    login,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    isLoading,
  } = useAuth();

  const [verifyEmailAddress, setVerifyEmailAddress] = useState<string>(() => {
    if (initialEmail) return initialEmail;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("email") || "";
    }
    return "";
  });

  const [resetToken, setResetToken] = useState<string>(() => {
    if (initialToken) return initialToken;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("token") || "";
    }
    return "";
  });

  // Detect initial mode from prop or window pathname
  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    if (initialMode) return initialMode;
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      if (path.includes("reset-password")) return "reset-password";
      if (path.includes("forgot-password")) return "forgot-password";
      if (path.includes("verify-email")) return "verify-email";
      if (path.includes("signup") || path.includes("register")) return "signup";
    }
    return "login";
  });

  useEffect(() => {
    if (initialMode && initialMode !== authMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (params.get("email")) {
        setVerifyEmailAddress(params.get("email") || "");
      }
      if (params.get("token")) {
        setResetToken(params.get("token") || "");
      }

      if (path.includes("reset-password")) {
        setAuthMode("reset-password");
      } else if (path.includes("forgot-password")) {
        setAuthMode("forgot-password");
      } else if (path.includes("verify-email")) {
        setAuthMode("verify-email");

        const email = new URLSearchParams(window.location.search).get("email");

        if (email) {
          setVerifyEmailAddress(email);
        }
      } else if (path.includes("signup") || path.includes("register")) {
        setAuthMode("signup");
      } else if (path.includes("login")) {
        setAuthMode("login");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (mode: AuthMode, path: string) => {
    setAuthMode(mode);
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState(null, "", path);
    }
  };

  const handleSwitchToSignup = () => navigateTo("signup", "/signup");
  const handleSwitchToLogin = () => navigateTo("login", "/login");
  const handleSwitchToForgotPassword = () =>
    navigateTo("forgot-password", "/forgot-password");

  const handleSwitchToVerifyEmail = (email: string) => {
    setVerifyEmailAddress(email);
    navigateTo(
      "verify-email",
      `/verify-email?email=${encodeURIComponent(email)}`,
    );
  };

  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate("/");
    } else {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
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
          <span className="font-semibold hidden sm:inline">
            Freelancer AI Copilot
          </span>
        </div>
      </div>

      <div className="w-full flex-1 flex items-center justify-center relative z-10 py-6 sm:py-10">
        {authMode === "login" && (
          <LoginPage
            onLogin={login}
            onSwitchToSignup={handleSwitchToSignup}
            onSwitchToForgotPassword={handleSwitchToForgotPassword}
            onSwitchToVerifyEmail={handleSwitchToVerifyEmail}
            isLoading={isLoading}
          />
        )}

        {authMode === "signup" && (
          <SignupPage
            onRegister={register}
            onRegistered={(email) => handleSwitchToVerifyEmail(email)}
            onSwitchToLogin={handleSwitchToLogin}
            isLoading={isLoading}
          />
        )}

        {authMode === "verify-email" && (
          <VerifyEmailPage
            email={verifyEmailAddress}
            onVerify={verifyEmail}
            onResend={resendVerification}
            onSwitchToLogin={handleSwitchToLogin}
            isLoading={isLoading}
          />
        )}

        {authMode === "forgot-password" && (
          <ForgotPasswordPage
            onForgotPassword={forgotPassword}
            onSwitchToLogin={handleSwitchToLogin}
            isLoading={isLoading}
          />
        )}

        {authMode === "reset-password" && (
          <ResetPasswordPage
            initialToken={resetToken}
            initialEmail={verifyEmailAddress}
            onResetPassword={resetPassword}
            onSwitchToLogin={handleSwitchToLogin}
            onSwitchToForgotPassword={handleSwitchToForgotPassword}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Clean Footer */}
      <footer className="relative z-10 text-center py-4 text-xs text-slate-500 border-t border-slate-200/60 mt-auto">
        <p>
          Freelancer AI Business Copilot &bull; Deterministic proposal
          intelligence
        </p>
      </footer>
    </div>
  );
};
