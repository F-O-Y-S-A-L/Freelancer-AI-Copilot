import React, { useState } from 'react';
import {
  ChartLine,
  Settings,
  Zap,
  LogOut,
  LayoutTemplateIcon,
  HomeIcon,
  MessagesSquareIcon,
  Library,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFollowUps } from '../../context/FollowUpContext';
import {
  FREE_PLAN_AI_CREDITS_LIMIT,
  FREE_PLAN_STORAGE_LIMIT_GB,
  PRO_PLAN_AI_CREDITS_LIMIT,
  PRO_PLAN_STORAGE_LIMIT_GB,
} from '../../shared/planConfig';
import { DEFAULT_AVATAR } from '../../shared/types';

interface LeftSidebarProps {
  activeTab: 'inquiries' | 'templates' | 'followups' | 'knowledge' | 'analytics' | 'settings' | 'billing';
  onSelectTab: (tab: 'inquiries' | 'templates' | 'followups' | 'knowledge' | 'analytics' | 'settings' | 'billing') => void;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  onSelectTab,
  userName = 'User',
  userEmail = '',
  onLogout,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const { summary } = useFollowUps();

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
  const creditsPercentage = Math.min(100, Math.max(0, (creditsRemaining / creditsTotal) * 100));

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
  const expiryDate = formatExpiryDate(user?.createdAt);

  const storageUsedGB = 0.4;
  const storagePercentage = Math.min(100, Math.max(0, (storageUsedGB / storageLimitGB) * 100));

  const navItems = [
    {
      id: 'inquiries' as const,
      label: 'Dashboard',
      icon: HomeIcon,
    },
    {
      id: 'followups' as const,
      label: 'Follow-ups',
      icon: MessagesSquareIcon,
      badge: summary?.dueCount > 0 ? summary.dueCount : undefined,
    },
    {
      id: 'templates' as const,
      label: 'AI Templates',
      icon: LayoutTemplateIcon,
    },
    {
      id: 'knowledge' as const,
      label: 'Knowledge Base',
      icon: Library,
    },
    {
      id: 'analytics' as const,
      label: 'Analytics',
      icon: ChartLine,
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 flex flex-col justify-between transition-all duration-300 relative select-none shrink-0 ${
        collapsed ? 'w-16' : 'w-56 xl:w-60'
      }`}
    >
      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto">
        {/* Navigation Items */}
        <nav className="p-3 space-y-2">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-sm transition cursor-pointer ${
                  isActive
                    ? 'bg-violet-100/70 text-violet-700 font-bold border-l-4 border-l-violet-600 shadow-2xs'
                    : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 border-l-4 border-l-transparent'
                } ${collapsed ? 'justify-center px-0 border-l-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
                  {collapsed && item.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </div>
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between text-left truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Pro Plan Card */}
      <div className="p-3 space-y-2.5 border-t border-slate-100">
        {!collapsed && (
          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2.5 shadow-2xs">
            {/* Plan & Expiry */}
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900">
                Plan: <span className="text-violet-700 font-extrabold">{userPlanName}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Expires: {expiryDate}
              </div>
            </div>

            {/* Section Header: USAGE */}
            <div className="pt-0.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                USAGE
              </div>
            </div>

            {/* Usage Progress Metrics */}
            <div className="space-y-2">
              {/* Reply Credits */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                  <span>Reply Credits</span>
                  <span className="font-semibold text-slate-900">
                    {creditsRemaining.toLocaleString()} / {creditsTotal.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-violet-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${creditsPercentage}%` }}
                  />
                </div>
              </div>

              {/* File Storage */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                  <span>File Storage</span>
                  <span className="font-semibold text-slate-900">
                    {storageUsedGB} GB / {storageLimitGB} GB
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Upgrade Plan Button */}
            <button
              type="button"
              id="btn-upgrade-plan-sidebar"
              onClick={() => onSelectTab('billing')}
              className="w-full mt-1 py-3 px-3 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold text-sm rounded-lg shadow-xs shadow-violet-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Upgrade Plan</span>
            </button>
          </div>
        )}

        {/* User Profile Footer Row */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-2 rounded-xl bg-slate-50/80 border border-slate-200/80`}>
          <div className="flex items-center space-x-2 overflow-hidden">
            <img
              src={(user as any)?.avatar || (user as any)?.avatarUrl || DEFAULT_AVATAR}
              alt={userName}
              className="w-7 h-7 rounded-full object-cover shrink-0"
              onError={(e) => {
                // Fallback to DEFAULT_AVATAR on image load error
                (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
            />
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-900 truncate">{userName}</div>
                <div className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1 leading-none mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online</span>
                </div>
              </div>
            )}
          </div>

          {!collapsed && onLogout && (
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};


