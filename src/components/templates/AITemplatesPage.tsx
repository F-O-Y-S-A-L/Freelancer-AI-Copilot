import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutTemplate,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Check,
  Send,
  Clock,
  Tag,
  RefreshCw,
  FileText,
  X,
  MessageSquare,
  Sparkles,
  Filter,
  AlertCircle,
} from "lucide-react";
import { api } from "../../api/client";
import { ITemplate, TemplateCategory } from "../../shared/types";
import { useInquiry } from "../../context/InquiryContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { ConfirmModal } from "../ui/ConfirmModal";
import {
  renderTemplate,
  buildTemplateContext,
} from "../../shared/templateRenderer";

const STANDARD_CATEGORIES: TemplateCategory[] = [
  "First Response",
  "Follow-up",
  "Pricing",
  "Project Details",
  "Revision",
  "Delivery",
  "Thank You",
  "Custom",
];

interface AITemplatesPageProps {
  onUseTemplate?: (template: ITemplate) => void;
  onNavigateTab?: (
    tab:
      | "inquiries"
      | "templates"
      | "knowledge"
      | "clients"
      | "analytics"
      | "settings",
  ) => void;
}

export const AITemplatesPage: React.FC<AITemplatesPageProps> = ({
  onUseTemplate,
  onNavigateTab,
}) => {
  const { setDraft, activeInquiry } = useInquiry();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<ITemplate | null>(
    null,
  );
  const [formTitle, setFormTitle] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("First Response");
  const [formCustomCategory, setFormCustomCategory] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formContent, setFormContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const currentContext = useMemo(
    () => buildTemplateContext({ inquiry: activeInquiry, user }),
    [activeInquiry, user],
  );

  // Delete Confirmation State
  const [deletingTemplate, setDeletingTemplate] = useState<ITemplate | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch templates from server
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.getTemplates();
      if (res.success && res.data) {
        setTemplates(res.data);
      } else {
        showToast(res.error || "Failed to load templates", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error loading templates", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Compute all available categories from standard list + any custom ones created by user
  const allCategories = useMemo(() => {
    const customSet = new Set<string>();
    templates.forEach((t) => {
      if (
        t.category &&
        !STANDARD_CATEGORIES.includes(t.category as TemplateCategory)
      ) {
        customSet.add(t.category);
      }
    });
    return [...STANDARD_CATEGORIES, ...Array.from(customSet)];
  }, [templates]);

  // Filter templates by search query and category
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory =
        selectedCategory === "all" ||
        t.category?.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        t.content.toLowerCase().includes(query) ||
        (t.category && t.category.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormTitle("");
    setFormCategory("First Response");
    setFormCustomCategory("");
    setFormDescription("");
    setFormContent("");
    setFormError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (template: ITemplate) => {
    setEditingTemplate(template);
    setFormTitle(template.title);
    if (STANDARD_CATEGORIES.includes(template.category as TemplateCategory)) {
      setFormCategory(template.category);
      setFormCustomCategory("");
    } else {
      setFormCategory("Custom");
      setFormCustomCategory(template.category || "");
    }
    setFormDescription(template.description || "");
    setFormContent(template.content);
    setFormError("");
    setIsModalOpen(true);
  };

  // Handle Form Submit (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const trimmedTitle = formTitle.trim();
    const templateContent = formContent;
    const resolvedCategory =
      formCategory === "Custom"
        ? formCustomCategory.trim() || "Custom"
        : formCategory;

    if (!trimmedTitle) {
      setFormError("Template title cannot be empty.");
      return;
    }
    if (!templateContent.trim()) {
      setFormError("Template content cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTemplate) {
        // Update existing template
        const targetId = editingTemplate.id || (editingTemplate as any)._id;
        const res = await api.updateTemplate(targetId, {
          title: trimmedTitle,
          category: resolvedCategory,
          description: formDescription.trim(),
          content: templateContent,
        });

        if (res.success && res.data) {
          setTemplates((prev) =>
            prev.map((t) =>
              (t.id || (t as any)._id) === targetId ? res.data! : t,
            ),
          );
          showToast("Template updated successfully", "success");
          setIsModalOpen(false);
        } else {
          setFormError(res.error || "Failed to update template");
        }
      } else {
        // Create new template
        const res = await api.createTemplate({
          title: trimmedTitle,
          category: resolvedCategory,
          description: formDescription.trim(),
          content: templateContent,
        });

        if (res.success && res.data) {
          setTemplates((prev) => [res.data!, ...prev]);
          showToast("Template created successfully", "success");
          setIsModalOpen(false);
        } else {
          setFormError(res.error || "Failed to create template");
        }
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Template
  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;
    const targetId = deletingTemplate.id || (deletingTemplate as any)._id;
    setIsDeleting(true);
    try {
      const res = await api.deleteTemplate(targetId);
      if (res.success) {
        setTemplates((prev) =>
          prev.filter((t) => (t.id || (t as any)._id) !== targetId),
        );
        showToast("Template deleted successfully", "success");
      } else {
        showToast(res.error || "Failed to delete template", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error deleting template", "error");
    } finally {
      setIsDeleting(false);
      setDeletingTemplate(null);
    }
  };

  // Handle Use Template
  const handleUseTemplate = (template: ITemplate) => {
    const resolvedContent = renderTemplate(template.content, currentContext);
    setDraft(resolvedContent);

    if (onUseTemplate) {
      onUseTemplate({ ...template, content: resolvedContent });
    } else if (onNavigateTab) {
      onNavigateTab("inquiries");
    }

    showToast(
      `Template "${template.title}" loaded into composer draft.`,
      "success",
    );
  };

  // Copy template content to clipboard
  const handleCopyContent = (template: ITemplate) => {
    const textToCopy = renderTemplate(template.content, currentContext);
    navigator.clipboard.writeText(textToCopy);
    const tid = template.id || (template as any)._id;
    setCopiedId(tid);
    showToast("Template copied to clipboard", "info");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper for category badge color styling
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "First Response":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "Follow-up":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Pricing":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Project Details":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Revision":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Delivery":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "Thank You":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Format date helper
  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <LayoutTemplate className="w-4 h-4 text-violet-600" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              AI Templates
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Create, manage, and use reusable message templates for rapid,
            professional client communications.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-violet-600/20 transition flex items-center justify-center space-x-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Discovery & Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search templates by title, content, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 shadow-2xs transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full text-xs scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition cursor-pointer ${
              selectedCategory === "all"
                ? "bg-violet-600 text-white shadow-2xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All ({templates.length})
          </button>
          {allCategories.map((cat) => {
            const count = templates.filter(
              (t) => t.category?.toLowerCase() === cat.toLowerCase(),
            ).length;
            const isSelected =
              selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition cursor-pointer ${
                  isSelected
                    ? "bg-violet-600 text-white shadow-2xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat} {count > 0 ? `(${count})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Templates Display */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-violet-600" />
          <span className="text-xs font-semibold text-slate-600">
            Loading your template library...
          </span>
        </div>
      ) : filteredTemplates.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-12 text-center bg-white border border-slate-200/90 rounded-2xl space-y-6 shadow-xs">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200/80 text-violet-600 flex items-center justify-center mx-auto shadow-2xs">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {searchQuery || selectedCategory !== "all"
                ? "No templates match your search"
                : "No Templates Saved Yet"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search terms or clearing the category filter."
                : "Save your frequently used replies, client follow-ups, and project agreements to respond to new inquiries in seconds."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {searchQuery || selectedCategory !== "all" ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Template</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Template Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const tid = template.id || (template as any)._id;
            const isCopied = copiedId === tid;

            return (
              <div
                key={tid}
                className="bg-white border border-slate-200/90 hover:border-violet-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-xs transition"
              >
                {/* Top: Category & Action Buttons */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                        template.category,
                      )}`}
                    >
                      {template.category || "Custom"}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleCopyContent(template)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Copy template content"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(template)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition cursor-pointer"
                        title="Edit template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingTemplate(template)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                      {template.title}
                    </h3>
                    {template.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {template.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Body: Content Preview Box */}
                <div className="space-y-1.5">
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-wrap line-clamp-5 max-h-36 overflow-y-auto">
                    {renderTemplate(template.content, currentContext)}
                  </div>
                </div>

                {/* Bottom Bar: Timestamp & Use Template CTA */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {formatTimestamp(
                        template.updatedAt || template.createdAt,
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUseTemplate(template)}
                    className="px-3.5 py-1.5 bg-violet-50 hover:bg-violet-600 text-violet-700 hover:text-white border border-violet-200 hover:border-violet-600 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Use Template</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  {editingTemplate ? (
                    <Edit2 className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {editingTemplate ? "Edit Template" : "Create AI Template"}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {editingTemplate
                      ? "Modify your saved template details and content"
                      : "Define a reusable response pattern for future client conversations"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSubmitForm}
              className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1"
            >
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              {/* Title & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Template Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scope Clarification Response"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500 transition cursor-pointer"
                  >
                    {STANDARD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom category input if 'Custom' selected */}
              {formCategory === "Custom" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Custom Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Milestone Delivery, Onboarding..."
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500 transition"
                  />
                </div>
              )}

              {/* Description (Optional) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Short Purpose / Description{" "}
                  <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Used when client sends vague requirements without clear deliverables"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              {/* Template Content Editor */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    Template Content
                  </span>

                  <span className="text-[10px] font-mono text-slate-400">
                    {formContent.length} chars
                  </span>
                </div>

                <textarea
                  ref={contentTextareaRef}
                  rows={8}
                  required
                  placeholder="Write your reusable message template here."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 leading-relaxed resize-y font-mono transition"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-violet-600/20 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {editingTemplate ? "Update Template" : "Save Template"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingTemplate)}
        title="Delete Template"
        message={`Are you sure you want to permanently delete "${deletingTemplate?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Template"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTemplate(null)}
      />
    </div>
  );
};
