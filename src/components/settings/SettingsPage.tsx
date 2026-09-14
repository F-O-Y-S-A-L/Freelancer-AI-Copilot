import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Camera,
  Trash2,
  Mail,
  Briefcase,
  Sparkles,
  Check,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Zap,
  RefreshCw,
  LogOut,
  Lock,
  Save,
  MessageSquare,
  FileText,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { IUser, IUserProfile, DEFAULT_AVATAR } from '../../shared/types';
import { FREE_PLAN_AI_CREDITS_LIMIT, PRO_PLAN_AI_CREDITS_LIMIT } from '../../shared/planConfig';

interface SettingsPageProps {
  user: IUser | null;
  profile: IUserProfile | null;
  onSaveProfile: (updatedData: Partial<IUserProfile> & { name?: string }) => Promise<boolean>;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onResetAvatar: () => Promise<void>;
  isUploadingAvatar: boolean;
  onLogout?: () => void;
  onNavigateTab?: (tab: 'inquiries' | 'knowledge' | 'clients' | 'analytics' | 'settings' | 'billing') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  profile,
  onSaveProfile,
  onAvatarUpload,
  onResetAvatar,
  isUploadingAvatar,
  onLogout,
  onNavigateTab,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState(user?.name || profile?.name || '');
  const [profession, setProfession] = useState(profile?.profession || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [communicationTone, setCommunicationTone] = useState<
    'friendly' | 'formal' | 'concise' | 'detailed'
  >(profile?.communicationTone || 'friendly');
  const [followUpThresholdDays, setFollowUpThresholdDays] = useState<number>(
    typeof profile?.followUpThresholdDays === 'number' && profile.followUpThresholdDays >= 1
      ? profile.followUpThresholdDays
      : 3
  );

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'usage' | 'security'>('profile');

  // Sync state when props change
  useEffect(() => {
    setName(user?.name || profile?.name || '');
    setProfession(profile?.profession || '');
    setBio(profile?.bio || '');
    setCommunicationTone(profile?.communicationTone || 'friendly');
    setFollowUpThresholdDays(
      typeof profile?.followUpThresholdDays === 'number' && profile.followUpThresholdDays >= 1
        ? profile.followUpThresholdDays
        : 3
    );
  }, [user, profile]);

  // Determine if form has unsaved edits
  const initialName = user?.name || profile?.name || '';
  const initialProfession = profile?.profession || '';
  const initialBio = profile?.bio || '';
  const initialTone = profile?.communicationTone || 'friendly';
  const initialFollowUpDays =
    typeof profile?.followUpThresholdDays === 'number' && profile.followUpThresholdDays >= 1
      ? profile.followUpThresholdDays
      : 3;

  const isDirty =
    name !== initialName ||
    profession !== initialProfession ||
    bio !== initialBio ||
    communicationTone !== initialTone ||
    followUpThresholdDays !== initialFollowUpDays;

  const handleResetForm = () => {
    setName(initialName);
    setProfession(initialProfession);
    setBio(initialBio);
    setCommunicationTone(initialTone);
    setFollowUpThresholdDays(initialFollowUpDays);
    setSaveSuccess(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setSaveSuccess(false);

    const success = await onSaveProfile({
      name: name.trim(),
      profession: profession.trim(),
      bio: bio.trim(),
      communicationTone,
      followUpThresholdDays,
    });

    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  const userAvatarUrl = (user as any)?.avatar || profile?.avatar || DEFAULT_AVATAR;
  const userPlanId = ((user as any)?.planId as 'free' | 'pro' | 'custom') || 'pro';
  const creditsTotal =
    userPlanId === 'free'
      ? FREE_PLAN_AI_CREDITS_LIMIT
      : (user as any)?.customCreditsLimit || PRO_PLAN_AI_CREDITS_LIMIT;
  const creditsRemaining = user?.aiCreditsRemaining ?? creditsTotal;
  const creditsPercentage = Math.min(100, Math.max(0, (creditsRemaining / creditsTotal) * 100));

  const toneOptions: { id: 'friendly' | 'formal' | 'concise' | 'detailed'; label: string; desc: string }[] = [
    { id: 'friendly', label: 'Friendly & Warm', desc: 'Approachable, warm, and conversational' },
    { id: 'formal', label: 'Professional / Formal', desc: 'Polished, structured, and business-focused' },
    { id: 'concise', label: 'Concise & Direct', desc: 'Brief, high-efficiency, no fluff' },
    { id: 'detailed', label: 'Detailed & Thorough', desc: 'In-depth, analytical, comprehensive' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Account & Settings</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage your personal identity, communication preferences, and AI quota
            </p>
          </div>

          {/* Quick nav indicator */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
            <button
              type="button"
              id="tab-settings-profile"
              onClick={() => setActiveSection('profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'profile'
                  ? 'bg-violet-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile & Details</span>
            </button>
            <button
              type="button"
              id="tab-settings-usage"
              onClick={() => setActiveSection('usage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'usage'
                  ? 'bg-violet-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>AI Usage & Plan</span>
            </button>
            <button
              type="button"
              id="tab-settings-security"
              onClick={() => setActiveSection('security')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'security'
                  ? 'bg-violet-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Security</span>
            </button>
          </div>
        </div>

        {/* Section 1: Profile & Identity Hero Banner */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            {/* Avatar & Core Identity */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative group shrink-0">
                <img
                  src={userAvatarUrl}
                  alt={name || user?.name || 'User Avatar'}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-violet-200 shadow-xs bg-slate-100"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl transition-all flex flex-col items-center justify-center text-white text-[10px] font-semibold gap-1 cursor-pointer disabled:opacity-0"
                  title="Upload new profile photo"
                >
                  <Camera className="w-5 h-5" />
                  <span>Change</span>
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                    {name || user?.name || 'Freelancer'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200/80">
                    <Sparkles className="w-3 h-3 text-violet-600 fill-violet-600" />
                    Pro Co-Pilot
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user?.email || 'user@example.com'}
                  </span>
                  {profession && (
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {profession}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Active Workspace • User ID: #{user?.id ? user.id.slice(-6) : 'active'}</span>
                </div>
              </div>
            </div>

            {/* Avatar Upload Actions */}
            <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <input
                type="file"
                id="profile-avatar-upload-input"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                onChange={onAvatarUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-upload-profile-avatar"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploadingAvatar ? 'Updating...' : 'Change Photo'}</span>
                </button>

                {userAvatarUrl !== DEFAULT_AVATAR && (
                  <button
                    type="button"
                    id="btn-reset-profile-avatar"
                    onClick={onResetAvatar}
                    disabled={isUploadingAvatar}
                    className="px-3 py-2 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 active:bg-rose-100 font-medium text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Reset to default avatar"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              <span className="text-[11px] text-slate-400">JPG, PNG, WebP, SVG • Max 5MB</span>
            </div>
          </div>
        </div>

        {/* Section Content Switching */}
        <div className="space-y-6">
          {/* Main Edit Form */}
          {activeSection === 'profile' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-violet-600" />
                    Personal & Professional Information
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your display name, professional headline, and communication tone for AI drafts
                  </p>
                </div>

                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('knowledge')}
                    className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 cursor-pointer transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Full Knowledge Base</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="input-settings-name" className="text-xs font-semibold text-slate-700 block">
                      Full Name
                    </label>
                    <input
                      id="input-settings-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
                    />
                  </div>

                  {/* Email Address (Read-only for auth security) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="input-settings-email" className="text-xs font-semibold text-slate-700 block">
                        Email Address
                      </label>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Auth Protected
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        id="input-settings-email"
                        type="email"
                        readOnly
                        value={user?.email || ''}
                        className="w-full px-3.5 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono cursor-not-allowed select-all"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Title */}
                  <div className="space-y-1.5">
                    <label htmlFor="input-settings-profession" className="text-xs font-semibold text-slate-700 block">
                      Professional Title / Role
                    </label>
                    <input
                      id="input-settings-profession"
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder="e.g. Senior Full-Stack Engineer, Brand Designer"
                      className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
                    />
                  </div>

                  {/* Account Role */}
                  <div className="space-y-1.5">
                    <label htmlFor="input-settings-role" className="text-xs font-semibold text-slate-700 block">
                      Account Type & Tier
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="input-settings-role"
                        type="text"
                        readOnly
                        value={`${user?.role ? user.role.toUpperCase() : 'FREELANCER'} • PRO SUITE`}
                        className="w-full px-3.5 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Bio / Introduction */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="input-settings-bio" className="text-xs font-semibold text-slate-700 block">
                      Professional Bio & Summary
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Used by AI to contextualize proposal generation
                    </span>
                  </div>
                  <textarea
                    id="input-settings-bio"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe your core expertise, years of experience, and typical projects you take on..."
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition resize-y leading-relaxed"
                  />
                </div>

                {/* Communication Tone Selector */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    AI Reply Communication Tone
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {toneOptions.map((tone) => {
                      const isSelected = communicationTone === tone.id;
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => setCommunicationTone(tone.id)}
                          className={`p-3 text-left rounded-xl border transition cursor-pointer space-y-1 ${
                            isSelected
                              ? 'bg-violet-50/80 border-violet-400 ring-1 ring-violet-400'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isSelected ? 'text-violet-900' : 'text-slate-800'}`}>
                              {tone.label}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-violet-600" />}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {tone.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Follow-up Timing Settings */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Default Follow-up Reminder Threshold
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Standard: 3 days (72 hours)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {[
                      { days: 1, label: '1 Day (24h)', desc: 'Fast-paced sales' },
                      { days: 2, label: '2 Days (48h)', desc: 'Quick turnaround' },
                      { days: 3, label: '3 Days (72h)', desc: 'Standard / Recommended' },
                      { days: 5, label: '5 Days (120h)', desc: 'Relaxed follow-up' },
                      { days: 7, label: '7 Days (168h)', desc: 'Long-cycle projects' },
                    ].map((opt) => {
                      const isSelected = followUpThresholdDays === opt.days;
                      return (
                        <button
                          key={opt.days}
                          type="button"
                          onClick={() => setFollowUpThresholdDays(opt.days)}
                          className={`p-3 text-left rounded-xl border transition cursor-pointer space-y-0.5 ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                              {opt.label}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save Changes Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs">
                    {saveSuccess && (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-semibold animate-fade-in">
                        <CheckCircle2 className="w-4 h-4" />
                        Settings saved successfully
                      </span>
                    )}
                    {isDirty && !saveSuccess && (
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Unsaved changes
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    {isDirty && (
                      <button
                        type="button"
                        id="btn-settings-cancel"
                        onClick={handleResetForm}
                        disabled={isSaving}
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl border border-slate-200 transition cursor-pointer disabled:opacity-50"
                      >
                        Discard
                      </button>
                    )}
                    <button
                      type="submit"
                      id="btn-save-settings"
                      disabled={isSaving || !isDirty}
                      className={`px-5 py-2 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer ${
                        !isDirty || isSaving
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                          : 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800 shadow-violet-600/20'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Section 2: AI Credits & Subscription Usage */}
          {activeSection === 'usage' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-violet-600" />
                    AI Credits & Subscription Quota
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monitor your Gemini AI generation allowances and workspace capacity
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Subscription
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main Progress Card */}
                <div className="lg:col-span-2 p-4 sm:p-5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Current Balance
                      </div>
                      <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                        {creditsRemaining.toLocaleString()}{' '}
                        <span className="text-sm font-normal text-slate-500">
                          / {creditsTotal.toLocaleString()} credits
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-violet-700">
                        {Math.round(creditsPercentage)}% Available
                      </div>
                      <div className="text-[11px] text-slate-400">Monthly renewal cycle</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${creditsPercentage}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Each client inquiry analysis, scope breakdown, or synthesized proposal uses 1 AI credit.
                    Failed or interrupted Gemini requests are automatically refunded to your quota.
                  </p>
                </div>

                {/* Plan Highlights */}
                <div className="p-4 sm:p-5 bg-violet-50/50 rounded-xl border border-violet-100 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-violet-600 fill-violet-600" />
                      Pro Co-Pilot Inclusions
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-violet-600 shrink-0" />
                        <span>{creditsTotal} monthly AI reply credits</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-violet-600 shrink-0" />
                        <span>Custom pricing & business rules</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-violet-600 shrink-0" />
                        <span>Follow-up message generation</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-violet-600 shrink-0" />
                        <span>Client catalog & analytics</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      id="btn-settings-manage-quota"
                      onClick={() => {
                        if (onNavigateTab) {
                          onNavigateTab('billing');
                        }
                      }}
                      className="w-full py-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold text-xs rounded-xl shadow-2xs transition cursor-pointer"
                    >
                      Manage Plans & Billing
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Workspace Security & Session Management */}
          {activeSection === 'security' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-violet-600" />
                  Account Security & Session
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your authenticated session and workspace access controls
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      Account Password
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Your account is protected with encrypted authentication.
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Protected
                  </span>
                </div>

                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Active Session
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Logged in as {user?.email || 'user'}
                    </p>
                  </div>
                  {onLogout && (
                    <button
                      type="button"
                      id="btn-settings-logout"
                      onClick={onLogout}
                      className="px-2.5 py-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
