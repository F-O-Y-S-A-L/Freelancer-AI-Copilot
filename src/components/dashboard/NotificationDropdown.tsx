import React, { useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Sparkles,
  Inbox,
  MessageCircle,
  Clock,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { INotification, NotificationType } from '../../shared/types';

interface NotificationDropdownProps {
  onSelectInquiry?: (inquiryId: string) => void;
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 0 || diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'new_inquiry':
      return {
        icon: Inbox,
        bgColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        badge: 'New Inquiry',
      };
    case 'client_replied':
      return {
        icon: MessageCircle,
        bgColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        badge: 'Client Replied',
      };
    case 'ai_analysis_completed':
      return {
        icon: Sparkles,
        bgColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        badge: 'AI Analysis',
      };
    case 'requires_reply':
      return {
        icon: Clock,
        bgColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
        badge: 'Reply Needed',
      };
    case 'followup_due':
      return {
        icon: Clock,
        bgColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
        badge: 'Follow-up Due',
      };
    default:
      return {
        icon: Bell,
        bgColor: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
        badge: 'Notification',
      };
  }
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onSelectInquiry,
}) => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isOpen,
    setIsOpen,
    toggleOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications();

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const handleItemClick = (notif: INotification) => {
    const notifId = notif.id || notif._id || '';
    if (!notif.read && notifId) {
      markAsRead(notifId);
    }

    if (notif.inquiryId && onSelectInquiry) {
      onSelectInquiry(notif.inquiryId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="btn-header-notifications"
        type="button"
        onClick={toggleOpen}
        className={`p-1.5 rounded-xl transition cursor-pointer relative ${
          isOpen
            ? 'bg-violet-100 text-violet-700'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
        title="Notifications"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span
            id="badge-unread-notifications-count"
            className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs animate-in fade-in zoom-in-75 duration-150"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          id="panel-notifications-dropdown"
          className="absolute right-0 mt-2.5 w-[380px] sm:w-[420px] bg-white rounded-2xl border border-slate-200/80 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col"
          style={{ maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  id="btn-mark-all-notifications-read"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-violet-700 hover:text-violet-800 hover:bg-violet-50 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => fetchNotifications()}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Refresh notifications"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer ml-0.5"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin text-violet-500" />
                <span className="text-xs font-medium">Loading notifications...</span>
              </div>
            ) : error && notifications.length === 0 ? (
              <div className="p-6 text-center text-rose-500 space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto opacity-80" />
                <p className="text-xs">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchNotifications()}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Check className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-800">
                    You're all caught up
                  </p>
                  <p className="text-xs text-slate-400 max-w-[240px]">
                    New inquiries, client replies, and AI updates will appear
                    here.
                  </p>
                </div>
              </div>
            ) : (
              notifications.map((notif) => {
                const notifId = notif.id || notif._id || '';
                const { icon: Icon, bgColor } = getNotificationIcon(notif.type);
                const isUnread = !notif.read;

                return (
                  <div
                    key={notifId}
                    id={`notification-item-${notifId}`}
                    onClick={() => handleItemClick(notif)}
                    className={`group relative p-3.5 transition flex items-start gap-3 select-none ${
                      isUnread
                        ? 'bg-violet-50/40 hover:bg-violet-50/80 cursor-pointer'
                        : 'bg-white hover:bg-slate-50/90 cursor-pointer'
                    }`}
                  >
                    {/* Unread indicator bar */}
                    {isUnread && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-violet-600 rounded-r" />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${bgColor}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-baseline justify-between gap-1 mb-0.5">
                        <h4
                          className={`text-xs truncate ${
                            isUnread
                              ? 'font-bold text-slate-900'
                              : 'font-medium text-slate-700'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p
                        className={`text-xs leading-relaxed line-clamp-2 ${
                          isUnread ? 'text-slate-700' : 'text-slate-500'
                        }`}
                      >
                        {notif.message}
                      </p>

                      {notif.inquiryId && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-violet-700 group-hover:text-violet-800">
                          <span>View inquiry</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Quick actions (visible on hover) */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0 self-center">
                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notifId);
                          }}
                          className="p-1.5 text-slate-400 hover:text-violet-700 hover:bg-violet-100 rounded-lg transition cursor-pointer"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notifId);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
