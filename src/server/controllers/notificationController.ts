import { Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { isUsingMemoryDB, memoryStore } from '../config/db.js';

export async function getNotifications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;

    if (isUsingMemoryDB()) {
      const userNotifs = memoryStore.notifications
        .filter((n) => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);

      res.json({
        success: true,
        data: userNotifs,
      });
      return;
    }

    const notifs = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: notifs,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;

    if (isUsingMemoryDB()) {
      const count = memoryStore.notifications.filter(
        (n) => n.userId === userId && !n.read
      ).length;

      res.json({
        success: true,
        count,
        data: { count },
      });
      return;
    }

    const count = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      count,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (isUsingMemoryDB()) {
      const notif = memoryStore.notifications.find(
        (n) => (n.id === id || n._id === id) && n.userId === userId
      );

      if (!notif) {
        res.status(404).json({ success: false, error: 'Notification not found' });
        return;
      }

      notif.read = true;
      notif.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: notif,
      });
      return;
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { read: true } },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;

    if (isUsingMemoryDB()) {
      let count = 0;
      memoryStore.notifications.forEach((n) => {
        if (n.userId === userId && !n.read) {
          n.read = true;
          n.updatedAt = new Date().toISOString();
          count++;
        }
      });

      res.json({
        success: true,
        message: 'All notifications marked as read',
        count,
      });
      return;
    }

    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (isUsingMemoryDB()) {
      const idx = memoryStore.notifications.findIndex(
        (n) => (n.id === id || n._id === id) && n.userId === userId
      );

      if (idx === -1) {
        res.status(404).json({ success: false, error: 'Notification not found' });
        return;
      }

      memoryStore.notifications.splice(idx, 1);

      res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
      return;
    }

    const result = await Notification.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
