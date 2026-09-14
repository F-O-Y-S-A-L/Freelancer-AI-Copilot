import React, { useState, useEffect, useRef } from 'react';
import { IUserProfile, IServiceItem, DEFAULT_AVATAR } from '../shared/types';
import {
  findCategoryForProfession,
  findServicesForProfession,
} from '../shared/knowledgeTaxonomy';
import { CascadingKnowledgeSelector } from './knowledge/CascadingKnowledgeSelector';
import {
  User,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Edit2,
  ShieldAlert,
  DollarSign,
  Clock,
  Layers,
  MessageSquare,
  FileText,
  AlertCircle,
  Save,
  CheckCircle2,
  X,
  Tag,
  Briefcase,
  Camera,
  Upload,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

interface KnowledgeBaseEditorProps {
  initialProfile: IUserProfile & { name?: string };
  onSave: (updatedData: Partial<IUserProfile> & { name?: string }) => Promise<boolean>;
  isSaving: boolean;
}

export const KnowledgeBaseEditor: React.FC<KnowledgeBaseEditorProps> = ({
  initialProfile,
  onSave,
  isSaving,
}) => {
  // Profile State
  const [name, setName] = useState(initialProfile.name || '');
  const [profession, setProfession] = useState(initialProfile.profession || '');
  const [professions, setProfessions] = useState<string[]>(
    initialProfile.professions || (initialProfile.profession ? [initialProfile.profession] : [])
  );
  
  // Infer initial categories only if user has existing saved data
  const [categories, setCategories] = useState<string[]>(() => {
    if (initialProfile.categories && initialProfile.categories.length > 0) {
      return initialProfile.categories;
    }
    if (initialProfile.profession) {
      const inferred = findCategoryForProfession(initialProfile.profession);
      if (inferred) return [inferred.name];
    }
    return [];
  });

  // Infer initial specializations only if user has existing saved data
  const [specializations, setSpecializations] = useState<string[]>(() => {
    if (initialProfile.specializations && initialProfile.specializations.length > 0) {
      return initialProfile.specializations;
    }
    if (initialProfile.profession) {
      const inferredServices = findServicesForProfession(initialProfile.profession);
      if (inferredServices.length > 0) return inferredServices;
    }
    return [];
  });

  const [bio, setBio] = useState(initialProfile.bio || '');
  const [avatar, setAvatar] = useState(initialProfile.avatar || DEFAULT_AVATAR);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [communicationTone, setCommunicationTone] = useState<
    'friendly' | 'formal' | 'concise' | 'detailed'
  >(initialProfile.communicationTone || 'friendly');

  // Skills & Tools
  const [skills, setSkills] = useState<string[]>(initialProfile.skills || []);
  const [toolsAndFrameworks, setToolsAndFrameworks] = useState<string[]>(
    initialProfile.toolsAndFrameworks || []
  );

  // Unsupported / Out of Scope
  const [unsupportedWork, setUnsupportedWork] = useState<string[]>(
    initialProfile.unsupportedWork || []
  );

  // Services Catalog
  const [services, setServices] = useState<IServiceItem[]>(initialProfile.services || []);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);

  // Service Form State
  const [srvName, setSrvName] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvPrice, setSrvPrice] = useState<number>(0);
  const [srvCurrency, setSrvCurrency] = useState('USD');
  const [srvModel, setSrvModel] = useState<'fixed' | 'hourly' | 'starting_at'>('fixed');
  const [srvDays, setSrvDays] = useState<number>(1);
  const [srvDeliverables, setSrvDeliverables] = useState<string[]>([]);
  const [newDeliverableInput, setNewDeliverableInput] = useState('');

  // Pricing Rules
  const [minProjectPrice, setMinProjectPrice] = useState<number>(
    initialProfile.pricingRules?.minProjectPrice ?? 0
  );
  const [hourlyRate, setHourlyRate] = useState<number>(
    initialProfile.pricingRules?.hourlyRate ?? 0
  );
  const [rushOrderMultiplier, setRushOrderMultiplier] = useState<number>(
    initialProfile.pricingRules?.rushOrderMultiplier ?? 1.0
  );

  // Business Rules
  const [maxRevisions, setMaxRevisions] = useState<number>(initialProfile.maxRevisions ?? 0);
  const [depositPercentage, setDepositPercentage] = useState<number>(
    initialProfile.depositPercentage ?? 0
  );
  const [businessRules, setBusinessRules] = useState<string[]>(
    initialProfile.businessRules || []
  );
  const [newRule, setNewRule] = useState('');

  // Feedback states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [isDirty, setIsDirty] = useState(false);

  // Update form if initialProfile changes externally
  useEffect(() => {
    setName(initialProfile.name || '');
    setProfession(initialProfile.profession || '');
    setProfessions(
      initialProfile.professions || (initialProfile.profession ? [initialProfile.profession] : [])
    );
    if (initialProfile.categories && initialProfile.categories.length > 0) {
      setCategories(initialProfile.categories);
    }
    if (initialProfile.specializations && initialProfile.specializations.length > 0) {
      setSpecializations(initialProfile.specializations);
    }
    setBio(initialProfile.bio || '');
    setAvatar(initialProfile.avatar || DEFAULT_AVATAR);
    setCommunicationTone(initialProfile.communicationTone || 'friendly');
    setSkills(initialProfile.skills || []);
    setToolsAndFrameworks(initialProfile.toolsAndFrameworks || []);
    setUnsupportedWork(initialProfile.unsupportedWork || []);
    setServices(initialProfile.services || []);
    setMinProjectPrice(initialProfile.pricingRules?.minProjectPrice ?? 0);
    setHourlyRate(initialProfile.pricingRules?.hourlyRate ?? 0);
    setRushOrderMultiplier(initialProfile.pricingRules?.rushOrderMultiplier ?? 1.0);
    setMaxRevisions(initialProfile.maxRevisions ?? 0);
    setDepositPercentage(initialProfile.depositPercentage ?? 0);
    setBusinessRules(initialProfile.businessRules || []);
    setIsDirty(false);
  }, [initialProfile]);

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Business Rules Handlers
  const handleAddRule = () => {
    const trimmed = newRule.trim();
    if (trimmed && !businessRules.includes(trimmed)) {
      setBusinessRules([...businessRules, trimmed]);
      setNewRule('');
      markDirty();
    }
  };

  const handleRemoveRule = (index: number) => {
    setBusinessRules(businessRules.filter((_, i) => i !== index));
    markDirty();
  };

  // Service Modal Handlers
  const handleOpenNewServiceModal = () => {
    setEditingServiceIndex(null);
    setSrvName('');
    setSrvDesc('');
    setSrvPrice(0);
    setSrvCurrency('USD');
    setSrvModel('fixed');
    setSrvDays(1);
    setSrvDeliverables([]);
    setNewDeliverableInput('');
    setServiceModalOpen(true);
  };

  const handleOpenEditServiceModal = (index: number) => {
    const srv = services[index];
    setEditingServiceIndex(index);
    setSrvName(srv.name);
    setSrvDesc(srv.description || '');
    setSrvPrice(srv.basePrice);
    setSrvCurrency(srv.currency || 'USD');
    setSrvModel(srv.pricingModel);
    setSrvDays(srv.deliveryDays || 3);
    setSrvDeliverables(srv.deliverables || []);
    setNewDeliverableInput('');
    setServiceModalOpen(true);
  };

  const handleSaveService = () => {
    if (!srvName.trim()) return;

    const newServiceObj: IServiceItem = {
      name: srvName.trim(),
      description: srvDesc.trim(),
      basePrice: Number(srvPrice) || 0,
      currency: srvCurrency,
      pricingModel: srvModel,
      deliveryDays: Number(srvDays) || 1,
      deliverables: srvDeliverables,
    };

    if (editingServiceIndex !== null) {
      const updated = [...services];
      updated[editingServiceIndex] = {
        ...updated[editingServiceIndex],
        ...newServiceObj,
      };
      setServices(updated);
    } else {
      setServices([...services, newServiceObj]);
    }

    setServiceModalOpen(false);
    markDirty();
  };

  const handleDeleteService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
    markDirty();
  };

  const handleAddDeliverable = () => {
    if (newDeliverableInput.trim()) {
      setSrvDeliverables([...srvDeliverables, newDeliverableInput.trim()]);
      setNewDeliverableInput('');
    }
  };

  const handleRemoveDeliverable = (index: number) => {
    setSrvDeliverables(srvDeliverables.filter((_, i) => i !== index));
  };

  // Avatar handlers
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Please select a valid image file.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'File size exceeds 5MB limit.' });
      return;
    }

    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setAvatar(base64);
      markDirty();
      await onSave({ avatar: base64 });
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setIsUploadingAvatar(false);
      setFeedback({ type: 'error', message: 'Failed to read image file.' });
    };
    reader.readAsDataURL(file);
  };

  const handleResetAvatar = async () => {
    setAvatar(DEFAULT_AVATAR);
    markDirty();
    await onSave({ avatar: DEFAULT_AVATAR });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Main Save All
  const handleSaveAll = async () => {
    setFeedback(null);
    const payload: Partial<IUserProfile> & { name?: string } = {
      name: name.trim(),
      profession: profession.trim(),
      professions,
      categories,
      specializations,
      bio: bio.trim(),
      avatar,
      communicationTone,
      skills,
      toolsAndFrameworks,
      unsupportedWork,
      services,
      pricingRules: {
        minProjectPrice: Number(minProjectPrice),
        hourlyRate: Number(hourlyRate),
        rushOrderMultiplier: Number(rushOrderMultiplier),
        currency: 'USD',
      },
      maxRevisions: Number(maxRevisions),
      depositPercentage: Number(depositPercentage),
      businessRules,
    };

    const success = await onSave(payload);
    if (success) {
      setFeedback({
        type: 'success',
        message: 'Knowledge Base & Capability Profile successfully saved!',
      });
      setIsDirty(false);
    } else {
      setFeedback({
        type: 'error',
        message: 'Failed to update Knowledge Base. Please check input values.',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Knowledge Base & AI Capability Configuration
            </h2>
            {isDirty && (
              <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Unsaved Changes
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure your professional category, services, skill sets, pricing, and guardrails for deterministic AI analysis.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center space-x-2 shadow-xs shadow-violet-600/30 cursor-pointer"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Knowledge Base</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between border shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile, Tone & Pricing (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Section 1: Professional Identity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Professional Identity
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              {/* Profile Avatar Upload */}
              <div className="flex items-center space-x-3.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={avatar || DEFAULT_AVATAR}
                  alt={name || 'Profile Avatar'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-violet-200 shadow-2xs shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                  }}
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-[11px] font-bold text-slate-900">Profile Photo</div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      id="kb-profile-avatar-input"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      id="btn-kb-change-avatar"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar || isSaving}
                      className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-[11px] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-3 h-3" />
                      <span>{isUploadingAvatar ? 'Saving...' : 'Change Photo'}</span>
                    </button>
                    {avatar && avatar !== DEFAULT_AVATAR && (
                      <button
                        type="button"
                        id="btn-kb-reset-avatar"
                        onClick={handleResetAvatar}
                        disabled={isUploadingAvatar || isSaving}
                        className="px-2 py-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-medium text-[11px] rounded-lg border border-slate-200 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Reset to default avatar"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-slate-700 block font-semibold mb-1">Professional Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    markDirty();
                  }}
                  placeholder="Brief summary of your expertise and working style..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Communication Tone */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <MessageSquare className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Communication Tone
              </h3>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed">
              Select your default tone style for client interactions and response generation.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'friendly', label: 'Friendly', desc: 'Warm & welcoming' },
                { id: 'formal', label: 'Formal', desc: 'Strictly professional' },
                { id: 'concise', label: 'Concise', desc: 'Direct & brief' },
                { id: 'detailed', label: 'Detailed', desc: 'Thorough & clear' },
              ].map((toneItem) => {
                const isSelected = communicationTone === toneItem.id;
                return (
                  <button
                    key={toneItem.id}
                    type="button"
                    onClick={() => {
                      setCommunicationTone(toneItem.id as any);
                      markDirty();
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-violet-50 border-violet-600 text-violet-900 font-semibold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{toneItem.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-violet-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{toneItem.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Pricing Rules & Limits */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <DollarSign className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pricing Rules
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 block font-semibold mb-1">
                  Minimum Project Budget ($)
                </label>
                <input
                  type="number"
                  value={minProjectPrice}
                  onChange={(e) => {
                    setMinProjectPrice(Number(e.target.value));
                    markDirty();
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-slate-700 block font-semibold mb-1">Hourly Rate ($/hr)</label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => {
                    setHourlyRate(Number(e.target.value));
                    markDirty();
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-slate-700 block font-semibold mb-1">
                  Rush Order Multiplier (e.g. 1.25 = +25%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={rushOrderMultiplier}
                  onChange={(e) => {
                    setRushOrderMultiplier(Number(e.target.value));
                    markDirty();
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cascading Taxonomy, Skills, Service Catalog & Rules (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 4: Cascading Guided Knowledge Base (Category -> Services -> Profession -> Skills -> Scope) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-violet-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Category & Capability Architecture
                </h3>
              </div>
              <span className="text-[11px] text-violet-700 font-semibold bg-violet-50 border border-violet-200/80 px-2.5 py-0.5 rounded-full">
                Cascading Knowledge Engine
              </span>
            </div>

            <CascadingKnowledgeSelector
              selectedCategories={categories}
              onChangeCategories={(cats) => {
                setCategories(cats);
                markDirty();
              }}
              selectedServices={specializations}
              onChangeServices={(srvs) => {
                setSpecializations(srvs);
                markDirty();
              }}
              primaryProfession={profession}
              selectedProfessions={professions}
              onChangeProfessions={(profs, primary) => {
                setProfessions(profs);
                setProfession(primary);
                markDirty();
              }}
              skills={skills}
              onChangeSkills={(sk) => {
                setSkills(sk);
                markDirty();
              }}
              toolsAndFrameworks={toolsAndFrameworks}
              onChangeTools={(tools) => {
                setToolsAndFrameworks(tools);
                markDirty();
              }}
              unsupportedWork={unsupportedWork}
              onChangeUnsupportedWork={(unsup) => {
                setUnsupportedWork(unsup);
                markDirty();
              }}
            />
          </div>

          {/* Section 5: Service Catalog */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-violet-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Service Catalog & Offerings ({services.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleOpenNewServiceModal}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 font-bold transition shadow-xs shadow-violet-600/30 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Service
              </button>
            </div>

            <div className="space-y-3">
              {services.length === 0 ? (
                <div className="text-slate-400 text-xs italic p-6 text-center border border-dashed border-slate-200 rounded-xl">
                  No services configured in catalog yet. Click "Create Service" to add standard packages.
                </div>
              ) : (
                services.map((srv, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 relative hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{srv.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{srv.description || 'No description provided'}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          type="button"
                          onClick={() => handleOpenEditServiceModal(idx)}
                          className="p-1.5 text-slate-400 hover:text-violet-600 transition cursor-pointer"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-2 border-t border-slate-200/80 text-slate-700">
                      <div className="flex items-center gap-1 text-violet-700 font-bold">
                        <span>${srv.basePrice}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-sans">
                          ({srv.pricingModel.replace('_', ' ')})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>~{srv.deliveryDays || 3} days delivery</span>
                      </div>

                      {srv.deliverables && srv.deliverables.length > 0 && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>{srv.deliverables.length} deliverables</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 6: Business Rules & Policies */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Business Rules & Terms
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-700 block font-semibold mb-1">
                  Included Revisions
                </label>
                <input
                  type="number"
                  value={maxRevisions}
                  onChange={(e) => {
                    setMaxRevisions(Number(e.target.value));
                    markDirty();
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-slate-700 block font-semibold mb-1">
                  Required Deposit (%)
                </label>
                <input
                  type="number"
                  value={depositPercentage}
                  onChange={(e) => {
                    setDepositPercentage(Number(e.target.value));
                    markDirty();
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Custom Rules List */}
            <div className="space-y-3 pt-2">
              <label className="text-slate-700 block text-xs font-bold">Custom Business Policies / Disclaimers</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())}
                  placeholder="e.g. 50% upfront deposit before starting code / assets"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Policy
                </button>
              </div>

              <div className="space-y-1.5">
                {businessRules.length === 0 ? (
                  <div className="text-slate-400 text-xs italic">No custom rules added yet.</div>
                ) : (
                  businessRules.map((ruleItem, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                        <span>{ruleItem}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-slate-400 hover:text-rose-600 transition ml-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingServiceIndex !== null ? 'Edit Service' : 'Add New Service Package'}
              </h3>
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-700 block font-semibold mb-1">Service Name *</label>
                <input
                  type="text"
                  value={srvName}
                  onChange={(e) => setSrvName(e.target.value)}
                  placeholder="e.g. Full-Stack Web App MVP"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-slate-700 block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={srvDesc}
                  onChange={(e) => setSrvDesc(e.target.value)}
                  placeholder="Brief description of what is included..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block font-semibold mb-1">Base Price ($) *</label>
                  <input
                    type="number"
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block font-semibold mb-1">Pricing Model</label>
                  <select
                    value={srvModel}
                    onChange={(e) => setSrvModel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="starting_at">Starting At</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block font-semibold mb-1">Estimated Delivery (Days)</label>
                <input
                  type="number"
                  value={srvDays}
                  onChange={(e) => setSrvDays(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Deliverables */}
              <div className="space-y-2">
                <label className="text-slate-700 block font-semibold">Deliverables</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDeliverableInput}
                    onChange={(e) => setNewDeliverableInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDeliverable())}
                    placeholder="e.g. Source code repository"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {srvDeliverables.map((deliv, dIdx) => (
                    <span
                      key={dIdx}
                      className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[11px]"
                    >
                      <span>{deliv}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(dIdx)}
                        className="hover:text-rose-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveService}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
              >
                Save Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
