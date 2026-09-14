import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MASTER_CATEGORIES,
  MASTER_SERVICES,
  MASTER_PROFESSIONS,
  getServicesForCategories,
  getProfessionsForServices,
  getKnowledgeCatalogForProfessions,
  calculateAutomaticOutOfScope,
  ICategoryTaxonomy,
  IServiceTaxonomy,
  IProfessionTaxonomy,
} from '../../shared/knowledgeTaxonomy';
import { CascadingChipAutocomplete } from '../ui/CascadingChipAutocomplete';
import {
  Layers,
  Sparkles,
  Briefcase,
  Wrench,
  Ban,
  Check,
  ChevronDown,
  X,
  Plus,
  Info,
  ArrowRight,
  Code,
  Palette,
  Video,
  FileText,
  TrendingUp,
  Music,
  Database,
  Camera,
  Heart,
  HelpCircle
} from 'lucide-react';

interface CascadingKnowledgeSelectorProps {
  // State
  selectedCategories: string[];
  onChangeCategories: (categories: string[]) => void;
  selectedServices: string[];
  onChangeServices: (services: string[]) => void;
  primaryProfession: string;
  selectedProfessions: string[];
  onChangeProfessions: (professions: string[], primary: string) => void;
  skills: string[];
  onChangeSkills: (skills: string[]) => void;
  toolsAndFrameworks: string[];
  onChangeTools: (tools: string[]) => void;
  unsupportedWork: string[];
  onChangeUnsupportedWork: (unsupported: string[]) => void;
  
  // Customization
  variant?: 'wizard' | 'editor';
}

export const CascadingKnowledgeSelector: React.FC<CascadingKnowledgeSelectorProps> = ({
  selectedCategories = [],
  onChangeCategories,
  selectedServices = [],
  onChangeServices,
  primaryProfession = '',
  selectedProfessions = [],
  onChangeProfessions,
  skills = [],
  onChangeSkills,
  toolsAndFrameworks = [],
  onChangeTools,
  unsupportedWork = [],
  onChangeUnsupportedWork,
  variant = 'editor',
}) => {
  // Category Dropdown state
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Track items explicitly removed by the user from Out-of-Scope so we don't force re-add them
  const userRemovedOutOfScopeRef = useRef<Set<string>>(new Set());

  // Close category dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute category IDs from selected category names or IDs
  const activeCategoryIds = useMemo(() => {
    if (!selectedCategories || selectedCategories.length === 0) return [];
    return MASTER_CATEGORIES.filter(
      (c) =>
        selectedCategories.includes(c.id) ||
        selectedCategories.some(
          (sel) => sel.toLowerCase().trim() === c.name.toLowerCase().trim()
        )
    ).map((c) => c.id);
  }, [selectedCategories]);

  // Filter available services based on selected categories
  const availableServices = useMemo(() => {
    if (activeCategoryIds.length === 0) return [];
    return getServicesForCategories(activeCategoryIds);
  }, [activeCategoryIds]);

  // Filter available professions based on selected categories AND selected services
  const availableProfessions = useMemo(() => {
    if (activeCategoryIds.length === 0 || selectedServices.length === 0) return [];
    return getProfessionsForServices(activeCategoryIds, selectedServices);
  }, [activeCategoryIds, selectedServices]);

  // Retrieve Knowledge Catalog (Core Skills & Tools) for the selected professions
  // When no profession is selected, catalog suggestions are empty
  const knowledgeCatalog = useMemo(() => {
    const profs =
      selectedProfessions.length > 0
        ? selectedProfessions
        : primaryProfession
        ? [primaryProfession]
        : [];
    if (profs.length === 0) {
      return {
        professionId: '',
        professionName: '',
        coreSkills: [],
        toolsAndFrameworks: [],
        suggestedOutOfScope: [],
      };
    }
    return getKnowledgeCatalogForProfessions(profs);
  }, [selectedProfessions, primaryProfession]);

  // Automatically compute suggested out-of-scope services
  const handleAutoPopulateOutOfScope = (
    currentCategories: string[],
    currentServices: string[],
    currentProfessions: string[]
  ) => {
    if (
      currentCategories.length === 0 ||
      (currentServices.length === 0 && currentProfessions.length === 0)
    ) {
      return;
    }

    const catIds = MASTER_CATEGORIES.filter(
      (c) =>
        currentCategories.includes(c.id) ||
        currentCategories.some(
          (sel) => sel.toLowerCase().trim() === c.name.toLowerCase().trim()
        )
    ).map((c) => c.id);

    const autoSuggestions = calculateAutomaticOutOfScope(
      catIds,
      currentServices,
      currentProfessions
    );

    // Filter out items explicitly removed by the user
    const filtered = autoSuggestions.filter(
      (item) => !userRemovedOutOfScopeRef.current.has(item.toLowerCase().trim())
    );

    // Merge existing user out-of-scope with new suggestions without duplicates
    const combined = Array.from(
      new Set([...unsupportedWork, ...filtered])
    );

    onChangeUnsupportedWork(combined);
  };

  // Category Toggle
  const handleToggleCategory = (category: ICategoryTaxonomy) => {
    const isSelected =
      selectedCategories.includes(category.id) ||
      selectedCategories.includes(category.name);

    let nextCategories: string[];
    if (isSelected) {
      nextCategories = selectedCategories.filter(
        (c) => c !== category.id && c !== category.name
      );
    } else {
      nextCategories = [...selectedCategories, category.name];
    }
    onChangeCategories(nextCategories);

    // If all categories are removed, reset all dependent states
    if (nextCategories.length === 0) {
      onChangeServices([]);
      onChangeProfessions([], '');
      return;
    }

    // Filter out services that no longer belong to selected categories
    const nextCatIds = MASTER_CATEGORIES.filter(
      (c) =>
        nextCategories.includes(c.id) ||
        nextCategories.some(
          (sel) => sel.toLowerCase().trim() === c.name.toLowerCase().trim()
        )
    ).map((c) => c.id);

    const validServices = MASTER_SERVICES.filter((s) =>
      nextCatIds.includes(s.categoryId)
    ).map((s) => s.name);

    const nextServices = selectedServices.filter((s) =>
      validServices.some(
        (vs) => vs.toLowerCase().trim() === s.toLowerCase().trim()
      )
    );
    onChangeServices(nextServices);

    // Filter professions that match the remaining valid categories and services
    const validProfessions = getProfessionsForServices(nextCatIds, nextServices).map(
      (p) => p.name.toLowerCase().trim()
    );
    const nextProfessions = selectedProfessions.filter((p) =>
      validProfessions.includes(p.toLowerCase().trim())
    );
    const nextPrimary = nextProfessions.includes(primaryProfession)
      ? primaryProfession
      : nextProfessions[0] || '';
    onChangeProfessions(nextProfessions, nextPrimary);

    // Recalculate automatic out-of-scope
    handleAutoPopulateOutOfScope(nextCategories, nextServices, nextProfessions);
  };

  // Service Toggle
  const handleToggleService = (serviceName: string) => {
    const isSelected = selectedServices.some(
      (s) => s.toLowerCase().trim() === serviceName.toLowerCase().trim()
    );

    let nextServices: string[];
    if (isSelected) {
      nextServices = selectedServices.filter(
        (s) => s.toLowerCase().trim() !== serviceName.toLowerCase().trim()
      );
    } else {
      nextServices = [...selectedServices, serviceName];
    }
    onChangeServices(nextServices);

    if (nextServices.length === 0) {
      onChangeProfessions([], '');
      return;
    }

    // Filter professions to those valid for remaining services
    const validProfessions = getProfessionsForServices(
      activeCategoryIds,
      nextServices
    ).map((p) => p.name.toLowerCase().trim());

    const nextProfessions = selectedProfessions.filter((p) =>
      validProfessions.includes(p.toLowerCase().trim())
    );
    const nextPrimary = nextProfessions.includes(primaryProfession)
      ? primaryProfession
      : nextProfessions[0] || '';
    onChangeProfessions(nextProfessions, nextPrimary);

    // Recalculate out of scope
    handleAutoPopulateOutOfScope(
      selectedCategories,
      nextServices,
      nextProfessions
    );
  };

  // Profession Toggle
  const handleToggleProfession = (prof: IProfessionTaxonomy) => {
    const isSelected = selectedProfessions.some(
      (p) => p.toLowerCase().trim() === prof.name.toLowerCase().trim()
    );

    let nextProfessions: string[];
    let nextPrimary = primaryProfession;

    if (isSelected) {
      nextProfessions = selectedProfessions.filter(
        (p) => p.toLowerCase().trim() !== prof.name.toLowerCase().trim()
      );
      if (primaryProfession.toLowerCase().trim() === prof.name.toLowerCase().trim()) {
        nextPrimary = nextProfessions[0] || '';
      }
    } else {
      nextProfessions = [...selectedProfessions, prof.name];
      if (!nextPrimary) {
        nextPrimary = prof.name;
      }
    }

    onChangeProfessions(nextProfessions, nextPrimary);

    // Automatically suggest core skills and tools from this profession if current lists are empty
    const catalog = getKnowledgeCatalogForProfessions(nextProfessions);
    if (skills.length === 0 && catalog.coreSkills.length > 0) {
      onChangeSkills(catalog.coreSkills.slice(0, 8));
    }
    if (toolsAndFrameworks.length === 0 && catalog.toolsAndFrameworks.length > 0) {
      onChangeTools(catalog.toolsAndFrameworks.slice(0, 8));
    }

    // Recalculate out of scope
    handleAutoPopulateOutOfScope(
      selectedCategories,
      selectedServices,
      nextProfessions
    );
  };

  // Category Icon Renderer
  const renderCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Code':
        return <Code className="w-4 h-4 text-violet-600" />;
      case 'Palette':
        return <Palette className="w-4 h-4 text-fuchsia-600" />;
      case 'Video':
        return <Video className="w-4 h-4 text-rose-600" />;
      case 'FileText':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'TrendingUp':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'Music':
        return <Music className="w-4 h-4 text-cyan-600" />;
      case 'Briefcase':
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'Database':
        return <Database className="w-4 h-4 text-indigo-600" />;
      case 'Camera':
        return <Camera className="w-4 h-4 text-pink-600" />;
      case 'Heart':
        return <Heart className="w-4 h-4 text-teal-600" />;
      default:
        return <Layers className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Category Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center">
              1
            </span>
            <span>Professional Category</span>
            <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-slate-500">
            {selectedCategories.length === 0
              ? 'Choose a category to begin'
              : `${selectedCategories.length} selected`}
          </span>
        </div>

        {/* Selected Categories as interactive chips + Dropdown Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedCategories.map((catName) => {
            const cat = MASTER_CATEGORIES.find(
              (c) => c.name === catName || c.id === catName
            );
            return (
              <span
                key={catName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold shadow-xs transition-all"
              >
                {cat?.iconName && (
                  <span className="opacity-90">{renderCategoryIcon(cat.iconName)}</span>
                )}
                <span>{cat?.name || catName}</span>
                <button
                  type="button"
                  onClick={() => cat && handleToggleCategory(cat)}
                  className="w-4 h-4 rounded-full bg-violet-700 hover:bg-violet-800 text-white flex items-center justify-center transition cursor-pointer"
                  title="Remove category"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}

          {/* Category Dropdown Selector / Add Category Trigger */}
          <div className="relative" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className={`px-3.5 py-2 bg-white hover:bg-slate-50 border rounded-xl text-xs font-medium flex items-center justify-between gap-2.5 transition cursor-pointer shadow-2xs ${
                selectedCategories.length === 0
                  ? 'border-slate-300 hover:border-violet-500 text-slate-700 min-w-[240px]'
                  : 'border-dashed border-slate-300 hover:border-violet-400 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedCategories.length === 0 ? (
                  <>
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500 font-normal">
                      Select a professional category
                    </span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-violet-600" />
                    <span>Add Category</span>
                  </>
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 max-h-80 overflow-y-auto">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                  Supported Categories
                </div>
                {MASTER_CATEGORIES.map((cat) => {
                  const isSelected =
                    selectedCategories.includes(cat.id) ||
                    selectedCategories.includes(cat.name);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        handleToggleCategory(cat);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-violet-50 text-violet-800 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {renderCategoryIcon(cat.iconName)}
                        <span>{cat.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-violet-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Services / Specializations Selection (Only when category is selected) */}
      {selectedCategories.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center">
                2
              </span>
              <span>Services & Specializations</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500">
              {selectedServices.length} selected from {availableServices.length} in category
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Select the specific client services you deliver. Unselected services in this category will be automatically protected as out-of-scope.
          </p>

          {/* Service Pill Grid */}
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            {availableServices.map((srv) => {
              const isSelected = selectedServices.some(
                (s) => s.toLowerCase().trim() === srv.name.toLowerCase().trim()
              );
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => handleToggleService(srv.name)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-violet-50 text-violet-800 border-violet-300 font-semibold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {isSelected ? (
                    <Check className="w-3 h-3 text-violet-600 shrink-0" />
                  ) : (
                    <Plus className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                  <span>{srv.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Profession Selection (Only when both Category AND Service are selected) */}
      {selectedCategories.length > 0 && selectedServices.length > 0 && availableProfessions.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center">
                3
              </span>
              <span>Profession & Role Title</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Determines core skill catalogues and capability boundaries
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {availableProfessions.map((prof) => {
              const isSelected = selectedProfessions.some(
                (p) => p.toLowerCase().trim() === prof.name.toLowerCase().trim()
              );
              const isPrimary =
                primaryProfession.toLowerCase().trim() === prof.name.toLowerCase().trim();

              return (
                <div
                  key={prof.id}
                  onClick={() => handleToggleProfession(prof)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                    isSelected
                      ? 'bg-violet-50/80 border-violet-400 ring-1 ring-violet-400/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-violet-600" />
                      <span>{prof.name}</span>
                    </div>
                    {isPrimary && (
                      <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-violet-600 text-white">
                        Primary Title
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                      isSelected
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Profession Title Entry */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={primaryProfession}
              onChange={(e) => {
                onChangeProfessions(
                  selectedProfessions.length > 0 ? selectedProfessions : [e.target.value],
                  e.target.value
                );
              }}
              placeholder="Or enter custom profession title (e.g., Senior Full-Stack Next.js Architect)"
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
      )}

      {/* 4, 5, 6: Only rendered in full editor view (omitted in wizard Step 1 to keep Step 1 focused strictly on Category -> Services -> Profession) */}
      {variant !== 'wizard' && (
        <>
          {/* 4. Core Skills Autocomplete (Suggestions active only when a profession is selected) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <CascadingChipAutocomplete
              label="Core Skills & Competencies"
              placeholder="Type to search skills or add custom..."
              items={skills}
              onChange={onChangeSkills}
              catalogSuggestions={knowledgeCatalog.coreSkills}
              badgeColor="violet"
              helperText="Profession-aware autocomplete suggestions adapt automatically when a profession is selected. Type any custom skill and press Enter."
            />
          </div>

          {/* 5. Tools & Frameworks Autocomplete */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <CascadingChipAutocomplete
              label="Tools, Frameworks & Software"
              placeholder="Type to search tools or add custom..."
              items={toolsAndFrameworks}
              onChange={onChangeTools}
              catalogSuggestions={knowledgeCatalog.toolsAndFrameworks}
              badgeColor="blue"
              helperText="Software stack and technical libraries used to deliver client projects."
            />
          </div>

          {/* 6. Automatic & Explicit Out-of-Scope Services */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-slate-800">
                  Explicit Out-of-Scope Services
                </span>
              </div>
              {knowledgeCatalog.suggestedOutOfScope.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    userRemovedOutOfScopeRef.current.clear();
                    handleAutoPopulateOutOfScope(
                      selectedCategories,
                      selectedServices,
                      selectedProfessions
                    );
                  }}
                  className="text-[11px] font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1 transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Refresh Out-of-Scope Suggestions
                </button>
              )}
            </div>

            <CascadingChipAutocomplete
              label=""
              placeholder="Type to add prohibited service or select from suggestions..."
              items={unsupportedWork}
              onChange={(newItems) => {
                const removed = unsupportedWork.filter((oldItem) => !newItems.includes(oldItem));
                removed.forEach((r) => userRemovedOutOfScopeRef.current.add(r.toLowerCase().trim()));
                onChangeUnsupportedWork(newItems);
              }}
              catalogSuggestions={knowledgeCatalog.suggestedOutOfScope}
              badgeColor="rose"
              helperText="AI Copilot strictly safeguards your proposal boundaries. Any inquiries requiring these services will be politely flagged or declined."
            />
          </div>
        </>
      )}
    </div>
  );
};