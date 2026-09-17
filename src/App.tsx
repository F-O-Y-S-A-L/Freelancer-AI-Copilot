import React, { useState, useEffect, Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { InquiryProvider, useInquiry } from "./context/InquiryContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { api } from "./api/client";
import { IUserProfile, DEFAULT_AVATAR } from "./shared/types";
import { PRO_PLAN_AI_CREDITS_LIMIT } from "./shared/planConfig";
import { LeftSidebar } from "./components/dashboard/LeftSidebar";
import { NotificationDropdown } from "./components/dashboard/NotificationDropdown";
import { FollowUpProvider } from "./context/FollowUpContext";
import {
  Sparkles,
  RefreshCw,
  Zap,
  AlertCircle,
  ChevronDown,
  BookOpen,
} from "lucide-react";

// Code-splitting page-level routes and modules for optimal production bundle size
const KnowledgeBaseEditor = lazy(() =>
  import("./components/KnowledgeBaseEditor").then((m) => ({
    default: m.KnowledgeBaseEditor,
  }))
);
const OnboardingWizard = lazy(() =>
  import("./components/OnboardingWizard").then((m) => ({
    default: m.OnboardingWizard,
  }))
);
const InquiryWorkspace = lazy(() =>
  import("./components/dashboard/InquiryWorkspace").then((m) => ({
    default: m.InquiryWorkspace,
  }))
);
const AnalyticsDashboard = lazy(() =>
  import("./components/dashboard/AnalyticsDashboard").then((m) => ({
    default: m.AnalyticsDashboard,
  }))
);
const SettingsPage = lazy(() =>
  import("./components/settings/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  }))
);
const PlansBillingPage = lazy(() =>
  import("./components/billing/PlansBillingPage").then((m) => ({
    default: m.PlansBillingPage,
  }))
);
const AITemplatesPage = lazy(() =>
  import("./components/templates/AITemplatesPage").then((m) => ({
    default: m.AITemplatesPage,
  }))
);
const FollowUpsPage = lazy(() =>
  import("./components/followups/FollowUpsPage").then((m) => ({
    default: m.FollowUpsPage,
  }))
);
const AuthPage = lazy(() =>
  import("./components/auth/AuthPage").then((m) => ({
    default: m.AuthPage,
  }))
);
const PublicWebsite = lazy(() =>
  import("./components/public/PublicWebsite").then((m) => ({
    default: m.PublicWebsite,
  }))
);

function TabLoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center p-12 text-slate-500">
      <div className="flex flex-col items-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-violet-600" />
        <span className="text-xs font-semibold text-slate-500">Loading module...</span>
      </div>
    </div>
  );
}

function AuthenticatedWorkspace() {
  const { user, logout, updateUser } = useAuth();
  const { fetchInquiries, selectInquiry } = useInquiry();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    | "inquiries"
    | "templates"
    | "followups"
    | "knowledge"
    | "analytics"
    | "settings"
    | "billing"
    | "onboarding"
  >("inquiries");
  const [profile, setProfile] = useState<
    (IUserProfile & { name?: string }) | null
  >(null);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Synchronize path routing
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes("/app/templates")) setActiveTab("templates");
      else if (path.includes("/app/followups") || path.includes("/app/follow-ups")) setActiveTab("followups");
      else if (path.includes("/app/knowledge-base") || path.includes("/app/knowledge")) setActiveTab("knowledge");
      else if (path.includes("/app/analytics")) setActiveTab("analytics");
      else if (path.includes("/app/settings")) setActiveTab("settings");
      else if (path.includes("/app/billing") || path.includes("/app/plans")) setActiveTab("billing");
      else if (path.includes("/onboarding")) setActiveTab("onboarding");
      else setActiveTab("inquiries");
    };

    handlePopState();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleNavigateTab = (
    tab:
      | "inquiries"
      | "templates"
      | "followups"
      | "knowledge"
      | "analytics"
      | "settings"
      | "billing"
      | "onboarding",
  ) => {
    setActiveTab(tab);
    let path = "/app/inquiries";
    if (tab === "templates") path = "/app/templates";
    else if (tab === "followups") path = "/app/follow-ups";
    else if (tab === "knowledge") path = "/app/knowledge";
    else if (tab === "analytics") path = "/app/analytics";
    else if (tab === "settings") path = "/app/settings";
    else if (tab === "billing") path = "/app/billing";
    else if (tab === "onboarding") path = "/onboarding";
    window.history.pushState(null, "", path);
  };

  const handleNotificationSelectInquiry = (inquiryId: string) => {
    handleNavigateTab("inquiries");
    selectInquiry(inquiryId);
  };

  // Load user profile
  useEffect(() => {
    loadUserData();
    fetchInquiries();
  }, []);

  const loadUserData = async () => {
    const profRes = await api.getProfile();
    if (profRes.success && profRes.data) {
      setProfile(profRes.data);
      // Auto trigger onboarding if default profile has not been configured
      if (!profRes.data.skills?.length && !profRes.data.services?.length) {
        setShowOnboarding(true);
      }
    }
  };

  const handleSaveProfile = async (
    updatedData: Partial<IUserProfile> & { name?: string },
  ): Promise<boolean> => {
    setIsSavingProfile(true);
    const res = await api.updateProfile(updatedData);
    setIsSavingProfile(false);

    if (res.success && res.data) {
      setProfile(res.data);
      if (res.data.avatar !== undefined || updatedData.avatar !== undefined) {
        updateUser({ avatar: res.data.avatar || updatedData.avatar });
      }
      if (res.data.name !== undefined || updatedData.name !== undefined) {
        updateUser({ name: res.data.name || updatedData.name });
      }
      showToast("Knowledge Base profile updated", "success");
      return true;
    } else {
      showToast("Failed to save profile", "error");
    }
    return false;
  };

  const handleCompleteOnboarding = async (
    updatedData: Partial<IUserProfile>,
  ): Promise<boolean> => {
    const success = await handleSaveProfile(updatedData);
    if (success) {
      setShowOnboarding(false);
      handleNavigateTab("inquiries");
      showToast(
        "Onboarding complete! Your Knowledge Base is active.",
        "success",
      );
    }
    return success;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size exceeds 5MB limit", "error");
      return;
    }
    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await api.updateProfile({ avatar: base64Data });
        if (res.success && res.data) {
          setProfile(res.data);
          updateUser({ avatar: base64Data });
          showToast("Profile image updated successfully", "success");
        } else {
          showToast(res.error || "Failed to update profile image", "error");
        }
      } catch {
        showToast("Failed to upload profile image", "error");
      } finally {
        setIsUploadingAvatar(false);
        if (e.target) e.target.value = "";
      }
    };
    reader.onerror = () => {
      setIsUploadingAvatar(false);
      showToast("Failed to read image file", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleResetAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      const res = await api.updateProfile({ avatar: DEFAULT_AVATAR });
      if (res.success && res.data) {
        setProfile(res.data);
        updateUser({ avatar: DEFAULT_AVATAR });
        showToast("Profile image reset to default", "success");
      } else {
        showToast("Failed to reset profile image", "error");
      }
    } catch {
      showToast("Failed to reset profile image", "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const userName = profile?.name || user?.name || user?.email || "User";
  const userAvatarUrl =
    profile?.avatar ||
    (user as any)?.avatar ||
    (user as any)?.avatarUrl ||
    (profile as any)?.avatarUrl ||
    DEFAULT_AVATAR;
  const userInitials =
    userName
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .substring(0, 2) || "U";

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans antialiased selection:bg-violet-500 selection:text-white">
      {/* Top Application Header Bar */}
      <header className="h-18 bg-white border-b border-slate-200/90 px-5 flex items-center justify-between shrink-0 shadow-2xs z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs shadow-violet-600/30">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-[#b61dd8]">Fiverr</span>
              <span className="text-violet-700">AI Assistant</span>
            </h1>

            <p className="text-[12px] text-slate-500 font-medium hidden sm:block">
              Your Fiverr Business Co-Pilot
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            id="btn-upgrade-plan-header"
            onClick={() => handleNavigateTab("billing")}
            className="px-3.5 py-2 bg-violet-800 text-white font-semibold text-xs rounded-lg shadow-xs shadow-violet-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 158 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 37
       L34 55
       L74 11
       L114 55
       L138 37
       L128 101
       H20
       L10 37Z"
                stroke="white"
                strokeWidth="15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span>Upgrade Plan</span>
          </button>

          <NotificationDropdown onSelectInquiry={handleNotificationSelectInquiry} />

          <div className="w-px h-6 bg-slate-200" />

          {/* User Profile Header */}
          <div
            onClick={() => handleNavigateTab("settings")}
            className="flex items-center space-x-2.5 cursor-pointer select-none group"
            title="User Profile & Settings"
          >
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-violet-700 transition">
                {userInitials}
              </div>
            )}
            <div className="text-left hidden md:block">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 leading-none group-hover:text-violet-700 transition">
                  {userName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition" />
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 leading-none mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace with Left Navigation Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <LeftSidebar
          activeTab={activeTab === "onboarding" ? "knowledge" : activeTab}
          onSelectTab={(tab) => {
            setShowOnboarding(false);
            handleNavigateTab(tab);
          }}
          userName={userName}
          userEmail={user?.email || ""}
          onLogout={logout}
        />

        {/* Main Content Area */}
        <div className="flex-1 h-full overflow-hidden flex flex-col bg-[#F8FAFC]">
          <Suspense fallback={<TabLoadingFallback />}>
            {/* Onboarding View */}
            {(activeTab === "onboarding" || showOnboarding) && profile && (
              <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                <OnboardingWizard
                  initialProfile={profile}
                  onSaveStep={handleSaveProfile}
                  onComplete={handleCompleteOnboarding}
                  onSkip={() => {
                    setShowOnboarding(false);
                    handleNavigateTab("inquiries");
                  }}
                />
              </div>
            )}

            {/* Tab 1: 3-Pane Inquiry Workspace */}
            {!showOnboarding && activeTab === "inquiries" && <InquiryWorkspace />}

            {/* Tab 2: AI Templates */}
            {!showOnboarding && activeTab === "templates" && (
              <AITemplatesPage
                onUseTemplate={() => {
                  handleNavigateTab("inquiries");
                }}
                onNavigateTab={handleNavigateTab}
              />
            )}

            {/* Tab 3: Knowledge Base Editor */}
            {!showOnboarding && activeTab === "knowledge" && (
              <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-violet-600" />
                      Knowledge Base & Rule Parameters
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Configure tech stack, out-of-scope services, base pricing,
                      and reply tone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowOnboarding(true)}
                    className="px-3.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    Launch Setup Wizard
                  </button>
                </div>

                {profile ? (
                  <KnowledgeBaseEditor
                    initialProfile={profile}
                    onSave={handleSaveProfile}
                    isSaving={isSavingProfile}
                  />
                ) : (
                  <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-violet-600" />
                    <span>Loading Knowledge Base Profile...</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Follow-up Messages Management */}
            {!showOnboarding && activeTab === "followups" && (
              <FollowUpsPage onSelectInquiry={handleNotificationSelectInquiry} />
            )}

            {/* Tab 4: Analytics Summary */}
            {!showOnboarding && activeTab === "analytics" && (
              <AnalyticsDashboard onNavigateTab={handleNavigateTab} />
            )}

            {/* Tab 5: Settings & Account Information */}
            {!showOnboarding && activeTab === "settings" && (
              <SettingsPage
                user={user}
                profile={profile}
                onSaveProfile={handleSaveProfile}
                onAvatarUpload={handleAvatarUpload}
                onResetAvatar={handleResetAvatar}
                isUploadingAvatar={isUploadingAvatar}
                onLogout={logout}
                onNavigateTab={handleNavigateTab}
              />
            )}

            {/* Tab 6: Plans & Billing */}
            {!showOnboarding && activeTab === "billing" && (
              <PlansBillingPage onNavigateTab={handleNavigateTab} />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function MainAppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }
    return "/";
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    window.history.pushState(null, "", path);
    setCurrentPath(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-6 font-sans antialiased">
        <div className="flex flex-col items-center space-y-3 p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/50">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs shadow-violet-600/30">
            <Sparkles className="w-5 h-5 fill-current animate-pulse" />
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
            <RefreshCw className="w-4 h-4 animate-spin text-violet-600" />
            <span>Initializing Freelancer AI Copilot...</span>
          </div>
        </div>
      </div>
    );
  }

  const normalized = currentPath.toLowerCase().replace(/\/+$/, "") || "/";
  const isAuthRoute =
    normalized === "/login" || normalized === "/signup" || normalized === "/register";
  const isProtectedRoute =
    normalized === "/app" || normalized.startsWith("/app/") || normalized === "/onboarding";
  const isPublicRoute =
    normalized === "/" ||
    normalized === "/features" ||
    normalized === "/pricing" ||
    normalized === "/about" ||
    normalized === "/faq";

  // Case 1: Unauthenticated visitors
  if (!isAuthenticated) {
    if (isProtectedRoute) {
      // Direct access to protected /app/* routes -> redirect to /login
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.history.replaceState(null, "", "/login");
      }
      return (
        <Suspense fallback={<TabLoadingFallback />}>
          <AuthPage initialMode="login" onNavigate={handleNavigate} />
        </Suspense>
      );
    }

    if (isAuthRoute) {
      const mode = normalized.includes("signup") || normalized.includes("register") ? "signup" : "login";
      return (
        <Suspense fallback={<TabLoadingFallback />}>
          <AuthPage initialMode={mode} onNavigate={handleNavigate} />
        </Suspense>
      );
    }

    // Default to Public Website
    return (
      <Suspense fallback={<TabLoadingFallback />}>
        <PublicWebsite currentPath={currentPath} onNavigate={handleNavigate} />
      </Suspense>
    );
  }

  // Case 2: Authenticated visitors
  if (isAuthRoute) {
    // Authenticated user visits /login or /signup -> redirect to /app/inquiries
    if (typeof window !== "undefined" && window.location.pathname !== "/app/inquiries") {
      window.history.replaceState(null, "", "/app/inquiries");
    }
  } else if (isPublicRoute && normalized !== "/app") {
    // Authenticated user browsing the public marketing website
    return (
      <Suspense fallback={<TabLoadingFallback />}>
        <PublicWebsite currentPath={currentPath} onNavigate={handleNavigate} />
      </Suspense>
    );
  }

  // Authenticated workspace
  return (
    <InquiryProvider>
      <NotificationProvider>
        <FollowUpProvider>
          <AuthenticatedWorkspace />
        </FollowUpProvider>
      </NotificationProvider>
    </InquiryProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
