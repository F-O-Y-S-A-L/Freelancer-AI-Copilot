import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Calendar,
  Clock,
  MessageSquare,
  User,
  ArrowRight,
  CheckCircle2,
  FileText,
  AlertCircle,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { IFollowUp, ITemplate } from '../../shared/types';
import { api } from '../../api/client';
import { useFollowUps } from '../../context/FollowUpContext';
import { useToast } from '../../context/ToastContext';

interface FollowUpModalProps {
  followUp: IFollowUp | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectInquiry?: (inquiryId: string) => void;
  defaultMode?: 'compose' | 'schedule' | 'snooze';
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  followUp,
  isOpen,
  onClose,
  onSelectInquiry,
  defaultMode = 'compose',
}) => {
  const {
    generateFollowUpDraft,
    sendFollowUpAction,
    scheduleFollowUpAction,
    snoozeFollowUpAction,
    actionLoading,
  } = useFollowUps();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'compose' | 'schedule' | 'snooze'>(defaultMode);
  const [tone, setTone] = useState<'friendly' | 'formal' | 'concise' | 'detailed'>(
    followUp?.tone || 'friendly'
  );
  const [message, setMessage] = useState<string>(
    followUp?.generatedMessage || ''
  );
  const [notes, setNotes] = useState<string>(followUp?.notes || '');
  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [scheduledDateTime, setScheduledDateTime] = useState<string>('');
  const [snoozeDateTime, setSnoozeDateTime] = useState<string>('');
  const [showContext, setShowContext] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && followUp) {
      setMode(defaultMode);
      setTone(followUp.tone || 'friendly');
      setMessage(followUp.generatedMessage || '');
      setNotes(followUp.notes || '');

      // Load templates for template picker
      api.getTemplates().then((res) => {
        if (res.success && res.data) {
          setTemplates(res.data);
        }
      });

      // Default schedule datetime (tomorrow 9am)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      setScheduledDateTime(tomorrow.toISOString().slice(0, 16));

      // Default snooze datetime (3 days from now)
      const inThreeDays = new Date();
      inThreeDays.setDate(inThreeDays.getDate() + 3);
      inThreeDays.setHours(9, 0, 0, 0);
      setSnoozeDateTime(inThreeDays.toISOString().slice(0, 16));
    }
  }, [isOpen, followUp, defaultMode]);

  if (!isOpen || !followUp) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateFollowUpDraft({
        followUpId: followUp.id || followUp._id,
        inquiryId: followUp.inquiryId,
        tone,
        templateId: selectedTemplateId || undefined,
        notes: notes.trim() || undefined,
      });

      if (res && res.generatedMessage) {
        setMessage(res.generatedMessage);
        showToast('AI follow-up draft generated. Review and customize before sending.', 'success');
      } else {
        showToast('Could not generate draft. You can write your own message below.', 'info');
      }
    } catch {
      showToast('Error generating AI reply.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const t = templates.find((tpl) => tpl.id === templateId || tpl._id === templateId);
    if (t) {
      // Replace placeholders like {{clientName}} with actual client name
      let replaced = t.content.replace(/\{\{clientName\}\}/gi, followUp.clientName || 'there');
      replaced = replaced.replace(/\{\{subject\}\}/gi, followUp.subject || 'project');
      setMessage(replaced);
      showToast(`Applied "${t.title}" template`, 'info');
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      showToast('Please enter a follow-up message before sending.', 'info');
      return;
    }
    setIsSending(true);
    try {
      const targetId = followUp.id || followUp._id;
      const success = await sendFollowUpAction(targetId!, message.trim());
      if (success) {
        showToast('Follow-up reply sent and conversation updated!', 'success');
        onClose();
      } else {
        showToast('Failed to send follow-up.', 'error');
      }
    } catch {
      showToast('An error occurred while sending the follow-up.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDateTime) {
      showToast('Please select a valid reminder date & time.', 'info');
      return;
    }
    const targetId = followUp.id || followUp._id;
    const success = await scheduleFollowUpAction(targetId!, new Date(scheduledDateTime).toISOString(), notes);
    if (success) {
      showToast(`Follow-up reminder scheduled for ${new Date(scheduledDateTime).toLocaleString()}`, 'success');
      onClose();
    } else {
      showToast('Failed to schedule follow-up.', 'error');
    }
  };

  const handleSnoozeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snoozeDateTime) {
      showToast('Please select a valid snooze date & time.', 'info');
      return;
    }
    const targetId = followUp.id || followUp._id;
    const success = await snoozeFollowUpAction(targetId!, new Date(snoozeDateTime).toISOString(), notes);
    if (success) {
      showToast(`Follow-up snoozed until ${new Date(snoozeDateTime).toLocaleString()}`, 'success');
      onClose();
    } else {
      showToast('Failed to snooze follow-up.', 'error');
    }
  };

  const setQuickSchedule = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(9, 0, 0, 0);
    setScheduledDateTime(d.toISOString().slice(0, 16));
  };

  const setQuickSnooze = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(9, 0, 0, 0);
    setSnoozeDateTime(d.toISOString().slice(0, 16));
  };

  return (
    <div
      id="followup-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="followup-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-semibold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-slate-900">
                  Follow-up: {followUp.clientName}
                </h3>
                {followUp.sourceChannel && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {followUp.sourceChannel}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                {followUp.subject || 'Project discussion'}
              </p>
            </div>
          </div>
          <button
            id="close-followup-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/30 px-6 pt-2">
          <button
            id="followup-mode-compose-tab"
            onClick={() => setMode('compose')}
            className={`flex items-center space-x-2 py-2.5 px-4 font-medium text-xs border-b-2 transition-all ${
              mode === 'compose'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate & Send</span>
          </button>
          <button
            id="followup-mode-schedule-tab"
            onClick={() => setMode('schedule')}
            className={`flex items-center space-x-2 py-2.5 px-4 font-medium text-xs border-b-2 transition-all ${
              mode === 'schedule'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Reminder</span>
          </button>
          <button
            id="followup-mode-snooze-tab"
            onClick={() => setMode('snooze')}
            className={`flex items-center space-x-2 py-2.5 px-4 font-medium text-xs border-b-2 transition-all ${
              mode === 'snooze'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Snooze</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Conversation Snapshot */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Conversation Context
              </span>
              <div className="flex items-center space-x-2">
                {onSelectInquiry && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectInquiry(followUp.inquiryId);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
                  >
                    View Thread
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowContext(!showContext)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  {showContext ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {showContext && (
              <div className="space-y-2 text-xs">
                {followUp.lastClientMessageText && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/60 text-slate-700">
                    <span className="font-medium text-slate-900 block mb-1 text-[11px] text-slate-500 uppercase tracking-wide">
                      {followUp.clientName}'s Message:
                    </span>
                    <p className="line-clamp-3 text-slate-600 whitespace-pre-wrap">
                      {followUp.lastClientMessageText}
                    </p>
                  </div>
                )}

                {followUp.lastUserReplyText && (
                  <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 text-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-blue-900 text-[11px] uppercase tracking-wide">
                        Your Last Reply Sent:
                      </span>
                      <span className="text-[11px] text-blue-600 font-normal">
                        {new Date(followUp.lastUserReplyAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-slate-600 whitespace-pre-wrap">
                      {followUp.lastUserReplyText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mode 1: Compose / AI Generate Mode */}
          {mode === 'compose' && (
            <div className="space-y-4">
              {/* Controls bar: Tone & Templates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tone of Voice
                  </label>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
                    {(['friendly', 'formal', 'concise', 'detailed'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTone(t)}
                        className={`py-1 text-xs font-medium rounded capitalize transition-all ${
                          tone === t
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Apply Template (Optional)
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleApplyTemplate(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Choose a template...</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id || tpl._id} value={tpl.id || tpl._id}>
                        {tpl.title} ({tpl.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Extra instructions */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Specific Focus or Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Mention that I'm booking projects for next week, or offer a quick 10-min call"
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* AI Draft Trigger Button */}
              <div className="flex items-center justify-between">
                <button
                  id="generate-ai-followup-btn"
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || actionLoading}
                  className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium shadow-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Crafting Follow-up...' : message ? 'Regenerate Draft with AI' : 'Generate AI Follow-up Draft'}</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  {message.length} characters
                </span>
              </div>

              {/* Message Editor */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Review & Edit Follow-up Message:
                </label>
                <textarea
                  id="followup-message-editor"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write or generate a polite follow-up message..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans leading-relaxed text-slate-800"
                />
              </div>

              {/* Non-destructive Workflow Disclaimer */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 text-amber-800 text-[11px]">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Workflow Safety: AI generation never sends messages automatically. You have full control to edit every word before clicking Send.
                </span>
              </div>
            </div>
          )}

          {/* Mode 2: Schedule Reminder Mode */}
          {mode === 'schedule' && (
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <label className="block text-xs font-semibold text-slate-800">
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickSchedule(1)}
                    className="p-2.5 text-xs text-center border border-slate-200 bg-white rounded-lg hover:border-blue-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    Tomorrow (24h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickSchedule(2)}
                    className="p-2.5 text-xs text-center border border-slate-200 bg-white rounded-lg hover:border-blue-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    In 2 Days (48h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickSchedule(3)}
                    className="p-2.5 text-xs text-center border border-slate-200 bg-white rounded-lg hover:border-blue-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    In 3 Days (72h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickSchedule(7)}
                    className="p-2.5 text-xs text-center border border-slate-200 bg-white rounded-lg hover:border-blue-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    In 1 Week
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Custom Reminder Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reminder Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Check if they released the revised wireframes"
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </form>
          )}

          {/* Mode 3: Snooze Mode */}
          {mode === 'snooze' && (
            <form onSubmit={handleSnoozeSubmit} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <label className="block text-xs font-semibold text-slate-800">
                  Quick Snooze Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickSnooze(1)}
                    className="p-2.5 text-xs text-center border border-slate-200 bg-white rounded-lg hover:border-blue-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    Snooze 1 Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickSnooze(3)}
                    className="p-2.5 text-xs text-center border border-slate-200 bg-white rounded-lg hover:border-blue-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    Snooze 3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickSnooze(7)}
                    className="p-2.5 text-xs text-center border border-slate-200 bg-white rounded-lg hover:border-blue-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    Snooze 1 Week
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Snooze Until Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={snoozeDateTime}
                  onChange={(e) => setSnoozeDateTime(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <button
            id="cancel-followup-modal-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            {mode === 'compose' && (
              <>
                <button
                  id="schedule-from-compose-btn"
                  type="button"
                  onClick={() => setMode('schedule')}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
                >
                  Schedule Later
                </button>
                <button
                  id="send-followup-btn"
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || !message.trim() || actionLoading}
                  className="flex items-center space-x-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending Reply...' : 'Send Follow-up Now'}</span>
                </button>
              </>
            )}

            {mode === 'schedule' && (
              <button
                id="submit-schedule-btn"
                type="button"
                onClick={handleScheduleSubmit}
                disabled={actionLoading || !scheduledDateTime}
                className="flex items-center space-x-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Confirm Schedule</span>
              </button>
            )}

            {mode === 'snooze' && (
              <button
                id="submit-snooze-btn"
                type="button"
                onClick={handleSnoozeSubmit}
                disabled={actionLoading || !snoozeDateTime}
                className="flex items-center space-x-2 px-4 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-sm transition-all"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Confirm Snooze</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
