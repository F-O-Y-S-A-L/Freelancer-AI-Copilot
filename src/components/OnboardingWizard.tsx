import React, { useState, useMemo, useEffect, useRef } from 'react';
import { IUserProfile, IServiceItem } from '../shared/types';
import {
  findCategoryForProfession,
  findServicesForProfession,
  getKnowledgeCatalogForProfessions,
  calculateAutomaticOutOfScope,
  MASTER_CATEGORIES,
} from '../shared/knowledgeTaxonomy';
import { CascadingKnowledgeSelector } from './knowledge/CascadingKnowledgeSelector';
import { CascadingChipAutocomplete } from './ui/CascadingChipAutocomplete';
import {
  Sparkles,
  Briefcase,
  Wrench,
  Ban,
  DollarSign,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface OnboardingWizardProps {
  initialProfile?: IUserProfile | null;
  onComplete: (profile: Partial<IUserProfile>) => Promise<boolean>;
  onSaveStep?: (profile: Partial<IUserProfile>) => Promise<boolean>;
  onSkip?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialProfile,
  onComplete,
  onSaveStep,
  onSkip,
}) => {
  // Restore step from localStorage if user previously advanced
  const [step, setStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('copilot_onboarding_step');
      if (saved) {
        const num = parseInt(saved, 10);
        if (num >= 1 && num <= 5) return num;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 1;
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSavingStep, setIsSavingStep] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Cascading taxonomy state - starts empty for new users
  const [categories, setCategories] = useState<string[]>(() => {
    if (initialProfile?.categories && Array.isArray(initialProfile.categories) && initialProfile.categories.length > 0) {
      return initialProfile.categories;
    }
    if (initialProfile?.profession) {
      const inferred = findCategoryForProfession(initialProfile.profession);
      if (inferred) return [inferred.name];
    }
    return [];
  });

  const [specializations, setSpecializations] = useState<string[]>(() => {
    if (initialProfile?.specializations && Array.isArray(initialProfile.specializations) && initialProfile.specializations.length > 0) {
      return initialProfile.specializations;
    }
    if (initialProfile?.profession) {
      const inferredServices = findServicesForProfession(initialProfile.profession);
      if (inferredServices.length > 0) return inferredServices;
    }
    return [];
  });

  const [profession, setProfession] = useState(initialProfile?.profession || '');
  const [professions, setProfessions] = useState<string[]>(() => {
    if (initialProfile?.professions && Array.isArray(initialProfile.professions) && initialProfile.professions.length > 0) {
      return initialProfile.professions;
    }
    return initialProfile?.profession ? [initialProfile.profession] : [];
  });

  const [experienceLevel, setExperienceLevel] = useState<'junior' | 'mid' | 'senior' | 'expert'>(
    initialProfile?.experienceLevel || 'mid'
  );
  const [bio, setBio] = useState(initialProfile?.bio || '');

  // Skills & Tools (safely defaulted to empty arrays)
  const [skills, setSkills] = useState<string[]>(() => {
    return Array.isArray(initialProfile?.skills) ? initialProfile.skills : [];
  });
  const [toolsAndFrameworks, setToolsAndFrameworks] = useState<string[]>(() => {
    return Array.isArray(initialProfile?.toolsAndFrameworks) ? initialProfile.toolsAndFrameworks : [];
  });

  // Unsupported Work / Out of Scope
  const [unsupportedWork, setUnsupportedWork] = useState<string[]>(() => {
    return Array.isArray(initialProfile?.unsupportedWork) ? initialProfile.unsupportedWork : [];
  });

  // Services Catalog
  const [services, setServices] = useState<IServiceItem[]>(() => {
    return Array.isArray(initialProfile?.services) ? initialProfile.services : [];
  });

  // Pricing
  const [minProjectPrice, setMinProjectPrice] = useState<number>(
    initialProfile?.pricingRules?.minProjectPrice ?? 500
  );
  const [hourlyRate, setHourlyRate] = useState<number>(
    initialProfile?.pricingRules?.hourlyRate ?? 65
  );

  // Rules & Tone
  const [businessRules, setBusinessRules] = useState<string[]>(() => {
    return Array.isArray(initialProfile?.businessRules) && initialProfile.businessRules.length > 0
      ? initialProfile.businessRules
      : [
          '50% upfront deposit before milestone kickoff',
          'All source code and IP transferred upon final invoice settlement',
        ];
  });
  const [newRule, setNewRule] = useState('');

  const [communicationTone, setCommunicationTone] = useState<
    'formal' | 'friendly' | 'concise' | 'detailed'
  >(initialProfile?.communicationTone || 'friendly');

  // Compute knowledge catalog suggestions for chosen profession
  const professionCatalog = useMemo(() => {
    const activeProfessions = professions.length > 0 ? professions : (profession ? [profession] : []);
    if (activeProfessions.length === 0) {
      return {
        coreSkills: [],
        toolsAndFrameworks: [],
        suggestedOutOfScope: [],
      };
    }
    return getKnowledgeCatalogForProfessions(activeProfessions);
  }, [professions, profession]);

  // Compute category IDs from selected category names or IDs
  const activeCategoryIds = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return MASTER_CATEGORIES.filter(
      (c) =>
        categories.includes(c.id) ||
        categories.some((sel) => sel.toLowerCase().trim() === c.name.toLowerCase().trim())
    ).map((c) => c.id);
  }, [categories]);

  // Compute out-of-scope suggested services based on Category + Selected Services + Profession
  const suggestedOutOfScopeList = useMemo(() => {
    const activeProfessions = professions.length > 0 ? professions : (profession ? [profession] : []);
    return calculateAutomaticOutOfScope(activeCategoryIds, specializations, activeProfessions);
  }, [activeCategoryIds, specializations, professions, profession]);

  // Persist current step to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('copilot_onboarding_step', String(step));
    } catch {
      // Ignore localStorage errors
    }
  }, [step]);

  const handleAddRule = () => {
    if (newRule.trim() && !businessRules.includes(newRule.trim())) {
      setBusinessRules([...businessRules, newRule.trim()]);
      setNewRule('');
    }
  };

  // Build normalized profile payload
  const buildCurrentPayload = (): Partial<IUserProfile> => {
    return {
      categories: Array.isArray(categories) ? categories : [],
      specializations: Array.isArray(specializations) ? specializations : [],
      profession: profession || (professions[0] || ''),
      professions: Array.isArray(professions) && professions.length > 0 ? professions : (profession ? [profession] : []),
      experienceLevel: experienceLevel || 'mid',
      bio: bio || '',
      skills: Array.isArray(skills) ? skills : [],
      toolsAndFrameworks: Array.isArray(toolsAndFrameworks) ? toolsAndFrameworks : [],
      supportedWork: Array.isArray(skills) ? skills : [],
      unsupportedWork: Array.isArray(unsupportedWork) ? unsupportedWork : [],
      services: Array.isArray(services) ? services : [],
      pricingRules: {
        minProjectPrice: Number(minProjectPrice) || 0,
        hourlyRate: Number(hourlyRate) || 0,
        rushOrderMultiplier: initialProfile?.pricingRules?.rushOrderMultiplier ?? 1.25,
        currency: initialProfile?.pricingRules?.currency || 'USD',
      },
      businessRules: Array.isArray(businessRules) ? businessRules : [],
      maxRevisions: initialProfile?.maxRevisions ?? 2,
      depositPercentage: initialProfile?.depositPercentage ?? 50,
      communicationTone: communicationTone || 'friendly',
    };
  };

  // Step 1 validation
  const validateTaxonomyStep = (): boolean => {
    setValidationError(null);
    setApiError(null);

    if (!categories || categories.length === 0) {
      setValidationError('Please select at least one Professional Category to proceed.');
      return false;
    }

    if (!specializations || specializations.length === 0) {
      setValidationError('Please select at least one Service or Specialization in your chosen category.');
      return false;
    }

    const hasProfession = Boolean(profession && profession.trim().length > 0) || (Array.isArray(professions) && professions.length > 0);
    if (!hasProfession) {
      setValidationError('Please select or type your Profession & Role Title.');
      return false;
    }

    return true;
  };

  // Advance to next step with validation and intermediate persistence
  const handleNextStep = async () => {
    setValidationError(null);
    setApiError(null);

    if (step === 1) {
      const isValid = validateTaxonomyStep();
      if (!isValid) return;
    }

    setIsSavingStep(true);
    const payload = buildCurrentPayload();

    try {
      // Save current step data if onSaveStep or onComplete is provided
      if (typeof onSaveStep === 'function') {
        const saved = await onSaveStep(payload);
        if (!saved) {
          setApiError('Unable to save your knowledge base progress. Please try again.');
          setIsSavingStep(false);
          return;
        }
      }

      // Transition to next step safely
      setStep((prev) => Math.min(prev + 1, 5));
    } catch (err: any) {
      console.error('Error during step advance:', err);
      setApiError(err?.message || 'A network error occurred while saving. Please try again.');
    } finally {
      setIsSavingStep(false);
    }
  };

  const handleFinish = async () => {
    setValidationError(null);
    setApiError(null);
    setIsSubmitting(true);

    const updatedData = buildCurrentPayload();

    try {
      const success = await onComplete(updatedData);
      if (success) {
        try {
          localStorage.removeItem('copilot_onboarding_step');
        } catch {
          // Ignore
        }
      } else {
        setApiError('Unable to finalize knowledge base setup. Please try again.');
      }
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setApiError(err?.message || 'Failed to save profile. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 text-xs">
      {/* Onboarding Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 mx-auto shadow-sm">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Configure Your Freelancer Copilot
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Establish your marketplace category, specialized skills, and pricing parameters for intelligent client proposal generation.
        </p>
      </div>

      {/* Progress Steps Indicator */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-2xs">
        {[
          { id: 1, label: 'Professional Profile & Scope', icon: Briefcase },
          { id: 2, label: 'Skills & Scope', icon: Wrench },
          { id: 3, label: 'Pricing', icon: DollarSign },
          { id: 4, label: 'Rules & Tone', icon: ShieldCheck },
          { id: 5, label: 'Review', icon: CheckCircle2 },
        ].map((s) => {
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                // Allow jumping back to earlier steps or step 1
                if (isDone) setStep(s.id);
              }}
              className={`flex items-center space-x-2 transition ${isDone ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition ${
                  isDone
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : isActive
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={`hidden sm:inline font-semibold ${
                  isActive
                    ? 'text-violet-700'
                    : isDone
                    ? 'text-slate-700'
                    : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error & Validation Banner */}
      {validationError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {apiError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Step Content Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xl">
        {/* Step 1: Category, Specialization & Profession */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-600" />
                Step 1: Marketplace Category & Professional Focus
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Select your industry category, core client services, and title to personalize auto-generated replies.
              </p>
            </div>

            <CascadingKnowledgeSelector
              variant="wizard"
              selectedCategories={categories}
              onChangeCategories={(newCats) => {
                setCategories(newCats);
                if (validationError) setValidationError(null);
              }}
              selectedServices={specializations}
              onChangeServices={(newServices) => {
                setSpecializations(newServices);
                if (validationError) setValidationError(null);
              }}
              primaryProfession={profession}
              selectedProfessions={professions}
              onChangeProfessions={(profs, primary) => {
                setProfessions(profs);
                setProfession(primary);
                if (validationError) setValidationError(null);
              }}
              skills={skills}
              onChangeSkills={setSkills}
              toolsAndFrameworks={toolsAndFrameworks}
              onChangeTools={setToolsAndFrameworks}
              unsupportedWork={unsupportedWork}
              onChangeUnsupportedWork={setUnsupportedWork}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Experience Level *
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500"
                >
                  <option value="junior">Junior (1-2 yrs)</option>
                  <option value="mid">Mid-Level (3-5 yrs)</option>
                  <option value="senior">Senior (5-8 yrs)</option>
                  <option value="expert">Expert (8+ yrs)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Short Tagline & Bio
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Modern Full-Stack web specialist building scalable apps"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Skills & Capability Scope */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-violet-600" />
                Step 2: Technical Skills, Tools & Guardrail Scope
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Refine the competencies, framework stack, and prohibited out-of-scope services for <strong>{profession || (professions[0] || 'your selected role')}</strong>.
              </p>
            </div>

            <CascadingChipAutocomplete
              label="Core Competencies & Skills"
              placeholder="Type to search or add custom skill..."
              items={skills}
              onChange={setSkills}
              catalogSuggestions={professionCatalog.coreSkills || []}
              badgeColor="violet"
              helperText="Suggested from your selected profession. Type any custom skill and press Enter."
            />

            <CascadingChipAutocomplete
              label="Software, Frameworks & Tooling"
              placeholder="Type to search or add custom tool..."
              items={toolsAndFrameworks}
              onChange={setToolsAndFrameworks}
              catalogSuggestions={professionCatalog.toolsAndFrameworks || []}
              badgeColor="blue"
              helperText="Libraries, SDKs, design apps, and engineering tooling."
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Ban className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Explicit Out-of-Scope Services (Declined Work)
                  </span>
                </div>
                {suggestedOutOfScopeList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      // Add suggested items not already in unsupportedWork
                      const combined = Array.from(
                        new Set([...unsupportedWork, ...suggestedOutOfScopeList])
                      );
                      setUnsupportedWork(combined);
                    }}
                    className="text-[11px] font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Auto-Add Out-of-Scope Suggestions
                  </button>
                )}
              </div>

              <CascadingChipAutocomplete
                label=""
                placeholder="Type to add prohibited work item or pick from suggestions..."
                items={unsupportedWork}
                onChange={setUnsupportedWork}
                catalogSuggestions={suggestedOutOfScopeList}
                badgeColor="rose"
                helperText="The Copilot will safeguard your boundaries and decline or flag inquiries requiring these services."
              />
            </div>
          </div>
        )}

        {/* Step 3: Base Rates & Pricing */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Step 3: Base Financial & Pricing Parameters
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Define your minimum project engagement budget and hourly billing rate.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Minimum Project Budget ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minProjectPrice}
                  onChange={(e) => setMinProjectPrice(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-violet-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Inquiries below this threshold will be flagged.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Hourly Billing Rate ($ USD / hr)
                </label>
                <input
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-violet-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used for time & materials cost estimations.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Rules & Tone */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-600" />
                Step 4: AI Communication Tone & Business Terms
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Set how your generated client responses sound and specify standard payment terms.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-700">
                Default Response Tone
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'friendly', label: 'Friendly', desc: 'Warm, encouraging & approachable' },
                  { id: 'formal', label: 'Formal', desc: 'Corporate & structured' },
                  { id: 'concise', label: 'Concise', desc: 'Direct, brief & bulleted' },
                  { id: 'detailed', label: 'Detailed', desc: 'Comprehensive breakdown' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCommunicationTone(t.id as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      communicationTone === t.id
                        ? 'bg-violet-50 border-violet-600 text-violet-900 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs">{t.label}</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-[11px] font-semibold text-slate-700">
                Default Terms & Business Policies
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())}
                  placeholder="e.g. 50% upfront deposit before starting work"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {businessRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-slate-800 text-xs"
                  >
                    <span>• {rule}</span>
                    <button
                      type="button"
                      onClick={() => setBusinessRules(businessRules.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Confirmation */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Step 5: Review Knowledge Profile
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Verify your configured capability matrix before activating your AI Copilot.
              </p>
            </div>

            <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs">
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="font-semibold text-slate-600">Category:</span>
                <span className="font-bold text-violet-700">
                  {categories.length > 0 ? categories.join(', ') : 'None selected'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="font-semibold text-slate-600">Specializations:</span>
                <span className="font-bold text-slate-800">
                  {specializations.length > 0 ? specializations.join(', ') : 'General'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="font-semibold text-slate-600">Primary Role:</span>
                <span className="font-bold text-slate-800">{profession || 'Freelance Specialist'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="font-semibold text-slate-600">Skills ({skills.length}):</span>
                <span className="text-slate-700 max-w-xs text-right truncate">
                  {skills.length > 0 ? skills.join(', ') : 'None configured'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="font-semibold text-slate-600">Out-of-Scope ({unsupportedWork.length}):</span>
                <span className="text-rose-700 max-w-xs text-right truncate">
                  {unsupportedWork.length > 0 ? unsupportedWork.join(', ') : 'None configured'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-600">Pricing Base:</span>
                <span className="font-mono font-bold text-emerald-700">
                  Min ${minProjectPrice} • ${hourlyRate}/hr
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {step > 1 ? (
            <button
              type="button"
              disabled={isSavingStep || isSubmitting}
              onClick={() => {
                setValidationError(null);
                setApiError(null);
                setStep(step - 1);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div>
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-slate-400 hover:text-slate-600 text-xs transition cursor-pointer"
                >
                  Skip for now
                </button>
              )}
            </div>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={isSavingStep || isSubmitting}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs shadow-violet-600/30 disabled:opacity-60"
            >
              {isSavingStep ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving & Continuing...</span>
                </>
              ) : (
                <>
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting || isSavingStep}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-xs shadow-emerald-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Activating Copilot...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Setup & Enter Copilot</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
