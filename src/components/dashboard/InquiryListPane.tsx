import React from 'react';
import {
  Search,
  Plus,
  Filter,
  Inbox,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useInquiry } from '../../context/InquiryContext';
import { IInquiry } from '../../shared/types';

interface InquiryListPaneProps {
  onOpenNewModal: () => void;
}

// Avatar palette for dynamic initials styling
const AVATAR_PALETTES = [
  'bg-violet-600 text-white',
  'bg-slate-600 text-white',
  'bg-emerald-600 text-white',
  'bg-blue-600 text-white',
  'bg-rose-500 text-white',
  'bg-amber-600 text-white',
  'bg-teal-600 text-white',
  'bg-indigo-600 text-white',
];

const getAvatarColor = (name: string): string => {
  if (!name) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
};

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getLatestTimestamp = (inquiry: IInquiry): string => {
  let latestTime = 0;
  let latestIso = '';

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

  return latestIso || inquiry.updatedAt || inquiry.createdAt || '';
};

const formatDynamicTime = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Yesterday';
    }

    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 2 && diffDays < 7) {
      return `${diffDays} days ago`;
    }

    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const InquiryListPane: React.FC<InquiryListPaneProps> = ({ onOpenNewModal }) => {
  const {
    inquiries,
    filteredInquiries,
    activeInquiry,
    loading,
    error,
    searchQuery,
    statusFilter,
    sort,
    selectInquiry,
    setSearchQuery,
    setStatusFilter,
    setSort,
    fetchInquiries,
  } = useInquiry();

  const unreadCount = inquiries.filter(
    (i) => i.read === false || (i.read === undefined && i.status === 'new')
  ).length;

  const getStatusBadge = (status: IInquiry['status']) => {
    switch (status) {
      case 'new':
      case 'analyzed':
        return (
          <span className="inline-flex items-center text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md">
            Requires Reply
          </span>
        );
      case 'replied':
        return (
          <span className="inline-flex items-center text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-md gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            Replied
          </span>
        );
      case 'converted':
        return (
          <span className="inline-flex items-center text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/80 px-2 py-0.5 rounded-md">
            Converted
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/80 px-2 py-0.5 rounded-md">
            Declined
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200/90 overflow-hidden">
      {/* Top Header Row */}
      <div className="px-3.5 pt-3.5 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Conversations</h2>
          <span className="text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">
            {inquiries.length}
          </span>
        </div>

        <button
          onClick={onOpenNewModal}
          className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-violet-600/20 transition flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Inquiry</span>
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 px-3 shrink-0">
        <button
          onClick={() => setStatusFilter('all')}
          className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
            statusFilter === 'all'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All ({inquiries.length})
        </button>
        <button
          onClick={() => setStatusFilter('unread')}
          className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
            statusFilter === 'unread'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-3 pb-2 flex items-center space-x-2 shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/90 border border-slate-200/90 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 transition shadow-2xs"
          />
        </div>

        <button
          onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}
          className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
          title={`Sort: ${sort === 'newest' ? 'Newest First' : 'Oldest First'}`}
        >
          <Filter className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Conversation Cards Scrollable List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl animate-pulse flex items-start space-x-2.5"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                    <div className="h-2.5 bg-slate-200 rounded w-12" />
                  </div>
                  <div className="h-2.5 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2 my-4">
            <AlertCircle className="w-5 h-5 text-rose-600 mx-auto" />
            <div className="text-xs text-rose-800 font-medium">{error}</div>
            <button
              onClick={() => fetchInquiries()}
              className="text-[11px] underline text-rose-700 hover:text-rose-900 cursor-pointer"
            >
              Retry loading
            </button>
          </div>
        )}

        {!loading && !error && filteredInquiries.length === 0 && (
          <div className="p-8 text-center space-y-3 my-8">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">No conversations found</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
                Client conversations will appear here when you receive or create an inquiry.
              </p>
            </div>
            {searchQuery || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-[11px] text-violet-600 font-semibold hover:underline cursor-pointer"
              >
                Clear search & filters
              </button>
            ) : (
              <button
                onClick={onOpenNewModal}
                className="px-3.5 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-xs font-semibold hover:bg-violet-100 transition cursor-pointer"
              >
                + Create Inquiry
              </button>
            )}
          </div>
        )}

        {!loading &&
          !error &&
          filteredInquiries.map((inquiry) => {
            const inqId = inquiry.id || (inquiry as any)._id;
            const activeId = activeInquiry ? activeInquiry.id || (activeInquiry as any)._id : null;
            const isSelected = inqId === activeId;
            const avatarBg = getAvatarColor(inquiry.clientName);
            const initials = getInitials(inquiry.clientName);
            const isNew = inquiry.read === false || (inquiry.read === undefined && inquiry.status === 'new');
            const latestTimestamp = getLatestTimestamp(inquiry);
            const displayTime = formatDynamicTime(latestTimestamp);
            const previewText =
              inquiry.extractedMessageText ||
              inquiry.rawMessage ||
              (inquiry.conversationHistory && inquiry.conversationHistory.length > 0
                ? inquiry.conversationHistory[inquiry.conversationHistory.length - 1].text
                : '') ||
              '';

            return (
              <div
                key={inqId}
                onClick={() => selectInquiry(inqId)}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-start space-x-2.5 ${
                  isSelected
                    ? 'bg-white border-2 border-violet-500 shadow-xs ring-2 ring-violet-500/10'
                    : 'bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                {/* Fixed Left Column: Avatar */}
                <div className="relative shrink-0 pt-0.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${avatarBg}`}>
                    {initials}
                  </div>
                  {isNew && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
                  )}
                </div>

                {/* Content Column: Name, Time, Subtitle, Message, Status */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Row 1: Client Name, Source Badge, New Badge */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {inquiry.clientName}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/60 shrink-0">
                        {inquiry.sourceChannel || 'Fiverr'}
                      </span>
                      {isNew && (
                        <span className="text-[9px] font-bold bg-violet-600 text-white px-1.5 py-0.2 rounded-full shrink-0">
                          New
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Real last conversation activity time */}
                  {displayTime && (
                    <div className="text-[10px] text-slate-400 font-medium font-mono truncate">
                      {displayTime}
                    </div>
                  )}

                  {/* Row 3: Message preview */}
                  {previewText && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {previewText}
                    </p>
                  )}

                  {/* Row 4: Status Badge directly below message */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {getStatusBadge(inquiry.status)}
                    {inquiry.sourceType === 'screenshot' && (
                      <span className="text-[9px] font-medium text-slate-500 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-violet-600" />
                        <span>AI Vision</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

