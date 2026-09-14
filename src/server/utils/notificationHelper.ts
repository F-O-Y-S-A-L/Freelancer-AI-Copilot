import { Notification } from '../models/Notification.js';
import { isUsingMemoryDB, memoryStore } from '../config/db.js';

export interface CreateNotificationParams {
  userId: string;
  type: 'new_inquiry' | 'client_replied' | 'ai_analysis_completed' | 'requires_reply' | 'followup_due';
  title: string;
  message: string;
  inquiryId?: string;
  conversationId?: string;
}

export async function createNotificationHelper(params: CreateNotificationParams): Promise<any> {
  const { userId, type, title, message, inquiryId, conversationId } = params;
  if (!userId) return null;

  try {
    if (isUsingMemoryDB()) {
      // Prevent rapid duplicate notifications for same event on same inquiry
      const oneMinuteAgo = Date.now() - 60 * 1000;
      const isDuplicate = memoryStore.notifications.some((n) => {
        if (n.userId !== userId || n.type !== type) return false;
        if (inquiryId && n.inquiryId !== inquiryId) return false;
        const createdAtTime = new Date(n.createdAt).getTime();
        return createdAtTime > oneMinuteAgo && !n.read;
      });

      if (isDuplicate) {
        return null;
      }

      const notifId = 'notif_' + Date.now() + Math.random().toString(36).substring(2, 6);
      const newNotif = {
        id: notifId,
        _id: notifId,
        userId,
        type,
        title,
        message,
        read: false,
        inquiryId: inquiryId || undefined,
        conversationId: conversationId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      memoryStore.notifications.unshift(newNotif);
      return newNotif;
    }

    // MongoDB mode: duplicate check for unread notification within 1 minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const existing = await Notification.findOne({
      userId,
      type,
      ...(inquiryId ? { inquiryId } : {}),
      read: false,
      createdAt: { $gte: oneMinuteAgo },
    });

    if (existing) {
      return existing;
    }

    const doc = await Notification.create({
      userId,
      type,
      title,
      message,
      read: false,
      inquiryId,
      conversationId,
    });

    return doc;
  } catch (error) {
    console.error('[NOTIFICATION] Failed to create notification:', error);
    return null;
  }
}
