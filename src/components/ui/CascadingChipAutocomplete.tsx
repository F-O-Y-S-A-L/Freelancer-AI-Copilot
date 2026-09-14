import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Plus, Sparkles, Check, ChevronDown } from 'lucide-react';

interface CascadingChipAutocompleteProps {
  label: string;
  placeholder?: string;
  items?: string[];
  onChange: (items: string[]) => void;
  catalogSuggestions?: string[];
  helperText?: string;
  badgeColor?: 'violet' | 'amber' | 'emerald' | 'rose' | 'slate' | 'blue';
  id?: string;
  showQuickPills?: boolean;
}

export const CascadingChipAutocomplete: React.FC<CascadingChipAutocompleteProps> = ({
  label,
  placeholder = 'Type to search or add custom...',
  items = [],
  onChange,
  catalogSuggestions = [],
  helperText,
  badgeColor = 'violet',
  id,
  showQuickPills = true,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Safe normalized items list
  const safeItems = useMemo(() => {
    return Array.isArray(items) ? items.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
  }, [items]);

  // Safe normalized catalog suggestions list
  const safeCatalogSuggestions = useMemo(() => {
    return Array.isArray(catalogSuggestions)
      ? catalogSuggestions.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
  }, [catalogSuggestions]);

  // Normalize selected items for fast duplicate checks
  const selectedNormalized = useMemo(() => {
    return new Set(safeItems.map((i) => i.toLowerCase().trim()));
  }, [safeItems]);

  // Filter suggestions from catalog that are not yet selected
  const availableCatalog = useMemo(() => {
    return safeCatalogSuggestions.filter(
      (catItem) => !selectedNormalized.has(catItem.toLowerCase().trim())
    );
  }, [safeCatalogSuggestions, selectedNormalized]);

  // Filtered dropdown matches based on typed input
  const matches = useMemo(() => {
    const trimmedInput = inputValue.trim().toLowerCase();
    if (!trimmedInput) {
      return availableCatalog.slice(0, 8);
    }
    return availableCatalog
      .filter((catItem) =>
        catItem.toLowerCase().includes(trimmedInput)
      )
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(trimmedInput);
        const bStarts = b.toLowerCase().startsWith(trimmedInput);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 10);
  }, [inputValue, availableCatalog]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddItem = (itemToAdd: string) => {
    if (typeof itemToAdd !== 'string') return;
    const trimmed = itemToAdd.trim();
    if (!trimmed) return;

    if (!selectedNormalized.has(trimmed.toLowerCase())) {
      if (typeof onChange === 'function') {
        onChange([...safeItems, trimmed]);
      }
    }
    setInputValue('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleRemoveItem = (indexToRemove: number) => {
    if (typeof onChange === 'function') {
      const next = safeItems.filter((_, idx) => idx !== indexToRemove);
      onChange(next);
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
      setHighlightedIndex((prev) =>
        prev < matches.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : matches.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && matches[highlightedIndex]) {
        handleAddItem(matches[highlightedIndex]);
      } else if (inputValue.trim()) {
        handleAddItem(inputValue);
      }
    } else if (e.key === ',' || e.key === 'Tab') {
      if (inputValue.trim()) {
        e.preventDefault();
        if (highlightedIndex >= 0 && matches[highlightedIndex]) {
          handleAddItem(matches[highlightedIndex]);
        } else {
          handleAddItem(inputValue);
        }
      }
    } else if (e.key === 'Backspace' && !inputValue && safeItems.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      handleRemoveItem(safeItems.length - 1);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Color classes mapping
  const colorMap = {
    violet: {
      chip: 'bg-violet-50 text-violet-700 border-violet-200/90 hover:bg-violet-100/80',
      removeBtn: 'hover:bg-violet-200 text-violet-600',
      quickPill: 'bg-slate-100 hover:bg-violet-50 text-slate-700 hover:text-violet-700 border-slate-200 hover:border-violet-300',
      highlight: 'bg-violet-50 text-violet-800',
    },
    amber: {
      chip: 'bg-amber-50 text-amber-800 border-amber-200/90 hover:bg-amber-100/80',
      removeBtn: 'hover:bg-amber-200 text-amber-700',
      quickPill: 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-200 hover:border-amber-300',
      highlight: 'bg-amber-50 text-amber-800',
    },
    emerald: {
      chip: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100/80',
      removeBtn: 'hover:bg-emerald-200 text-emerald-700',
      quickPill: 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200 hover:border-emerald-300',
      highlight: 'bg-emerald-50 text-emerald-800',
    },
    rose: {
      chip: 'bg-rose-50 text-rose-800 border-rose-200/90 hover:bg-rose-100/80',
      removeBtn: 'hover:bg-rose-200 text-rose-700',
      quickPill: 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-800 border-slate-200 hover:border-rose-300',
      highlight: 'bg-rose-50 text-rose-800',
    },
    blue: {
      chip: 'bg-sky-50 text-sky-800 border-sky-200/90 hover:bg-sky-100/80',
      removeBtn: 'hover:bg-sky-200 text-sky-700',
      quickPill: 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border-slate-200 hover:border-sky-300',
      highlight: 'bg-sky-50 text-sky-800',
    },
    slate: {
      chip: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200/70',
      removeBtn: 'hover:bg-slate-300 text-slate-700',
      quickPill: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200',
      highlight: 'bg-slate-100 text-slate-900',
    },
  };

  const currentTheme = colorMap[badgeColor] || colorMap.violet;

  // Unselected top quick-add suggestions
  const topQuickPills = availableCatalog.slice(0, 8);

  return (
    <div className="space-y-1.5" ref={containerRef} id={id}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
          <span className="text-[11px] text-slate-400 font-normal">
            {safeItems.length} selected
          </span>
        </div>
      )}

      {/* Unified Input + Chips Container */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="min-h-11 w-full bg-white border border-slate-200 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500 transition-all flex flex-wrap items-center gap-1.5 cursor-text relative shadow-2xs"
      >
        {/* Selected Chips */}
        {safeItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${currentTheme.chip}`}
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveItem(index);
              }}
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition cursor-pointer ${currentTheme.removeBtn}`}
              title={`Remove ${item}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        {/* Inline Input Field */}
        <div className="flex-1 min-w-[140px] relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => {
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={safeItems.length === 0 ? placeholder : 'Add more...'}
            className="w-full bg-transparent border-none px-2 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && (matches.length > 0 || inputValue.trim().length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
            <div className="p-1 space-y-0.5">
              {matches.map((suggestion, idx) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleAddItem(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                    highlightedIndex === idx
                      ? currentTheme.highlight
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium">{suggestion}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    from catalog
                  </span>
                </button>
              ))}

              {/* Custom Item Option if not an exact match */}
              {inputValue.trim() &&
                !matches.some(
                  (m) =>
                    m.toLowerCase() === inputValue.trim().toLowerCase()
                ) &&
                !selectedNormalized.has(inputValue.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => handleAddItem(inputValue)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs bg-slate-50 text-slate-800 hover:bg-violet-50 hover:text-violet-700 border-t border-slate-100 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-violet-600" />
                      <span>
                        Add custom: <strong>"{inputValue.trim()}"</strong>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Press Enter</span>
                  </button>
                )}
            </div>
          </div>
        )}
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500 leading-normal">{helperText}</p>
      )}

      {/* Suggested Quick-Pills Shelf from Profession Catalog */}
      {showQuickPills && topQuickPills.length > 0 && (
        <div className="pt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-violet-500" /> Suggestions:
          </span>
          {topQuickPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => handleAddItem(pill)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition cursor-pointer ${currentTheme.quickPill}`}
            >
              <Plus className="w-2.5 h-2.5 opacity-60" />
              <span>{pill}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
