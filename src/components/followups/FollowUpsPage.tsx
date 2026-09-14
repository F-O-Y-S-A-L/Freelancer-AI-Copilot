import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Search,
  Filter,
  RefreshCw,
  Eye,
  BellOff,
  SlidersHorizontal,
  ChevronRight,
  MessageSquare,
  ArrowUpRight,
  MoreVertical,
  Inbox,
  Check,
} from 'lucide-react';
import { useFollowUps } from '../../context/FollowUpContext';
import { IFollowUp, FollowUpStatus } from '../../shared/types';
import { FollowUpModal } from './FollowUpModal';
import { useToast } from '../../context/ToastContext';

interface FollowUpsPageProps {
  onSelectInquiry?: (inquiryId: string) => void;
}

function formatElapsedText(dateString: string): string {
  if (!dateString) return 'Recently';
  const lastReply = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - lastReply.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  const remainingHours = diffInHours % 24;

  if (diffInDays === 0) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }
  if (remainingHours === 0) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
  return `${diffInDays}d ${remainingHours}h ago`;
}

export const FollowUpsPage: React.FC<FollowUpsPageProps> = ({ onSelectInquiry }) => {
  const {
    followUps,
    summary,
    thresholdDays,
    loading,
    actionLoading,
    activeFilter,
    searchQuery,
    fetchFollowUps,
    dismissFollowUpAction,
    setActiveFilter,
    setSearchQuery,
  } = useFollowUps();
  const { showToast } = useToast();

  const [selectedFollowUp, setSelectedFollowUp] = useState<IFollowUp | null>(null);
  const [modalMode, setModalMode] = useState<'compose' | 'schedule' | 'snooze'>('compose');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due_desc' | 'due_asc' | 'client'>('due_desc');

  const openModal = (followUp: IFollowUp, mode: 'compose' | 'schedule' | 'snooze' = 'compose') => {
    setSelectedFollowUp(followUp);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const success = await dismissFollowUpAction(id);
    if (success) {
      showToast('Follow-up reminder dismissed.', 'info');
    } else {
      showToast('Could not dismiss follow-up.', 'error');
    }
  };

  // Channels list for filtering
  const channels = useMemo(() => {
    const set = new Set<string>();
    followUps.forEach((f) => {
      if (f.sourceChannel) set.add(f.sourceChannel);
    });
    return Array.from(set);
  }, [followUps]);

  // Client-side channel and search filtering + sorting
  const displayedFollowUps = useMemo(() => {
    return followUps
      .filter((item) => {
        if (channelFilter !== 'all' && item.sourceChannel !== channelFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchClient = item.clientName.toLowerCase().includes(q);
          const matchSubject = (item.subject || '').toLowerCase().includes(q);
          const matchMsg = (item.lastClientMessageText || '').toLowerCase().includes(q);
          const matchReply = (item.lastUserReplyText || '').toLowerCase().includes(q);
          return matchClient || matchSubject || matchMsg || matchReply;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'client') {
          return a.clientName.localeCompare(b.clientName);
        }
        const timeA = new Date(a.dueAt || a.createdAt).getTime();
        const timeB = new Date(b.dueAt || b.createdAt).getTime();
        return sortBy === 'due_desc' ? timeB - timeA : timeA - timeB;
      });
  }, [followUps, channelFilter, searchQuery, sortBy]);

  return (
    <div id="followups-page" className="flex-1 flex flex-col h-full bg-slate-50/70 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Follow-up Messages
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-100">
                Threshold: {thresholdDays} {thresholdDays === 1 ? 'day' : 'days'} ({thresholdDays * 24}h)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Identify client conversations waiting for a reply, review AI-crafted follow-ups, and keep deals active.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="refresh-followups-btn"
              onClick={() => fetchFollowUps()}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
              title="Re-check active conversations"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Status</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-6 py-6 space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Due Metric */}
          <div
            id="metric-card-due"
            onClick={() => setActiveFilter('due')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeFilter === 'due'
                ? 'bg-rose-50/70 border-rose-200 shadow-sm ring-2 ring-rose-500/20'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Due Now</span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{summary.dueCount}</span>
              <span className="text-xs text-rose-600 font-medium">≥ {thresholdDays}d waiting</span>
            </div>
          </div>

          {/* Scheduled Metric */}
          <div
            id="metric-card-scheduled"
            onClick={() => setActiveFilter('scheduled')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeFilter === 'scheduled'
                ? 'bg-blue-50/70 border-blue-200 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Scheduled</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{summary.scheduledCount}</span>
              <span className="text-xs text-blue-600 font-medium">Future reminders</span>
            </div>
          </div>

          {/* Completed Metric */}
          <div
            id="metric-card-completed"
            onClick={() => setActiveFilter('completed')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeFilter === 'completed'
                ? 'bg-emerald-50/70 border-emerald-200 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Completed</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{summary.completedCount}</span>
              <span className="text-xs text-emerald-600 font-medium">Follow-ups sent</span>
            </div>
          </div>

          {/* No Response Metric */}
          <div
            id="metric-card-no-response"
            onClick={() => setActiveFilter('all')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-100/90 border-slate-300 shadow-sm'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Pending Response</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{summary.noResponseCount}</span>
              <span className="text-xs text-amber-700 font-medium">Awaiting client</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
            {[
              { key: 'all', label: 'All' },
              { key: 'due', label: 'Due' },
              { key: 'scheduled', label: 'Scheduled' },
              { key: 'completed', label: 'Completed' },
              { key: 'snoozed', label: 'Snoozed' },
              { key: 'dismissed', label: 'Dismissed' },
            ].map((tab) => (
              <button
                key={tab.key}
                id={`filter-tab-${tab.key}`}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeFilter === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Channel Filters */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-followups-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search follow-ups..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {channels.length > 0 && (
              <select
                id="channel-filter-select"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
              >
                <option value="all">All Channels</option>
                {channels.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            )}

            <select
              id="sort-followups-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              <option value="due_desc">Due Date (Recent first)</option>
              <option value="due_asc">Due Date (Oldest first)</option>
              <option value="client">Client Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Follow-ups List */}
        <div className="space-y-3">
          {displayedFollowUps.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                {activeFilter === 'due'
                  ? 'All caught up! No follow-ups are due right now.'
                  : activeFilter === 'scheduled'
                  ? 'No follow-up reminders scheduled.'
                  : activeFilter === 'completed'
                  ? 'No completed follow-ups recorded yet.'
                  : 'No follow-up records found matching your filters.'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {activeFilter === 'due'
                  ? `Active inquiries where you sent a reply and client hasn't responded for ${thresholdDays} ${thresholdDays === 1 ? 'day' : 'days'} (${thresholdDays * 24}h) will automatically appear here.`
                  : 'Adjust filters or sync status to view ongoing conversation follow-ups.'}
              </p>
            </div>
          ) : (
            displayedFollowUps.map((item) => {
              const targetId = item.id || item._id;
              const isDue = item.status === 'due';
              const isScheduled = item.status === 'scheduled';
              const isCompleted = item.status === 'completed';
              const isSnoozed = item.status === 'snoozed';
              const isDismissed = item.status === 'dismissed';

              return (
                <div
                  key={targetId}
                  id={`followup-item-${targetId}`}
                  className="bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-sm p-4.5 transition-all space-y-3"
                >
                  {/* Top Row: Client & Status Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {item.clientName ? item.clientName.substring(0, 2) : 'CL'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {item.clientName}
                          </h4>
                          {item.sourceChannel && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                              {item.sourceChannel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate max-w-md">
                          {item.subject || 'Project Inquiry'}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill & Timestamps */}
                    <div className="flex items-center space-x-2 self-start sm:self-center">
                      {isDue && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                          <Clock className="w-3 h-3" />
                          <span>Due ({formatElapsedText(item.lastUserReplyAt)})</span>
                        </span>
                      )}
                      {isScheduled && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Scheduled:{' '}
                            {item.scheduledFor ? new Date(item.scheduledFor).toLocaleDateString() : 'Upcoming'}
                          </span>
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Sent / Completed</span>
                        </span>
                      )}
                      {isSnoozed && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          <Clock className="w-3 h-3" />
                          <span>
                            Snoozed until{' '}
                            {item.snoozedUntil ? new Date(item.snoozedUntil).toLocaleDateString() : 'Later'}
                          </span>
                        </span>
                      )}
                      {isDismissed && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          <BellOff className="w-3 h-3" />
                          <span>Dismissed</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Content: Conversation Context Snippets */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {item.lastClientMessageText && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                        <span className="font-semibold text-slate-500 uppercase text-[10px] block mb-1">
                          Last Client Message:
                        </span>
                        <p className="line-clamp-2 text-slate-600">
                          {item.lastClientMessageText}
                        </p>
                      </div>
                    )}

                    {item.lastUserReplyText && (
                      <div className="p-2.5 rounded-lg bg-blue-50/40 border border-blue-100/60 text-slate-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-blue-800 uppercase text-[10px]">
                            Your Last Reply:
                          </span>
                          <span className="text-[10px] text-blue-600">
                            {formatElapsedText(item.lastUserReplyAt)}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-slate-600">
                          {item.lastUserReplyText}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Notes / Generated Draft snippet if available */}
                  {item.generatedMessage && !isCompleted && (
                    <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs">
                      <span className="font-semibold text-indigo-900 text-[10px] uppercase block mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        AI Draft Prepared:
                      </span>
                      <p className="line-clamp-2 text-slate-700 italic">
                        "{item.generatedMessage}"
                      </p>
                    </div>
                  )}

                  {/* Bottom Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      {onSelectInquiry && (
                        <button
                          type="button"
                          onClick={() => onSelectInquiry(item.inquiryId)}
                          className="inline-flex items-center space-x-1 text-xs text-slate-600 hover:text-blue-600 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Thread</span>
                        </button>
                      )}

                      {!isDismissed && !isCompleted && (
                        <button
                          type="button"
                          onClick={(e) => handleDismiss(e, targetId!)}
                          disabled={actionLoading}
                          className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                          title="Dismiss reminder"
                        >
                          <BellOff className="w-3.5 h-3.5" />
                          <span>Dismiss</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {!isCompleted && (
                        <>
                          <button
                            type="button"
                            onClick={() => openModal(item, 'snooze')}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
                          >
                            Snooze
                          </button>
                          <button
                            type="button"
                            onClick={() => openModal(item, 'schedule')}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
                          >
                            Schedule
                          </button>
                          <button
                            type="button"
                            onClick={() => openModal(item, 'compose')}
                            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{item.generatedMessage ? 'Review & Send Follow-up' : 'Generate Follow-up'}</span>
                          </button>
                        </>
                      )}
                      {isCompleted && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Follow-up Sent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Follow-up Review / Composer Modal */}
      <FollowUpModal
        followUp={selectedFollowUp}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFollowUp(null);
        }}
        onSelectInquiry={onSelectInquiry}
        defaultMode={modalMode}
      />
    </div>
  );
};
