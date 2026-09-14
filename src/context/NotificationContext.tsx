import React, { createContext, useContext, useState, useEffect, useCallback, useTransition, useRef } from 'react';
import { INotification } from '../shared/types';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: INotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  toggleOpen: () => void;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsReadAction: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAllAsReadAction: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteNotificationAction: (id: string) => Promise<void>;
  syncInquiryRead: (inquiryId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpenState] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const isMarkingAllReadRef = useRef<boolean>(false);
  const prevIsOpenRef = useRef<boolean>(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getUnreadNotificationCount();
      if (res.success && res.data) {
        setUnreadCount(typeof res.data.count === 'number' ? res.data.count : 0);
      }
    } catch {
      // Background count fetch failure - non-blocking
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        startTransition(() => {
          if (isOpen) {
            // When panel is open, notifications in view are marked seen
            const seenNotifs = (res.data || []).map((n) => ({ ...n, read: true }));
            setNotifications(seenNotifs);
            setUnreadCount(0);
          } else {
            setNotifications(res.data || []);
            const unread = (res.data || []).filter((n) => !n.read).length;
            setUnreadCount(unread);
          }
        });
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isOpen]);

  // Initial fetch and periodic polling
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();

      // Poll unread count every 30 seconds
      const timer = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(timer);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setIsOpenState(false);
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    if (isMarkingAllReadRef.current) return;

    isMarkingAllReadRef.current = true;

    // Optimistic UI update - mark all as read and reset badge to 0 immediately
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await api.markAllNotificationsAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      // Re-sync on failure
      fetchNotifications();
    } finally {
      isMarkingAllReadRef.current = false;
    }
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    if (!id) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id || n._id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.markNotificationAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Re-sync on failure
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Auto-read on opening the notification panel (Facebook-style)
  const setIsOpen = useCallback((open: boolean | ((prev: boolean) => boolean)) => {
    setIsOpenState((prev) => {
      const nextState = typeof open === 'function' ? open(prev) : open;
      if (!prev && nextState) {
        // Transitioning from closed to open
        fetchNotifications();
        if (unreadCount > 0 || notifications.some((n) => !n.read)) {
          markAllAsRead();
        }
      }
      return nextState;
    });
  }, [fetchNotifications, unreadCount, notifications, markAllAsRead]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [setIsOpen]);

  // Secondary effect to guarantee auto-read whenever isOpen becomes true
  useEffect(() => {
    if (!prevIsOpenRef.current && isOpen && isAuthenticated) {
      if (unreadCount > 0 || notifications.some((n) => !n.read)) {
        markAllAsRead();
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, isAuthenticated, unreadCount, notifications, markAllAsRead]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!id) return;

    // Check if was unread before deleting
    let wasUnread = false;
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id || n._id === id);
      if (target && !target.read) wasUnread = true;
      return prev.filter((n) => n.id !== id && n._id !== id);
    });

    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await api.deleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const syncInquiryRead = useCallback((inquiryId: string) => {
    if (!inquiryId) return;
    setNotifications((prev) => {
      let markedCount = 0;
      const updated = prev.map((n) => {
        if ((n.inquiryId === inquiryId || n.conversationId === inquiryId) && !n.read) {
          markedCount++;
          return { ...n, read: true };
        }
        return n;
      });
      if (markedCount > 0) {
        setUnreadCount((c) => Math.max(0, c - markedCount));
      }
      return updated;
    });
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        isOpen,
        setIsOpen,
        toggleOpen,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAsReadAction: markAsRead,
        markAllAsRead,
        markAllAsReadAction: markAllAsRead,
        deleteNotification,
        deleteNotificationAction: deleteNotification,
        syncInquiryRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
