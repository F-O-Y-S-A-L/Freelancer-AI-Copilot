import React, { useState } from "react";
import {
  User,
  Mail,
  MessageSquare,
  Check,
  Save,
  Send,
  Sparkles,
  Trash2,
  Clock,
  FileText,
  Loader2,
  Star,
  MoreVertical,
  Paperclip,
  Smile,
  Download,
  Image as ImageIcon,
  LayoutTemplate,
  ChevronDown,
} from "lucide-react";
import { useInquiry } from "../../context/InquiryContext";
import { useNotifications } from "../../context/NotificationContext";
import { useToast } from "../../context/ToastContext";
import { ConfirmModal } from "../ui/ConfirmModal";
import { IClientAttachment, IInquiry, ITemplate } from "../../shared/types";
import { api } from "../../api/client";

function getConversationTimeline(inquiry: IInquiry): Array<{
  id: string;
  sender: "client" | "freelancer";
  type: "text" | "screenshot";
  text?: string;
  screenshotData?: string;
  screenshotMimeType?: string;
  fileName?: string;
  createdAt: string;
}> {
  if (inquiry.conversationHistory && inquiry.conversationHistory.length > 0) {
    return inquiry.conversationHistory;
  }

  const history: Array<{
    id: string;
    sender: "client" | "freelancer";
    type: "text" | "screenshot";
    text?: string;
    screenshotData?: string;
    screenshotMimeType?: string;
    fileName?: string;
    createdAt: string;
  }> = [];

  const createdAt = inquiry.createdAt
    ? new Date(inquiry.createdAt).toISOString()
    : new Date().toISOString();

  if (inquiry.clientAttachments && inquiry.clientAttachments.length > 0) {
    inquiry.clientAttachments.forEach((att, idx) => {
      history.push({
        id: att.id || `att_${idx}`,
        sender: "client",
        type: "screenshot",
        screenshotData: att.data,
        screenshotMimeType: att.mimeType,
        fileName: att.name || `Fiverr_Conversation_Screenshot_${idx + 1}.png`,
        text:
          idx === 0
            ? inquiry.extractedMessageText ||
              (inquiry.rawMessage?.startsWith("[Fiverr Screenshot")
                ? ""
                : inquiry.rawMessage)
            : undefined,
        createdAt: att.createdAt || createdAt,
      });
    });
  } else if (inquiry.screenshotData) {
    history.push({
      id: "att_initial",
      sender: "client",
      type: "screenshot",
      screenshotData: inquiry.screenshotData,
      screenshotMimeType: inquiry.screenshotMimeType || "image/png",
      fileName: "Fiverr_Conversation_Screenshot.png",
      text:
        inquiry.extractedMessageText ||
        (inquiry.rawMessage?.startsWith("[Fiverr Screenshot")
          ? ""
          : inquiry.rawMessage),
      createdAt,
    });
  } else if (inquiry.rawMessage) {
    history.push({
      id: "msg_initial_text",
      sender: "client",
      type: "text",
      text: inquiry.extractedMessageText || inquiry.rawMessage,
      createdAt,
    });
  }

  if (inquiry.sentReply && inquiry.sentReply.trim()) {
    history.push({
      id: "msg_initial_reply",
      sender: "freelancer",
      type: "text",
      text: inquiry.sentReply,
      createdAt: inquiry.updatedAt
        ? new Date(inquiry.updatedAt).toISOString()
        : createdAt,
    });
  }

  return history;
}

function getLatestTimestamp(inquiry: IInquiry): string {
  let latestTime = 0;
  let latestIso = "";

  const checkAndSet = (dateStr?: string) => {
    if (!dateStr) return;
    const time = new Date(dateStr).getTime();
    if (!isNaN(time) && time > latestTime) {
      latestTime = time;
      latestIso = dateStr;
    }
  };

  checkAndSet(inquiry.createdAt);
  checkAndSet(inquiry.updatedAt);

  if (inquiry.conversationHistory && inquiry.conversationHistory.length > 0) {
    for (const msg of inquiry.conversationHistory) {
      checkAndSet(msg.createdAt);
    }
  }

  if (inquiry.clientAttachments && inquiry.clientAttachments.length > 0) {
    for (const att of inquiry.clientAttachments) {
      checkAndSet(att.createdAt);
    }
  }

  return latestIso || inquiry.updatedAt || inquiry.createdAt || "";
}

function formatDynamicTime(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return "Yesterday";
    }

    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 2 && diffDays < 7) {
      return `${diffDays} days ago`;
    }

    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export const ConversationPane: React.FC = () => {
  const {
    activeInquiry,
    draft,
    selectedTone,
    isSavingDraft,
    isGeneratingReply,
    setDraft,
    setSelectedTone,
    saveDraft,
    updateStatus,
    markAsReadAction,
    markAsUnreadAction,
    toggleStarAction,
    deleteInquiry,
    generateReplyAction,
    sendReplyAction,
    analyzeInquiryAction,
  } = useInquiry();

  const { syncInquiryRead } = useNotifications();
  const { showToast } = useToast();

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [userTemplates, setUserTemplates] = useState<ITemplate[]>([]);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const manuallyMarkedUnreadRef = React.useRef<string | null>(null);
  const lastActiveInquiryIdRef = React.useRef<string | null>(null);

  const activeInquiryId = activeInquiry ? activeInquiry.id || (activeInquiry as any)._id : null;
  const isStarred = Boolean(activeInquiry?.starred);

  // Auto-mark conversation as read when opened and viewed by the user
  React.useEffect(() => {
    if (!activeInquiry || !activeInquiryId) return;

    // If active inquiry changed, reset manual unread lock
    if (lastActiveInquiryIdRef.current !== activeInquiryId) {
      lastActiveInquiryIdRef.current = activeInquiryId;
      manuallyMarkedUnreadRef.current = null;
    }

    const isUnread =
      activeInquiry.read === false ||
      (activeInquiry.read === undefined && activeInquiry.status === 'new');

    if (isUnread && manuallyMarkedUnreadRef.current !== activeInquiryId) {
      if (typeof markAsReadAction === 'function') {
        markAsReadAction(activeInquiryId);
      }
      if (typeof syncInquiryRead === 'function') {
        syncInquiryRead(activeInquiryId);
      }
    }
  }, [
    activeInquiryId,
    activeInquiry?.read,
    activeInquiry?.status,
    markAsReadAction,
    syncInquiryRead,
  ]);

  // Load user templates for quick insertion
  React.useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await api.getTemplates();
        if (res.success && res.data) {
          setUserTemplates(res.data);
        }
      } catch {
        // silent fail for quick template loading
      }
    };
    loadTemplates();
  }, []);

  const handleApplyTemplate = (tpl: ITemplate) => {
    setDraft(tpl.content);
    setIsTemplateMenuOpen(false);
    showToast(`Template "${tpl.title}" inserted into draft.`, 'success');
  };

  const handleScreenshotSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      showToast(
        "Please upload an image screenshot (PNG, JPG, JPEG, WebP)",
        "error",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(
        "File size exceeds 5MB limit. Please upload a smaller screenshot.",
        "error",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      const mimeType = file.type || "image/png";

      showToast("Analyzing new screenshot for current inquiry...", "info");
      const targetId = activeInquiry?.id || (activeInquiry as any)?._id;
      const success = await analyzeInquiryAction(targetId, {
        screenshotData: base64Data,
        screenshotMimeType: mimeType,
        fileName: file.name,
      });

      if (success) {
        showToast("Inquiry analysis updated with new screenshot!", "success");
      } else {
        showToast(
          "Failed to analyze screenshot. Existing inquiry and analysis preserved.",
          "error",
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Tone options
  const toneOptions: Array<{
    id: "friendly" | "formal" | "concise" | "detailed";
    label: string;
  }> = [
    { id: "formal", label: "Formal" },
    { id: "friendly", label: "Friendly" },
    { id: "concise", label: "Short" },
    { id: "detailed", label: "Detailed" },
  ];

  const handleSaveDraft = async () => {
    if (!draft || !draft.trim()) {
      showToast("Cannot save an empty draft", "error");
      return;
    }
    const success = await saveDraft(draft, selectedTone);
    if (success) {
      setSaveSuccess(true);
      showToast("Draft saved successfully", "success");
      setTimeout(() => setSaveSuccess(false), 2000);
    } else {
      showToast("Failed to save draft", "error");
    }
  };

  const handleToneChange = async (
    newTone: "friendly" | "formal" | "concise" | "detailed",
  ) => {
    setSelectedTone(newTone);
    if (activeInquiry?.analysisResult) {
      showToast(`Generating ${newTone} reply draft...`, "info");
      const ok = await generateReplyAction(newTone);
      if (ok) {
        showToast(`AI reply generated in ${newTone} tone`, "success");
      } else {
        showToast("Failed to generate AI reply", "error");
      }
    }
  };

  const handleGenerateReply = async () => {
    showToast(`Generating ${selectedTone} reply draft...`, "info");
    const ok = await generateReplyAction(selectedTone);
    if (ok) {
      showToast("AI reply draft generated", "success");
    } else {
      showToast("Failed to generate AI reply", "error");
    }
  };

  const handleAnalyzeAndDraft = async () => {
    showToast("Running Gemini AI inquiry analysis...", "info");
    const ok = await analyzeInquiryAction();
    if (ok) {
      showToast("Inquiry analyzed and draft created", "success");
    } else {
      showToast("Failed to analyze inquiry", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeInquiry) return;
    const targetId = activeInquiry.id || (activeInquiry as any)._id;
    setIsDeleteModalOpen(false);
    const success = await deleteInquiry(targetId);
    if (success) {
      showToast("Inquiry deleted", "success");
    } else {
      showToast("Failed to delete inquiry", "error");
    }
  };

  const handleSendReply = async () => {
    const textToSend = draft.trim();
    if (!textToSend) {
      showToast("Please enter a message before sending", "error");
      return;
    }
    const success = await sendReplyAction(textToSend);
    if (success) {
      showToast("Reply sent and marked as Replied", "success");
    } else {
      showToast("Failed to send reply. Please try again.", "error");
    }
  };

  if (!activeInquiry) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 text-slate-500">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
          <MessageSquare className="w-6 h-6 text-violet-600" />
        </div>
        <h3 className="text-xs font-bold text-slate-800">
          No Conversation Selected
        </h3>
        <p className="text-[11px] text-slate-500 max-w-xs mt-1">
          Select an inquiry from the left list or create a new inquiry to manage
          client communication.
        </p>
      </div>
    );
  }

  const clientInitials = activeInquiry.clientName
    ? activeInquiry.clientName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "JD";

  return (
    <div className="h-full flex flex-col bg-slate-50/60 overflow-hidden border-r border-slate-200/90">
      {/* Client Header Bar */}
      <div className="p-3.5 border-b border-slate-200/90 bg-white flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {clientInitials}
          </div>
          <div className="space-y-0.5 overflow-hidden">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {activeInquiry.clientName}
              </h2>
              <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200/60">
                {activeInquiry.sourceChannel || "Fiverr"}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="font-medium text-slate-500 font-mono truncate">
                {formatDynamicTime(getLatestTimestamp(activeInquiry))}
              </span>
              {activeInquiry.clientEmail && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-slate-400 truncate">
                    {activeInquiry.clientEmail}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 shrink-0 relative">
          <button
            onClick={() => {
              if (activeInquiryId) {
                toggleStarAction(activeInquiryId);
              }
            }}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isStarred
                ? "bg-amber-50 text-amber-500 border-amber-200"
                : "text-slate-400 hover:text-slate-600 bg-slate-50 border-slate-200"
            }`}
            title={isStarred ? "Unstar Conversation" : "Star Conversation"}
          >
            <Star className={`w-4 h-4 ${isStarred ? "fill-current" : ""}`} />
          </button>

          {/* 3-Dot Options Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
              title="More Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 text-xs text-slate-700 font-medium animate-in fade-in slide-in-from-top-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    if (activeInquiryId) {
                      manuallyMarkedUnreadRef.current = activeInquiryId;
                      if (typeof markAsUnreadAction === 'function') {
                        markAsUnreadAction(activeInquiryId);
                      }
                    }
                    showToast("Marked as unread", "info");
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mark as Unread</span>
                </button>
                <button
                  onClick={() => {
                    updateStatus("replied");
                    showToast("Marked as replied", "info");
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark as Replied</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Conversation</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Message Alert Banner */}
      <div className="bg-violet-50 text-violet-700 border-b border-violet-100 py-1.5 px-4 text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-2xs">
        <span>This is a new message</span>
      </div>

      {/* Scrollable Conversation Workspace */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Chronological Conversation History Timeline */}
        {(() => {
          const timeline = getConversationTimeline(activeInquiry);
          let screenshotCounter = 0;
          return timeline.map((msg, idx) => {
            const isClient = msg.sender === "client";
            const msgTime = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";
            const screenshotNumber =
              msg.type === "screenshot" ? ++screenshotCounter : 0;

            if (isClient) {
              return (
                <div key={msg.id || idx} className="space-y-1 max-w-2xl">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {clientInitials}
                        </div>
                        <span className="text-xs font-bold text-slate-900">
                          {activeInquiry.clientName}
                        </span>
                        {msg.type === "screenshot" && (
                          <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Paperclip className="w-3 h-3 text-violet-600" />
                            <span>Client Screenshot #{screenshotNumber}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {msgTime}
                      </span>
                    </div>

                    {/* Screenshot display if screenshot type */}
                    {msg.type === "screenshot" && msg.screenshotData && (
                      <div className="space-y-2">
                        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                              <img
                                src={msg.screenshotData}
                                alt={
                                  msg.fileName ||
                                  `Client Screenshot #${screenshotNumber}`
                                }
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {msg.fileName ||
                                  `Fiverr_Conversation_Screenshot_${screenshotNumber}.png`}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Client Attachment
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const win = window.open();
                              if (win) {
                                win.document.write(
                                  `<img src="${msg.screenshotData}" style="max-width:100%; height:auto;" />`,
                                );
                              }
                            }}
                            className="p-1.5 text-violet-600 hover:bg-violet-100 rounded-lg transition cursor-pointer shrink-0"
                            title="View Full Screenshot"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Text body if available */}
                    {Boolean(msg.text && msg.text.trim()) && (
                      <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans selection:bg-violet-100">
                        {msg.text}
                      </div>
                    )}
                  </div>
                </div>
              );
            } else {
              // Freelancer sent reply bubble
              return (
                <div key={msg.id || idx} className="space-y-1 max-w-xl ml-auto">
                  <div className="bg-emerald-600 text-white rounded-2xl p-4 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-emerald-500/60 pb-1.5 text-[10px] font-bold text-emerald-100">
                      <span>You (Freelancer)</span>
                      <span className="font-mono">{msgTime}</span>
                    </div>
                    <div className="text-xs leading-relaxed font-sans whitespace-pre-wrap">
                      {msg.text}
                    </div>
                    <div className="text-[10px] text-emerald-100 text-right font-mono font-medium pt-0.5">
                      ✓✓ Sent
                    </div>
                  </div>
                </div>
              );
            }
          });
        })()}

        {/* AI Suggested Reply Card */}
        <div className="bg-[#F8FAFF] border border-violet-200/80 rounded-2xl p-4 space-y-3.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22px"
                height="22px"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M5.25 4.5C4.00736 4.5 3 5.50736 3 6.75V15.75C3 16.9926 4.00736 18 5.25 18H6V21C6 21.291 6.16835 21.5558 6.43188 21.6792C6.69542 21.8026 7.00658 21.7625 7.23014 21.5762L11.5215 18H18.75C19.9926 18 21 16.9926 21 15.75V6.75C21 5.50736 19.9926 4.5 18.75 4.5H5.25Z"
                  fill="#3A52EE"
                />
              </svg>
              <h3 className="text-sm font-bold text-violet-600">
                AI Suggested Reply (English)
              </h3>
            </div>

            {/* Tone selector pills */}
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-[10px]">
              <span className="text-slate-400 px-1 font-medium hidden sm:inline">
                Tone:
              </span>
              {toneOptions.map((tone) => {
                const isToneSelected = selectedTone === tone.id;
                return (
                  <button
                    key={tone.id}
                    onClick={() => handleToneChange(tone.id)}
                    disabled={isGeneratingReply}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer disabled:opacity-50 ${
                      isToneSelected
                        ? "bg-violet-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tone.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reply Draft Textarea */}
          <div className="relative">
            <textarea
              rows={8}
              placeholder="Write your response proposal here or modify your AI generated draft..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 leading-relaxed resize-none font-sans shadow-2xs"
            />
            <div className="absolute right-3 bottom-3 text-[10px] font-mono text-slate-400">
              {draft.length} chars
            </div>
          </div>

          {/* Draft Actions Bar */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center space-x-2">
              {Boolean(draft && draft.trim().length > 0) && (
                <button
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-violet-600" />
                      <span>Save Draft</span>
                    </>
                  )}
                </button>
              )}

              {/* Quick Template Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Insert a saved message template"
                >
                  <LayoutTemplate className="w-3.5 h-3.5 text-violet-600" />
                  <span>Templates</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isTemplateMenuOpen && (
                  <div className="absolute left-0 bottom-full mb-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-40 animate-in fade-in zoom-in-95">
                    <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                      Insert Saved Template
                    </div>
                    {userTemplates.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-500 text-center">
                        No saved templates yet. Go to AI Templates tab to create one.
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-0.5">
                        {userTemplates.map((tpl) => (
                          <button
                            key={tpl.id || (tpl as any)._id}
                            type="button"
                            onClick={() => handleApplyTemplate(tpl)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-violet-50 text-xs text-slate-800 hover:text-violet-700 flex flex-col transition cursor-pointer group"
                          >
                            <span className="font-semibold truncate">{tpl.title}</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-violet-500 truncate">
                              {tpl.category}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Regenerate or Analyze Button */}
            {activeInquiry.analysisResult ? (
              <button
                onClick={handleGenerateReply}
                disabled={isGeneratingReply}
                className="px-3.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {isGeneratingReply ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                )}
                <span>Re-Generate</span>
              </button>
            ) : (
              <button
                onClick={handleAnalyzeAndDraft}
                className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Analyze & Draft</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Reply Composer Box */}
      <div className="p-3 bg-white border-t border-slate-200/90 flex items-center space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleScreenshotSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isGeneratingReply}
          className="p-2 text-violet-600 hover:bg-violet-50 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center space-x-1"
          title="Upload new client message screenshot for this inquiry"
        >
          <ImageIcon className="w-5 h-5 text-violet-600" />
        </button>

        <input
          type="text"
          placeholder="Type your reply..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 transition"
        />

        <button
          onClick={handleSendReply}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-violet-600/20 transition flex items-center space-x-1.5 cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Inquiry"
        message="Are you sure you want to permanently delete this inquiry? This action cannot be undone."
        confirmLabel="Delete Inquiry"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
