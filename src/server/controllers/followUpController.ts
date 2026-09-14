import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { FollowUp } from '../models/FollowUp.js';
import { Inquiry } from '../models/Inquiry.js';
import { UserProfile } from '../models/UserProfile.js';
import { User } from '../models/User.js';
import { Template } from '../models/Template.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { isUsingMemoryDB, memoryStore } from '../config/db.js';
import {
  generateFollowUpReply,
  GeminiConfigError,
  GeminiQuotaExhaustedError,
  GeminiModelUnavailableError,
  isQuotaExhaustedError,
} from '../ai/geminiService.js';
import { createNotificationHelper } from '../utils/notificationHelper.js';
import { getConversationTimeline } from './inquiryController.js';

/**
 * Reconciles the user's active inquiries with follow-up tracking records.
 * Ensures 72-hour (or user configured threshold) real elapsed timestamp checks,
 * cancels/resets follow-ups when clients reply, and prevents duplicates.
 */
export async function syncUserFollowUps(userId: string): Promise<number> {
  let thresholdDays = 3;

  // Retrieve user threshold preference
  if (isUsingMemoryDB()) {
    const prof = memoryStore.profiles.find((p) => String(p.userId) === String(userId));
    if (prof?.followUpThresholdDays && prof.followUpThresholdDays >= 1) {
      thresholdDays = prof.followUpThresholdDays;
    }
  } else {
    try {
      const prof = await UserProfile.findOne({ userId });
      if (prof?.followUpThresholdDays && prof.followUpThresholdDays >= 1) {
        thresholdDays = prof.followUpThresholdDays;
      }
    } catch {
      thresholdDays = 3;
    }
  }

  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (isUsingMemoryDB()) {
    const userInquiries = memoryStore.inquiries.filter(
      (i) => String(i.userId) === String(userId)
    );

    for (const inq of userInquiries) {
      const inqId = inq.id || inq._id;
      const isActive = !['archived', 'declined', 'converted'].includes(inq.status);

      const timeline = getConversationTimeline(inq);

      // Find last user message
      const lastUserMsg = timeline
        .slice()
        .reverse()
        .find((m: any) => m.sender === 'freelancer' && m.text && m.text.trim());

      const pendingFollowUps = memoryStore.followUps.filter(
        (f) => String(f.userId) === String(userId) && String(f.inquiryId) === String(inqId) && ['due', 'scheduled', 'snoozed'].includes(f.status)
      );

      if (!isActive || !lastUserMsg) {
        // Not active or user never replied -> dismiss any pending follow-up
        pendingFollowUps.forEach((f) => {
          f.status = 'dismissed';
          f.dismissedAt = new Date().toISOString();
          f.updatedAt = new Date().toISOString();
        });
        continue;
      }

      const lastUserReplyAtTime = new Date(lastUserMsg.createdAt || inq.updatedAt || inq.createdAt).getTime();

      // Check if client replied AFTER the last user reply
      const clientRepliedAfter = timeline.some(
        (m: any) => m.sender === 'client' && new Date(m.createdAt).getTime() > lastUserReplyAtTime
      );

      if (clientRepliedAfter) {
        // Client already responded -> cancel / reset any pending follow-up
        pendingFollowUps.forEach((f) => {
          f.status = 'dismissed';
          f.dismissedAt = new Date().toISOString();
          f.updatedAt = new Date().toISOString();
        });
        continue;
      }

      // Check last client message text and time for preview
      const lastClientMsg = timeline
        .slice()
        .reverse()
        .find((m: any) => m.sender === 'client');

      const elapsed = now - lastUserReplyAtTime;
      const dueTime = lastUserReplyAtTime + thresholdMs;
      const isPastThreshold = elapsed >= thresholdMs;

      // Find existing follow-up for this exact user reply timestamp
      const existingFollowUp = memoryStore.followUps.find(
        (f) =>
          String(f.userId) === String(userId) &&
          String(f.inquiryId) === String(inqId) &&
          new Date(f.lastUserReplyAt).getTime() === lastUserReplyAtTime
      );

      if (existingFollowUp) {
        if (existingFollowUp.status === 'snoozed' && existingFollowUp.snoozedUntil) {
          if (now >= new Date(existingFollowUp.snoozedUntil).getTime()) {
            existingFollowUp.status = 'due';
            existingFollowUp.updatedAt = new Date().toISOString();
          }
        }
      } else if (isPastThreshold) {
        // Create new Due follow-up
        const followUpId = 'fu_' + Date.now() + Math.random().toString(36).substring(2, 7);
        const newRecord = {
          id: followUpId,
          _id: followUpId,
          userId,
          inquiryId: inqId,
          clientName: inq.clientName || 'Client',
          clientEmail: inq.clientEmail || '',
          subject: inq.subject || 'Project Follow-up',
          sourceChannel: inq.sourceChannel || 'Direct',
          status: 'due' as const,
          lastUserReplyAt: new Date(lastUserReplyAtTime).toISOString(),
          lastUserReplyText: lastUserMsg.text || '',
          lastClientMessageText: lastClientMsg?.text || inq.rawMessage || '',
          lastClientMessageAt: lastClientMsg?.createdAt ? new Date(lastClientMsg.createdAt).toISOString() : undefined,
          dueAt: new Date(dueTime).toISOString(),
          tone: inq.selectedTone || 'friendly',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        memoryStore.followUps.unshift(newRecord);

        // Issue notification (helper deduplicates)
        await createNotificationHelper({
          userId,
          type: 'followup_due',
          title: `Follow-up Due: ${inq.clientName}`,
          message: `${inq.clientName} hasn't replied in ${thresholdDays} days. A follow-up is due.`,
          inquiryId: String(inqId),
        });
      }
    }

    return thresholdDays;
  }

  // MongoDB mode
  try {
    const userInquiries = await Inquiry.find({ userId });

    for (const inq of userInquiries) {
      const inqId = (inq._id || inq.id).toString();
      const isActive = !['archived', 'declined', 'converted'].includes(inq.status);
      const timeline = getConversationTimeline(inq.toObject());

      const lastUserMsg = timeline
        .slice()
        .reverse()
        .find((m: any) => m.sender === 'freelancer' && m.text && m.text.trim());

      if (!isActive || !lastUserMsg) {
        await FollowUp.updateMany(
          { userId, inquiryId: inqId, status: { $in: ['due', 'scheduled', 'snoozed'] } },
          { $set: { status: 'dismissed', dismissedAt: new Date() } }
        );
        continue;
      }

      const lastUserReplyAtTime = new Date(lastUserMsg.createdAt || inq.updatedAt || inq.createdAt).getTime();

      const clientRepliedAfter = timeline.some(
        (m: any) => m.sender === 'client' && new Date(m.createdAt).getTime() > lastUserReplyAtTime
      );

      if (clientRepliedAfter) {
        await FollowUp.updateMany(
          { userId, inquiryId: inqId, status: { $in: ['due', 'scheduled', 'snoozed'] } },
          { $set: { status: 'dismissed', dismissedAt: new Date() } }
        );
        continue;
      }

      const lastClientMsg = timeline
        .slice()
        .reverse()
        .find((m: any) => m.sender === 'client');

      const elapsed = now - lastUserReplyAtTime;
      const dueTime = lastUserReplyAtTime + thresholdMs;
      const isPastThreshold = elapsed >= thresholdMs;

      const existing = await FollowUp.findOne({
        userId,
        inquiryId: inqId,
        lastUserReplyAt: new Date(lastUserReplyAtTime),
      });

      if (existing) {
        if (existing.status === 'snoozed' && existing.snoozedUntil) {
          if (now >= new Date(existing.snoozedUntil).getTime()) {
            existing.status = 'due';
            await existing.save();
          }
        }
      } else if (isPastThreshold) {
        await FollowUp.create({
          userId,
          inquiryId: inq._id,
          clientName: inq.clientName || 'Client',
          clientEmail: inq.clientEmail,
          subject: inq.subject || 'Project Follow-up',
          sourceChannel: inq.sourceChannel || 'Direct',
          status: 'due',
          lastUserReplyAt: new Date(lastUserReplyAtTime),
          lastUserReplyText: lastUserMsg.text || '',
          lastClientMessageText: lastClientMsg?.text || inq.rawMessage || '',
          lastClientMessageAt: lastClientMsg?.createdAt ? new Date(lastClientMsg.createdAt) : undefined,
          dueAt: new Date(dueTime),
          tone: inq.selectedTone || 'friendly',
        });

        await createNotificationHelper({
          userId,
          type: 'followup_due',
          title: `Follow-up Due: ${inq.clientName}`,
          message: `${inq.clientName} hasn't replied in ${thresholdDays} days. A follow-up is due.`,
          inquiryId: inqId,
        });
      }
    }
  } catch (err) {
    console.error('Error syncing follow-ups:', err);
  }

  return thresholdDays;
}

export async function getFollowUps(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const thresholdDays = await syncUserFollowUps(userId);
    const { status, search } = req.query;

    if (isUsingMemoryDB()) {
      let list = memoryStore.followUps.filter((f) => String(f.userId) === String(userId));

      const dueCount = list.filter((f) => f.status === 'due').length;
      const scheduledCount = list.filter((f) => f.status === 'scheduled').length;
      const completedCount = list.filter((f) => f.status === 'completed').length;
      const noResponseCount = dueCount + scheduledCount;
      const totalActiveFollowUps = list.filter((f) => ['due', 'scheduled', 'snoozed'].includes(f.status)).length;

      if (status && status !== 'all') {
        list = list.filter((f) => f.status === status);
      }

      if (search && typeof search === 'string' && search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (f) =>
            (f.clientName && f.clientName.toLowerCase().includes(q)) ||
            (f.subject && f.subject.toLowerCase().includes(q)) ||
            (f.lastUserReplyText && f.lastUserReplyText.toLowerCase().includes(q)) ||
            (f.lastClientMessageText && f.lastClientMessageText.toLowerCase().includes(q)) ||
            (f.sourceChannel && f.sourceChannel.toLowerCase().includes(q))
        );
      }

      list.sort((a, b) => new Date(b.dueAt || b.createdAt).getTime() - new Date(a.dueAt || a.createdAt).getTime());

      res.json({
        success: true,
        data: {
          followUps: list,
          summary: {
            dueCount,
            scheduledCount,
            completedCount,
            noResponseCount,
            totalActiveFollowUps,
          },
          thresholdDays,
        },
      });
      return;
    }

    // MongoDB mode
    const query: any = { userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { clientName: regex },
        { subject: regex },
        { lastUserReplyText: regex },
        { lastClientMessageText: regex },
        { sourceChannel: regex },
      ];
    }

    const allUserRecords = await FollowUp.find({ userId });
    const dueCount = allUserRecords.filter((f) => f.status === 'due').length;
    const scheduledCount = allUserRecords.filter((f) => f.status === 'scheduled').length;
    const completedCount = allUserRecords.filter((f) => f.status === 'completed').length;
    const noResponseCount = dueCount + scheduledCount;
    const totalActiveFollowUps = allUserRecords.filter((f) => ['due', 'scheduled', 'snoozed'].includes(f.status)).length;

    const followUps = await FollowUp.find(query).sort({ dueAt: -1, createdAt: -1 });

    res.json({
      success: true,
      data: {
        followUps,
        summary: {
          dueCount,
          scheduledCount,
          completedCount,
          noResponseCount,
          totalActiveFollowUps,
        },
        thresholdDays,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function generateFollowUp(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { followUpId, inquiryId, tone, templateId, notes } = req.body;
    const selectedTone = tone || 'friendly';

    // Retrieve inquiry
    let inq: any = null;
    let followUpDoc: any = null;

    if (isUsingMemoryDB()) {
      if (followUpId) {
        followUpDoc = memoryStore.followUps.find(
          (f) => (f.id === followUpId || f._id === followUpId) && String(f.userId) === String(userId)
        );
      }
      const targetInquiryId = inquiryId || followUpDoc?.inquiryId;
      if (targetInquiryId) {
        inq = memoryStore.inquiries.find(
          (i) => (i.id === targetInquiryId || i._id === targetInquiryId) && String(i.userId) === String(userId)
        );
      }
    } else {
      if (followUpId) {
        followUpDoc = await FollowUp.findOne({ _id: followUpId, userId });
      }
      const targetInquiryId = inquiryId || followUpDoc?.inquiryId;
      if (targetInquiryId) {
        inq = await Inquiry.findOne({ _id: targetInquiryId, userId });
      }
    }

    if (!inq) {
      res.status(404).json({ success: false, error: 'Associated conversation not found' });
      return;
    }

    // Retrieve User Profile for personalized context
    let profile: any = null;
    if (isUsingMemoryDB()) {
      profile = memoryStore.profiles.find((p) => String(p.userId) === String(userId));
    } else {
      profile = await UserProfile.findOne({ userId });
    }

    // Retrieve template if specified
    let templateContent = '';
    if (templateId) {
      if (isUsingMemoryDB()) {
        const t = memoryStore.templates.find(
          (tmp) => (tmp.id === templateId || tmp._id === templateId) && String(tmp.userId) === String(userId)
        );
        if (t) templateContent = t.content;
      } else {
        const t = await Template.findOne({ _id: templateId, userId });
        if (t) templateContent = t.content;
      }
    }

    // Build timeline context
    const timeline = getConversationTimeline(isUsingMemoryDB() ? inq : inq.toObject());
    const lastUserMsg = timeline
      .slice()
      .reverse()
      .find((m: any) => m.sender === 'freelancer' && m.text && m.text.trim());
    const lastClientMsg = timeline
      .slice()
      .reverse()
      .find((m: any) => m.sender === 'client');

    const clientName = inq.clientName || followUpDoc?.clientName || 'Client';
    const lastClientMessage = lastClientMsg?.text || inq.rawMessage || followUpDoc?.lastClientMessageText || '';
    const lastUserReply = lastUserMsg?.text || inq.sentReply || followUpDoc?.lastUserReplyText || '';

    // Check & deduct user AI credit
    let aiCreditsRemaining = 100;
    if (isUsingMemoryDB()) {
      const u = memoryStore.users.find((user) => String(user.id || user._id) === String(userId));
      if (u) {
        if (u.aiCreditsRemaining !== undefined && u.aiCreditsRemaining <= 0) {
          res.status(403).json({
            success: false,
            error: 'You have exhausted your AI credits for this billing period.',
          });
          return;
        }
        if (u.aiCreditsRemaining !== undefined) {
          u.aiCreditsRemaining = Math.max(0, u.aiCreditsRemaining - 1);
          aiCreditsRemaining = u.aiCreditsRemaining;
        }
      }
    } else {
      const u = await User.findById(userId);
      if (u) {
        if (u.aiCreditsRemaining !== undefined && u.aiCreditsRemaining <= 0) {
          res.status(403).json({
            success: false,
            error: 'You have exhausted your AI credits for this billing period.',
          });
          return;
        }
        if (u.aiCreditsRemaining !== undefined) {
          u.aiCreditsRemaining = Math.max(0, u.aiCreditsRemaining - 1);
          await u.save();
          aiCreditsRemaining = u.aiCreditsRemaining;
        }
      }
    }

    let generatedText = '';
    try {
      generatedText = await generateFollowUpReply({
        clientName,
        lastClientMessage,
        lastUserReply,
        tone: selectedTone,
        profession: profile?.profession,
        skills: profile?.skills,
        templateContent,
        notes,
      });
    } catch (aiErr: any) {
      if (aiErr instanceof GeminiConfigError) {
        // Fallback polite template if API key is not yet set
        generatedText = `Hi ${clientName},\n\nI hope you're having a great week! Just following up on my previous message to see if you had a chance to review the details or if you have any questions I can help clarify.\n\nLooking forward to hearing from you!`;
      } else if (
        aiErr instanceof GeminiQuotaExhaustedError ||
        aiErr.name === 'GeminiQuotaExhaustedError' ||
        aiErr.code === 'GEMINI_QUOTA_EXHAUSTED' ||
        isQuotaExhaustedError(aiErr)
      ) {
        // Refund credit on quota exhaustion
        if (isUsingMemoryDB()) {
          const u = memoryStore.users.find((user) => user.id === userId || user._id === userId);
          if (u && u.aiCreditsRemaining !== undefined) {
            u.aiCreditsRemaining += 1;
          }
        } else {
          await User.updateOne({ _id: userId }, { $inc: { aiCreditsRemaining: 1 } }).catch(() => {});
        }
        res.status(429).json({
          success: false,
          error: 'GEMINI_QUOTA_EXHAUSTED',
          message:
            'AI follow-up generation cannot currently continue because the configured Gemini API quota has been exhausted. Please try again later or check your Gemini API plan.',
        });
        return;
      } else {
        // Refund credit on unexpected failure
        if (isUsingMemoryDB()) {
          const u = memoryStore.users.find((user) => user.id === userId || user._id === userId);
          if (u && u.aiCreditsRemaining !== undefined) {
            u.aiCreditsRemaining += 1;
          }
        } else {
          await User.updateOne({ _id: userId }, { $inc: { aiCreditsRemaining: 1 } }).catch(() => {});
        }
        throw aiErr;
      }
    }

    // Save generated message on followUpDoc if present
    if (followUpDoc) {
      followUpDoc.generatedMessage = generatedText;
      followUpDoc.tone = selectedTone;
      if (isUsingMemoryDB()) {
        followUpDoc.updatedAt = new Date().toISOString();
      } else {
        await followUpDoc.save();
      }
    }

    res.json({
      success: true,
      message: 'Follow-up message generated successfully',
      aiCreditsRemaining,
      data: {
        generatedMessage: generatedText,
        tone: selectedTone,
        aiCreditsRemaining,
        followUp: followUpDoc,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function scheduleFollowUp(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { scheduledFor, notes } = req.body;

    if (!scheduledFor || isNaN(new Date(scheduledFor).getTime())) {
      res.status(400).json({ success: false, error: 'A valid scheduled datetime is required.' });
      return;
    }

    if (isUsingMemoryDB()) {
      const followUp = memoryStore.followUps.find(
        (f) => (f.id === id || f._id === id) && String(f.userId) === String(userId)
      );
      if (!followUp) {
        res.status(404).json({ success: false, error: 'Follow-up record not found' });
        return;
      }

      followUp.status = 'scheduled';
      followUp.scheduledFor = new Date(scheduledFor).toISOString();
      if (notes !== undefined) followUp.notes = notes;
      followUp.updatedAt = new Date().toISOString();

      res.json({ success: true, message: 'Follow-up reminder scheduled', data: followUp });
      return;
    }

    const followUp = await FollowUp.findOneAndUpdate(
      { _id: id, userId },
      {
        $set: {
          status: 'scheduled',
          scheduledFor: new Date(scheduledFor),
          ...(notes !== undefined ? { notes } : {}),
        },
      },
      { new: true }
    );

    if (!followUp) {
      res.status(404).json({ success: false, error: 'Follow-up record not found' });
      return;
    }

    res.json({ success: true, message: 'Follow-up reminder scheduled successfully', data: followUp });
  } catch (error) {
    next(error);
  }
}

export async function snoozeFollowUp(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { snoozedUntil, notes } = req.body;

    if (!snoozedUntil || isNaN(new Date(snoozedUntil).getTime())) {
      res.status(400).json({ success: false, error: 'A valid snooze datetime is required.' });
      return;
    }

    if (isUsingMemoryDB()) {
      const followUp = memoryStore.followUps.find(
        (f) => (f.id === id || f._id === id) && String(f.userId) === String(userId)
      );
      if (!followUp) {
        res.status(404).json({ success: false, error: 'Follow-up record not found' });
        return;
      }

      followUp.status = 'snoozed';
      followUp.snoozedUntil = new Date(snoozedUntil).toISOString();
      if (notes !== undefined) followUp.notes = notes;
      followUp.updatedAt = new Date().toISOString();

      res.json({ success: true, message: 'Follow-up snoozed', data: followUp });
      return;
    }

    const followUp = await FollowUp.findOneAndUpdate(
      { _id: id, userId },
      {
        $set: {
          status: 'snoozed',
          snoozedUntil: new Date(snoozedUntil),
          ...(notes !== undefined ? { notes } : {}),
        },
      },
      { new: true }
    );

    if (!followUp) {
      res.status(404).json({ success: false, error: 'Follow-up record not found' });
      return;
    }

    res.json({ success: true, message: 'Follow-up snoozed successfully', data: followUp });
  } catch (error) {
    next(error);
  }
}

export async function dismissFollowUp(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (isUsingMemoryDB()) {
      const followUp = memoryStore.followUps.find(
        (f) => (f.id === id || f._id === id) && String(f.userId) === String(userId)
      );
      if (!followUp) {
        res.status(404).json({ success: false, error: 'Follow-up record not found' });
        return;
      }

      followUp.status = 'dismissed';
      followUp.dismissedAt = new Date().toISOString();
      followUp.updatedAt = new Date().toISOString();

      res.json({ success: true, message: 'Follow-up dismissed', data: followUp });
      return;
    }

    const followUp = await FollowUp.findOneAndUpdate(
      { _id: id, userId },
      {
        $set: {
          status: 'dismissed',
          dismissedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!followUp) {
      res.status(404).json({ success: false, error: 'Follow-up record not found' });
      return;
    }

    res.json({ success: true, message: 'Follow-up dismissed successfully', data: followUp });
  } catch (error) {
    next(error);
  }
}

export async function sendFollowUp(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ success: false, error: 'A follow-up message content is required before sending.' });
      return;
    }

    const trimmedMsg = message.trim();

    if (isUsingMemoryDB()) {
      const followUp = memoryStore.followUps.find(
        (f) => (f.id === id || f._id === id) && String(f.userId) === String(userId)
      );
      if (!followUp) {
        res.status(404).json({ success: false, error: 'Follow-up record not found' });
        return;
      }

      const inq = memoryStore.inquiries.find(
        (i) => (i.id === followUp.inquiryId || i._id === followUp.inquiryId) && String(i.userId) === String(userId)
      );

      if (!inq) {
        res.status(404).json({ success: false, error: 'Associated conversation inquiry not found' });
        return;
      }

      if (!inq.conversationHistory || inq.conversationHistory.length === 0) {
        inq.conversationHistory = getConversationTimeline(inq);
      }

      // Append follow-up message to conversation history
      const newMsgId = 'msg_reply_' + Date.now() + Math.random().toString(36).substring(2, 6);
      inq.conversationHistory.push({
        id: newMsgId,
        sender: 'freelancer',
        type: 'text',
        text: trimmedMsg,
        createdAt: new Date().toISOString(),
      });

      inq.sentReply = trimmedMsg;
      inq.status = 'replied';
      inq.updatedAt = new Date().toISOString();

      followUp.status = 'completed';
      followUp.completedAt = new Date().toISOString();
      followUp.sentMessage = trimmedMsg;
      followUp.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        message: 'Follow-up reply recorded and conversation updated',
        data: {
          followUp,
          inquiry: inq,
        },
      });
      return;
    }

    // MongoDB mode
    const followUp = await FollowUp.findOne({ _id: id, userId });
    if (!followUp) {
      res.status(404).json({ success: false, error: 'Follow-up record not found' });
      return;
    }

    const inq = await Inquiry.findOne({ _id: followUp.inquiryId, userId });
    if (!inq) {
      res.status(404).json({ success: false, error: 'Associated conversation inquiry not found' });
      return;
    }

    const history = inq.conversationHistory && inq.conversationHistory.length > 0
      ? inq.conversationHistory
      : getConversationTimeline(inq.toObject());

    const newMsgId = 'msg_reply_' + Date.now() + Math.random().toString(36).substring(2, 6);
    history.push({
      id: newMsgId,
      sender: 'freelancer',
      type: 'text',
      text: trimmedMsg,
      createdAt: new Date().toISOString(),
    });

    inq.conversationHistory = history;
    inq.sentReply = trimmedMsg;
    inq.status = 'replied';
    await inq.save();

    followUp.status = 'completed';
    followUp.completedAt = new Date();
    followUp.sentMessage = trimmedMsg;
    await followUp.save();

    res.json({
      success: true,
      message: 'Follow-up reply recorded and conversation updated',
      data: {
        followUp,
        inquiry: inq,
      },
    });
  } catch (error) {
    next(error);
  }
}
