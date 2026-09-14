import React, { useState } from 'react';
import {
  Zap,
  Check,
  CheckCircle2,
  CreditCard,
  HardDrive,
  Calendar,
  Layers,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  APP_PLANS,
  FREE_PLAN_AI_CREDITS_LIMIT,
  FREE_PLAN_STORAGE_LIMIT_GB,
  PRO_PLAN_AI_CREDITS_LIMIT,
  PRO_PLAN_STORAGE_LIMIT_GB,
  IPlanItem,
} from '../../shared/planConfig';

interface PlansBillingPageProps {
  onNavigateTab: (
    tab: 'inquiries' | 'templates' | 'followups' | 'knowledge' | 'analytics' | 'settings' | 'billing' | 'onboarding'
  ) => void;
}

export const PlansBillingPage: React.FC<PlansBillingPageProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();

  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<IPlanItem | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  // Authenticated user plan data
  const userPlanId = ((user as any)?.planId as 'free' | 'pro' | 'custom') || 'pro';
  const userPlanName =
    (user as any)?.plan ||
    (userPlanId === 'custom' ? 'Custom' : userPlanId === 'free' ? 'Free' : 'Pro');

  const creditsTotal =
    userPlanId === 'free'
      ? FREE_PLAN_AI_CREDITS_LIMIT
      : (user as any)?.customCreditsLimit || PRO_PLAN_AI_CREDITS_LIMIT;

  const storageLimitGB =
    userPlanId === 'free'
      ? FREE_PLAN_STORAGE_LIMIT_GB
      : (user as any)?.customStorageLimitGB || PRO_PLAN_STORAGE_LIMIT_GB;

  const creditsRemaining = user?.aiCreditsRemaining ?? creditsTotal;
  const creditsUsed = Math.max(0, creditsTotal - creditsRemaining);
  const creditsPercentage = Math.min(100, Math.max(0, (creditsRemaining / creditsTotal) * 100));

  // Expiry / Renewal date calculation based on user record
  const formatExpiryDate = (dateStr?: string) => {
    if (!dateStr) return '24 Dec 2025';
    try {
      const d = new Date(dateStr);
      const expiry = new Date(d.getTime() + 365 * 24 * 60 * 60 * 1000);
      return expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '24 Dec 2025';
    }
  };
  const renewalDate = formatExpiryDate(user?.createdAt);

  // File storage usage metrics
  const storageUsedGB = 0.4;
  const storagePercentage = Math.min(100, Math.max(0, (storageUsedGB / storageLimitGB) * 100));

  const handlePlanAction = (plan: IPlanItem) => {
    if (plan.id === userPlanId) {
      return;
    }
    setSelectedPlanForUpgrade(plan);
    setShowUpgradeModal(true);
  };

  const getButtonLabel = (plan: IPlanItem) => {
    if (plan.id === userPlanId) {
      return 'Current Active Plan';
    }
    if (userPlanId === 'free') {
      if (plan.id === 'pro') return 'Upgrade to Pro';
      if (plan.id === 'custom') return 'Upgrade to Custom';
    } else if (userPlanId === 'pro') {
      if (plan.id === 'free') return 'Switch to Free';
      if (plan.id === 'custom') return 'Upgrade to Custom';
    } else {
      // Current user is on Custom
      if (plan.id === 'free') return 'Switch to Free';
      if (plan.id === 'pro') return 'Switch to Pro';
    }
    return `Select ${plan.name}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-violet-100/80 text-violet-700">
              <CreditCard className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Plans & Billing
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage your subscription, plan limits, and AI usage.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('inquiries')}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Back to Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current Plan Summary Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Current Plan
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {userPlanName}
              </div>
              <p className="text-xs text-slate-500">
                Connected to <span className="font-medium text-slate-700">{user?.email}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 self-start sm:self-auto">
              <div className="text-xs text-slate-600">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Renewal Date:</span>
                </div>
                <div className="font-bold text-slate-900 mt-0.5">{renewalDate}</div>
              </div>

              <div className="w-px h-7 bg-slate-200" />

              <div className="text-xs text-slate-600">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Billing Cycle:</span>
                </div>
                <div className="font-bold text-slate-900 mt-0.5">Annual Plan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Metrics Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-violet-600" />
              <span>Usage & Limits</span>
            </h2>
            <span className="text-xs text-slate-400">Resets monthly</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Reply Credits Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4 fill-current text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">AI Reply Credits</h3>
                    <p className="text-[11px] text-slate-500">Response analysis and generation quota</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-slate-900">
                    {creditsRemaining.toLocaleString()} <span className="text-xs font-medium text-slate-400">/ {creditsTotal.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-violet-600 font-semibold">
                    {creditsPercentage.toFixed(0)}% available
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-violet-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${creditsPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>{creditsUsed} used</span>
                  <span>{creditsRemaining} remaining</span>
                </div>
              </div>
            </div>

            {/* File Storage Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                    <HardDrive className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">File Storage</h3>
                    <p className="text-[11px] text-slate-500">Screenshots and Knowledge Base files</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-slate-900">
                    {storageUsedGB} GB <span className="text-xs font-medium text-slate-400">/ {storageLimitGB} GB</span>
                  </div>
                  <div className="text-[10px] text-teal-600 font-semibold">
                    {((storageUsedGB / storageLimitGB) * 100).toFixed(0)}% used
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>{storageUsedGB} GB used</span>
                  <span>{(storageLimitGB - storageUsedGB).toFixed(1)} GB available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Plans (Free -> Pro -> Custom) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Available Subscription Tiers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {APP_PLANS.map((plan) => {
              const isCurrent = plan.id === userPlanId;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 relative ${
                    isCurrent
                      ? 'border-2 border-violet-600 shadow-md shadow-violet-600/5 ring-1 ring-violet-600/20'
                      : 'border border-slate-200/90 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-6">
                      <span
                        className={`px-3 py-0.5 rounded-full text-[11px] font-bold shadow-2xs ${
                          isCurrent
                            ? 'bg-violet-600 text-white'
                            : plan.popular
                            ? 'bg-violet-100 text-violet-800 border border-violet-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isCurrent ? 'Current Plan' : plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500">{plan.tagline}</p>
                    </div>

                    {/* Pricing */}
                    <div className="pt-2 pb-2 border-y border-slate-100 space-y-0.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                          {plan.priceFormatted}
                        </span>
                        {plan.id === 'pro' && (
                          <span className="text-xs text-slate-500 font-medium">/ month</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{plan.billingPeriod}</p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Plan Includes
                      </div>
                      <ul className="space-y-2 text-xs text-slate-600">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-6">
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 px-4 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl cursor-default flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Current Active Plan</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePlanAction(plan)}
                        className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          plan.popular
                            ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>{getButtonLabel(plan)}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plan Action Notice Modal */}
      {showUpgradeModal && selectedPlanForUpgrade && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {getButtonLabel(selectedPlanForUpgrade)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 bg-violet-50/60 rounded-xl border border-violet-100 space-y-1">
                <div className="font-bold text-violet-900 text-sm">
                  {selectedPlanForUpgrade.name} ({selectedPlanForUpgrade.priceFormatted})
                </div>
                <p className="text-violet-700 text-[11px]">
                  {selectedPlanForUpgrade.id === 'free' &&
                    `Includes ${FREE_PLAN_AI_CREDITS_LIMIT} monthly AI reply credits and ${FREE_PLAN_STORAGE_LIMIT_GB} GB file storage.`}
                  {selectedPlanForUpgrade.id === 'pro' &&
                    `Includes ${PRO_PLAN_AI_CREDITS_LIMIT} monthly AI reply credits and ${PRO_PLAN_STORAGE_LIMIT_GB} GB high-speed storage.`}
                  {selectedPlanForUpgrade.id === 'custom' &&
                    'Includes tailored AI reply credits and custom storage capacity configured for your workspace.'}
                </p>
              </div>

              <p className="text-slate-500 text-[11px]">
                Subscription tier adjustments in this workspace are managed directly through workspace administrative settings.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  onNavigateTab('inquiries');
                }}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
