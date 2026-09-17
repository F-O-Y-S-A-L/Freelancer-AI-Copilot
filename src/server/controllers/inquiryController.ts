import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Inquiry } from '../models/Inquiry.js';
import { Client } from '../models/Client.js';
import { UserProfile } from '../models/UserProfile.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { isUsingMemoryDB, memoryStore } from '../config/db.js';
import {
  extractRequirements,
  generateReply,
  translateAnalysisToBengali,
  GeminiConfigError,
  GeminiQuotaExhaustedError,
  GeminiModelUnavailableError,
  isQuotaExhaustedError,
} from '../ai/geminiService.js';
import { matchSkills } from '../ai/skillEngine.js';
import { calculatePricing } from '../ai/pricingEngine.js';
import { ENV } from '../config/env.js';
import { PRO_PLAN_AI_CREDITS_LIMIT } from '../../shared/planConfig.js';
import { createNotificationHelper } from '../utils/notificationHelper.js';
import { generateScreenshotFingerprint, generateContentFingerprint } from '../utils/screenshotFingerprint.js';
import { mergeCumulativeAnalyses } from '../ai/analysisMergeEngine.js';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const loggedErrorKeys = new Set<string>();

function logAiAnalysisError(inquiryId: string, stage: string, error: any) {
  const errorKey = `${inquiryId}:${stage}:${error?.message || error}`;
  if (loggedErrorKeys.has(errorKey)) return;
  loggedErrorKeys.add(errorKey);

  const status = error?.status || error?.statusCode || error?.response?.status || 500;
  const errorMessage = error?.message || String(error);

  let upstreamDetailsStr = 'N/A';
  if (error?.errorDetails) {
    upstreamDetailsStr = typeof error.errorDetails === 'object' ? JSON.stringify(error.errorDetails, null, 2) : String(error.errorDetails);
  } else if (error?.response?.data) {
    upstreamDetailsStr = typeof error.response.data === 'object' ? JSON.stringify(error.response.data, null, 2) : String(error.response.data);
  } else if (error?.cause) {
    upstreamDetailsStr = typeof error.cause === 'object' ? JSON.stringify(error.cause, null, 2) : String(error.cause);
  } else if (error?.stack) {
    upstreamDetailsStr = error.stack;
  } else if (typeof error === 'object' && error !== null) {
    try {
      upstreamDetailsStr = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    } catch {
      upstreamDetailsStr = String(error);
    }
  } else {
    upstreamDetailsStr = String(error);
  }

  if (ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim().length > 0) {
    upstreamDetailsStr = upstreamDetailsStr.replaceAll(ENV.GEMINI_API_KEY, '[REDACTED_API_KEY]');
  }

  console.error(
    `\n[AI ANALYSIS FAILED]\nstatus: ${status}\nstage: ${stage}\nerror message: ${errorMessage}\nupstream Gemini error:\n${upstreamDetailsStr}\n`
  );
}

export function getConversationTimeline(inquiry: any): any[] {
  if (inquiry.conversationHistory && Array.isArray(inquiry.conversationHistory) && inquiry.conversationHistory.length > 0) {
    return inquiry.conversationHistory;
  }

  const history: any[] = [];
  const createdAt = inquiry.createdAt ? new Date(inquiry.createdAt).toISOString() : new Date().toISOString();

  if (inquiry.clientAttachments && Array.isArray(inquiry.clientAttachments) && inquiry.clientAttachments.length > 0) {
    inquiry.clientAttachments.forEach((att: any, idx: number) => {
      history.push({
        id: att.id || `att_${idx}`,
        sender: 'client',
        type: 'screenshot',
        screenshotData: att.data,
        screenshotMimeType: att.mimeType,
        fileName: att.name || `Fiverr_Conversation_Screenshot_${idx + 1}.png`,
        text: idx === 0 ? (inquiry.extractedMessageText || (inquiry.rawMessage?.startsWith('[Fiverr Screenshot') ? '' : inquiry.rawMessage)) : undefined,
        createdAt: att.createdAt || createdAt,
      });
    });
  } else if (inquiry.screenshotData) {
    history.push({
      id: 'att_initial',
      sender: 'client',
      type: 'screenshot',
      screenshotData: inquiry.screenshotData,
      screenshotMimeType: inquiry.screenshotMimeType || 'image/png',
      fileName: 'Fiverr_Conversation_Screenshot.png',
      text: inquiry.extractedMessageText || (inquiry.rawMessage?.startsWith('[Fiverr Screenshot') ? '' : inquiry.rawMessage),
      createdAt,
    });
  } else if (inquiry.rawMessage) {
    history.push({
      id: 'msg_initial_text',
      sender: 'client',
      type: 'text',
      text: inquiry.extractedMessageText || inquiry.rawMessage,
      createdAt,
    });
  }

  if (inquiry.sentReply && typeof inquiry.sentReply === 'string' && inquiry.sentReply.trim()) {
    history.push({
      id: 'msg_initial_reply',
      sender: 'freelancer',
      type: 'text',
      text: inquiry.sentReply,
      createdAt: inquiry.updatedAt ? new Date(inquiry.updatedAt).toISOString() : createdAt,
    });
  }

  return history;
}

/**
 * Checks if a candidate string is semantically covered by an existing list of strings.
 * Uses string normalization, substring checks, and token overlap.
 */
function isSemanticDuplicateString(candidate: string, existingList: string[]): boolean {
  if (!candidate || !candidate.trim()) return true;
  const normCandidate = candidate.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (!normCandidate) return true;

  for (const item of existingList) {
    if (!item) continue;
    const normExisting = item.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (normCandidate === normExisting) return true;
    if (normCandidate.length > 8 && normExisting.length > 8) {
      if (normCandidate.includes(normExisting) || normExisting.includes(normCandidate)) return true;
    }
    const candTokens = normCandidate.split(/\s+/).filter((t) => t.length > 3);
    const existTokens = normExisting.split(/\s+/).filter((t) => t.length > 3);
    if (candTokens.length >= 2 && existTokens.length >= 2) {
      const overlap = candTokens.filter((t) => existTokens.includes(t));
      if (overlap.length / Math.min(candTokens.length, existTokens.length) >= 0.7) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if a detected item is already present in the baseline breakdown.
 */
function isItemInBaselineBreakdown(detName: string, baselineBreakdown: any[]): boolean {
  if (!detName || !detName.trim()) return true;
  const normDet = detName
    .toLowerCase()
    .replace(/application/g, 'app')
    .replace(/development/g, 'dev')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  for (const b of baselineBreakdown) {
    const rawName = typeof b.item === 'string' ? b.item.replace(/\s*\(x\d+\)$/, '') : String(b.item || '');
    const normBase = rawName
      .toLowerCase()
      .replace(/application/g, 'app')
      .replace(/development/g, 'dev')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

    if (normDet === normBase) return true;
    if (normDet.length > 4 && normBase.length > 4) {
      if (normDet.includes(normBase) || normBase.includes(normDet)) return true;
    }

    const detTokens = normDet.split(/\s+/).filter((t) => t.length > 2);
    const baseTokens = normBase.split(/\s+/).filter((t) => t.length > 2);
    if (detTokens.length >= 2 && baseTokens.length >= 2) {
      const overlap = detTokens.filter((t) => baseTokens.includes(t));
      if (overlap.length / Math.min(detTokens.length, baseTokens.length) >= 0.65) {
        return true;
      }
    }
  }
  return false;
}

export async function getInquiries(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;

    if (isUsingMemoryDB()) {
      let userInquiries = memoryStore.inquiries
        .filter((inq) => inq.userId === userId)
        .map((inq) => ({
          ...inq,
          starred: Boolean(inq.starred),
        }));
      res.json({ success: true, data: userInquiries });
      return;
    }

    const inquiries = await Inquiry.find({ userId }).sort({ createdAt: -1 });
    const normalizedInquiries = inquiries.map((inq) => {
      const obj = inq.toObject ? inq.toObject() : inq;
      return {
        ...obj,
        starred: Boolean(obj.starred),
      };
    });
    res.json({ success: true, data: normalizedInquiries });
  } catch (error) {
    next(error);
  }
}

export async function createInquiry(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const {
      clientId,
      clientName,
      clientEmail,
      subject,
      rawMessage,
      sourceChannel,
      sourceType = 'text',
      screenshotData,
      screenshotMimeType,
      extractedMessageText,
    } = req.body;

    const finalRawMessage =
      rawMessage && rawMessage.trim().length > 0
        ? rawMessage.trim()
        : sourceType === 'screenshot'
        ? '[Fiverr Screenshot Uploaded - Pending AI Extraction]'
        : 'New Inquiry Request';

    const finalSourceChannel = sourceChannel || (sourceType === 'screenshot' ? 'Fiverr' : 'Fiverr');
    const inputName = (clientName || '').trim();
    const inputEmail = (clientEmail || '').trim().toLowerCase();
    const targetSubject = (subject || (sourceType === 'screenshot' ? 'Fiverr Screenshot Inquiry' : 'New Project Proposal Request')).trim();

    if (isUsingMemoryDB()) {
      // 1. Resolve & Deduplicate Client in MemoryDB
      let resolvedClient: any = null;
      if (clientId && clientId !== 'new') {
        resolvedClient = memoryStore.clients.find((c) => (c.id === clientId || c._id === clientId) && c.userId === userId);
      }

      if (!resolvedClient) {
        if (inputEmail) {
          resolvedClient = memoryStore.clients.find((c) => c.userId === userId && c.email?.toLowerCase() === inputEmail);
        }
        if (!resolvedClient && inputName) {
          resolvedClient = memoryStore.clients.find((c) => c.userId === userId && c.name?.toLowerCase() === inputName.toLowerCase());
        }
      }

      if (resolvedClient) {
        if (inputEmail && !resolvedClient.email) {
          resolvedClient.email = inputEmail;
        }
      } else if (inputName) {
        const newCliId = 'cli_' + Date.now() + Math.random().toString(36).substr(2, 4);
        resolvedClient = {
          id: newCliId,
          _id: newCliId,
          userId,
          name: inputName,
          email: inputEmail,
          company: '',
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.clients.push(resolvedClient);
      }

      const resolvedClientId = resolvedClient ? (resolvedClient.id || resolvedClient._id) : undefined;
      const resolvedClientName = resolvedClient ? resolvedClient.name : (inputName || 'Client');
      const resolvedClientEmail = resolvedClient ? (resolvedClient.email || inputEmail) : inputEmail;

      // 2. Check for existing Inquiry (Same client + same project subject)
      const existingInquiry = memoryStore.inquiries.find((inq) => {
        if (inq.userId !== userId) return false;
        const matchClient = resolvedClientId
          ? (inq.clientId === resolvedClientId || (inq.clientEmail && inq.clientEmail.toLowerCase() === resolvedClientEmail) || inq.clientName?.toLowerCase() === resolvedClientName.toLowerCase())
          : (inq.clientName?.toLowerCase() === resolvedClientName.toLowerCase());

        const matchSubject = (inq.subject || '').trim().toLowerCase() === targetSubject.toLowerCase();
        return matchClient && matchSubject;
      });

      if (existingInquiry) {
        res.status(200).json({
          success: true,
          message: 'Existing inquiry retrieved for this client and project',
          data: existingInquiry,
          isExisting: true,
        });
        return;
      }

      // 3. Create new Inquiry
      const inqId = 'inq_' + Date.now() + Math.random().toString(36).substr(2, 4);
      const initialAttachments: any[] = [];
      const initialHistory: any[] = [];

      if (screenshotData) {
        const attId = 'att_' + Date.now() + Math.random().toString(36).substring(2, 6);
        initialAttachments.push({
          id: attId,
          type: 'image',
          data: screenshotData,
          mimeType: screenshotMimeType || 'image/png',
          name: 'Fiverr_Conversation_Screenshot.png',
          createdAt: new Date().toISOString(),
        });
        initialHistory.push({
          id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 6),
          sender: 'client',
          type: 'screenshot',
          screenshotData,
          screenshotMimeType: screenshotMimeType || 'image/png',
          fileName: 'Fiverr_Conversation_Screenshot.png',
          text: extractedMessageText || (finalRawMessage.startsWith('[Fiverr Screenshot Uploaded') ? '' : finalRawMessage),
          read: false,
          createdAt: new Date().toISOString(),
        });
      } else {
        initialHistory.push({
          id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 6),
          sender: 'client',
          type: 'text',
          text: finalRawMessage,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      const newInquiry = {
        id: inqId,
        _id: inqId,
        userId,
        clientId: resolvedClientId,
        clientName: resolvedClientName,
        clientEmail: resolvedClientEmail,
        subject: targetSubject,
        rawMessage: finalRawMessage,
        sourceChannel: finalSourceChannel,
        sourceType,
        screenshotData: screenshotData || '',
        screenshotMimeType: screenshotMimeType || 'image/png',
        clientAttachments: initialAttachments,
        conversationHistory: initialHistory,
        extractedMessageText: extractedMessageText || '',
        status: 'new',
        read: false,
        starred: false,
        draft: '',
        selectedTone: 'friendly',
        analysisResult: null,
        analysisHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.inquiries.unshift(newInquiry);

      // Trigger New Inquiry Notification
      await createNotificationHelper({
        userId,
        type: 'new_inquiry',
        title: `New inquiry from ${resolvedClientName}`,
        message: 'A new client inquiry is ready for review.',
        inquiryId: inqId,
      });

      res.status(201).json({ success: true, message: 'Inquiry created successfully', data: newInquiry });
      return;
    }

    // MongoDB Mode:
    // 1. Resolve & Deduplicate Client
    let resolvedClient: any = null;
    if (clientId && clientId !== 'new') {
      resolvedClient = await Client.findOne({ _id: clientId, userId });
    }

    if (!resolvedClient) {
      if (inputEmail) {
        resolvedClient = await Client.findOne({ userId, email: inputEmail });
      }
      if (!resolvedClient && inputName) {
        resolvedClient = await Client.findOne({
          userId,
          name: { $regex: new RegExp('^' + escapeRegex(inputName) + '$', 'i') },
        });
      }
    }

    if (resolvedClient) {
      if (inputEmail && !resolvedClient.email) {
        resolvedClient.email = inputEmail;
        await resolvedClient.save();
      }
    } else if (inputName) {
      resolvedClient = await Client.create({
        userId,
        name: inputName,
        email: inputEmail,
      });
    }

    const resolvedClientId = resolvedClient ? resolvedClient._id : undefined;
    const resolvedClientName = resolvedClient ? resolvedClient.name : (inputName || 'Client');
    const resolvedClientEmail = resolvedClient ? (resolvedClient.email || inputEmail) : inputEmail;

    // 2. Check for existing Inquiry (Same client + same project subject)
    const clientConditions: any[] = [];
    if (resolvedClientId) clientConditions.push({ clientId: resolvedClientId });
    if (resolvedClientEmail) clientConditions.push({ clientEmail: resolvedClientEmail });
    if (resolvedClientName) clientConditions.push({ clientName: { $regex: new RegExp('^' + escapeRegex(resolvedClientName) + '$', 'i') } });

    const existingInquiry = await Inquiry.findOne({
      userId,
      $or: clientConditions,
      subject: { $regex: new RegExp('^' + escapeRegex(targetSubject) + '$', 'i') },
    });

    if (existingInquiry) {
      res.status(200).json({
        success: true,
        message: 'Existing inquiry retrieved for this client and project',
        data: existingInquiry,
        isExisting: true,
      });
      return;
    }

    // 3. Create new Inquiry
    const mongoInitialAttachments: any[] = [];
    const mongoInitialHistory: any[] = [];

    if (screenshotData) {
      mongoInitialAttachments.push({
        id: 'att_' + Date.now() + Math.random().toString(36).substring(2, 6),
        type: 'image',
        data: screenshotData,
        mimeType: screenshotMimeType || 'image/png',
        name: 'Fiverr_Conversation_Screenshot.png',
        createdAt: new Date().toISOString(),
      });
      mongoInitialHistory.push({
        id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 6),
        sender: 'client',
        type: 'screenshot',
        screenshotData,
        screenshotMimeType: screenshotMimeType || 'image/png',
        fileName: 'Fiverr_Conversation_Screenshot.png',
        text: extractedMessageText || (finalRawMessage.startsWith('[Fiverr Screenshot Uploaded') ? '' : finalRawMessage),
        read: false,
        createdAt: new Date().toISOString(),
      });
    } else {
      mongoInitialHistory.push({
        id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 6),
        sender: 'client',
        type: 'text',
        text: finalRawMessage,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    const inquiry = await Inquiry.create({
      userId,
      clientId: resolvedClientId,
      clientName: resolvedClientName,
      clientEmail: resolvedClientEmail,
      subject: targetSubject,
      rawMessage: finalRawMessage,
      sourceChannel: finalSourceChannel,
      sourceType,
      screenshotData: screenshotData || '',
      screenshotMimeType: screenshotMimeType || 'image/png',
      clientAttachments: mongoInitialAttachments,
      conversationHistory: mongoInitialHistory,
      extractedMessageText: extractedMessageText || '',
      status: 'new',
      read: false,
      starred: false,
    });

    // Trigger New Inquiry Notification
    await createNotificationHelper({
      userId,
      type: 'new_inquiry',
      title: `New inquiry from ${resolvedClientName}`,
      message: 'A new client inquiry is ready for review.',
      inquiryId: inquiry._id.toString(),
    });

    res.status(201).json({ success: true, message: 'Inquiry created successfully', data: inquiry });
  } catch (error) {
    next(error);
  }
}

export async function getInquiryById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (isUsingMemoryDB()) {
      const inq = memoryStore.inquiries.find((i) => i.id === id && i.userId === userId);
      if (!inq) {
        res.status(404).json({ success: false, error: 'Inquiry not found' });
        return;
      }
      res.json({ success: true, data: { ...inq, starred: Boolean(inq.starred) } });
      return;
    }

    const inquiry = await Inquiry.findOne({ _id: id, userId });
    if (!inquiry) {
      res.status(404).json({ success: false, error: 'Inquiry not found' });
      return;
    }

    const inquiryObj = inquiry.toObject ? inquiry.toObject() : inquiry;
    res.json({ success: true, data: { ...inquiryObj, starred: Boolean(inquiryObj.starred) } });
  } catch (error) {
    next(error);
  }
}

export async function updateInquiry(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const updates = req.body;

    if (isUsingMemoryDB()) {
      const inq = memoryStore.inquiries.find((i) => i.id === id && i.userId === userId);
      if (!inq) {
        res.status(404).json({ success: false, error: 'Inquiry not found' });
        return;
      }

      if (updates.sentReply && typeof updates.sentReply === 'string' && updates.sentReply.trim()) {
        if (!inq.conversationHistory || inq.conversationHistory.length === 0) {
          inq.conversationHistory = getConversationTimeline(inq);
        }
        if (!updates.conversationHistory) {
          const lastMsg = inq.conversationHistory[inq.conversationHistory.length - 1];
          if (!lastMsg || lastMsg.sender !== 'freelancer' || lastMsg.text !== updates.sentReply) {
            inq.conversationHistory.push({
              id: 'msg_reply_' + Date.now() + Math.random().toString(36).substring(2, 6),
              sender: 'freelancer',
              type: 'text',
              text: updates.sentReply,
              createdAt: new Date().toISOString(),
            });
          }
          updates.conversationHistory = inq.conversationHistory;
        }
      }

      if (updates.status === 'replied' || updates.sentReply) {
        updates.read = true;
        if (!updates.readAt) updates.readAt = new Date().toISOString();
      } else if (updates.read !== undefined) {
        updates.read = Boolean(updates.read);
        if (updates.read && !updates.readAt) {
          updates.readAt = new Date().toISOString();
        }
      }

      if (updates.starred !== undefined) {
        inq.starred = Boolean(updates.starred);
        inq.starredAt = inq.starred ? (updates.starredAt || new Date().toISOString()) : undefined;
      }

      Object.assign(inq, updates, { updatedAt: new Date().toISOString() });

      if (updates.read === true) {
        memoryStore.notifications.forEach((notif) => {
          if (
            notif.userId === userId &&
            !notif.read &&
            (notif.inquiryId === id ||
              notif.inquiryId === inq.id ||
              notif.inquiryId === inq._id ||
              notif.conversationId === id)
          ) {
            notif.read = true;
            notif.updatedAt = new Date().toISOString();
          }
        });
      }

      res.json({ success: true, message: 'Inquiry updated', data: inq });
      return;
    }

    if (updates.status === 'replied' || updates.sentReply) {
      updates.read = true;
      if (!updates.readAt) updates.readAt = new Date();
    } else if (updates.read !== undefined) {
      updates.read = Boolean(updates.read);
      if (updates.read && !updates.readAt) {
        updates.readAt = new Date();
      }
    }

    if (updates.starred !== undefined) {
      updates.starred = Boolean(updates.starred);
      if (updates.starred && !updates.starredAt) {
        updates.starredAt = new Date();
      } else if (!updates.starred) {
        updates.starredAt = null;
      }
    }

    if (updates.sentReply && typeof updates.sentReply === 'string' && updates.sentReply.trim() && (!updates.conversationHistory || updates.conversationHistory.length === 0)) {
      const existingDoc = await Inquiry.findOne({ _id: id, userId });
      if (existingDoc) {
        const history = existingDoc.conversationHistory && existingDoc.conversationHistory.length > 0
          ? existingDoc.conversationHistory
          : getConversationTimeline(existingDoc.toObject());

        const lastMsg = history[history.length - 1];
        if (!lastMsg || lastMsg.sender !== 'freelancer' || lastMsg.text !== updates.sentReply) {
          history.push({
            id: 'msg_reply_' + Date.now() + Math.random().toString(36).substring(2, 6),
            sender: 'freelancer',
            type: 'text',
            text: updates.sentReply,
            createdAt: new Date().toISOString(),
          });
        }
        updates.conversationHistory = history;
      }
    }

    const inquiry = await Inquiry.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      res.status(404).json({ success: false, error: 'Inquiry not found' });
      return;
    }

    if (updates.read === true) {
      await Notification.updateMany(
        {
          userId,
          read: false,
          $or: [
            { inquiryId: id },
            { inquiryId: inquiry._id.toString() },
            { conversationId: id },
          ],
        },
        { $set: { read: true } }
      );
    }

    const inquiryObj = inquiry.toObject ? inquiry.toObject() : inquiry;
    res.json({
      success: true,
      message: 'Inquiry updated successfully',
      data: {
        ...inquiryObj,
        starred: Boolean(inquiryObj.starred),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function markInquiryAsRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (isUsingMemoryDB()) {
      const inq = memoryStore.inquiries.find(
        (i) => (i.id === id || i._id === id) && i.userId === userId
      );
      if (!inq) {
        res.status(404).json({ success: false, error: 'Inquiry not found' });
        return;
      }

      inq.read = true;
      inq.readAt = new Date().toISOString();
      inq.updatedAt = new Date().toISOString();

      if (Array.isArray(inq.conversationHistory)) {
        inq.conversationHistory.forEach((msg: any) => {
          msg.read = true;
        });
      }

      // Mark associated notifications as read
      memoryStore.notifications.forEach((notif) => {
        if (
          notif.userId === userId &&
          !notif.read &&
          (notif.inquiryId === id ||
            notif.inquiryId === inq.id ||
            notif.inquiryId === inq._id ||
            notif.conversationId === id)
        ) {
          notif.read = true;
          notif.updatedAt = new Date().toISOString();
        }
      });

      res.json({
        success: true,
        message: 'Inquiry marked as read',
        data: inq,
      });
      return;
    }

    const inquiry = await Inquiry.findOne({ _id: id, userId });
    if (!inquiry) {
      res.status(404).json({ success: false, error: 'Inquiry not found' });
      return;
    }

    inquiry.read = true;
    inquiry.readAt = new Date();
    if (Array.isArray(inquiry.conversationHistory)) {
      inquiry.conversationHistory.forEach((msg: any) => {
        msg.read = true;
      });
    }

    await inquiry.save();

    // Mark associated notifications as read in MongoDB
    await Notification.updateMany(
      {
        userId,
        read: false,
        $or: [
          { inquiryId: id },
          { inquiryId: inquiry._id.toString() },
          { conversationId: id },
        ],
      },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      message: 'Inquiry marked as read',
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleStarInquiry(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { starred } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (isUsingMemoryDB()) {
      const inq = memoryStore.inquiries.find(
        (i) => (i.id === id || i._id === id) && i.userId === userId
      );
      if (!inq) {
        res.status(404).json({ success: false, error: 'Inquiry not found' });
        return;
      }

      const nextStarred = typeof starred === 'boolean' ? starred : !Boolean(inq.starred);
      inq.starred = nextStarred;
      inq.starredAt = nextStarred ? new Date().toISOString() : undefined;
      inq.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        message: nextStarred ? 'Inquiry starred' : 'Inquiry unstarred',
        data: {
          ...inq,
          starred: nextStarred,
        },
      });
      return;
    }

    const existingDoc = await Inquiry.findOne({ _id: id, userId });
    if (!existingDoc) {
      res.status(404).json({ success: false, error: 'Inquiry not found' });
      return;
    }

    const nextStarred = typeof starred === 'boolean' ? starred : !Boolean(existingDoc.starred);
    const updatedDoc = await Inquiry.findOneAndUpdate(
      { _id: id, userId },
      {
        $set: {
          starred: nextStarred,
          starredAt: nextStarred ? new Date() : null,
        },
      },
      { new: true }
    );

    if (!updatedDoc) {
      res.status(404).json({ success: false, error: 'Inquiry not found' });
      return;
    }

    const updatedObj = updatedDoc.toObject ? updatedDoc.toObject() : updatedDoc;
    res.json({
      success: true,
      message: nextStarred ? 'Inquiry starred' : 'Inquiry unstarred',
      data: {
        ...updatedObj,
        starred: Boolean(updatedObj.starred),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteInquiry(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (isUsingMemoryDB()) {
      const index = memoryStore.inquiries.findIndex((i) => i.id === id && i.userId === userId);
      if (index === -1) {
        res.status(404).json({ success: false, error: 'Inquiry not found' });
        return;
      }
      memoryStore.inquiries.splice(index, 1);
      res.json({ success: true, message: 'Inquiry deleted' });
      return;
    }

    const result = await Inquiry.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, error: 'Inquiry not found' });
      return;
    }

    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function analyzeInquiry(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.userId;
  const { id } = req.params;

  let memUser: any = null;
  let creditReserved = false;
  let remainingCredits = 0;
  let currentStage = 'init';

  try {
    console.log(`[AI ANALYSIS] Starting screenshot-aware analysis for inquiry: ${id}`);
    console.log(`GEMINI_API_KEY configured: ${Boolean(ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim().length > 0)}`);
    console.log(`GEMINI_MODEL: ${ENV.GEMINI_MODEL || 'gemini-3.6-flash'}`);

    // 1. Fetch Inquiry & Profile
    let inquiry: any = null;
    let profile: any = null;

    if (isUsingMemoryDB()) {
      inquiry = memoryStore.inquiries.find((i) => i.id === id && i.userId === userId);
      profile = memoryStore.profiles.find((p) => p.userId === userId);
    } else {
      inquiry = await Inquiry.findOne({ _id: id, userId });
      profile = await UserProfile.findOne({ userId });
    }

    if (!inquiry) {
      res.status(404).json({ success: false, error: 'INQUIRY_NOT_FOUND', message: 'Inquiry not found' });
      return;
    }

    if (!profile) {
      res.status(404).json({ success: false, error: 'PROFILE_NOT_FOUND', message: 'User profile not found' });
      return;
    }

    // Ensure collections are initialized
    if (!inquiry.analyzedScreenshots) inquiry.analyzedScreenshots = [];
    if (!inquiry.clientAttachments) inquiry.clientAttachments = [];
    if (!inquiry.conversationHistory || inquiry.conversationHistory.length === 0) {
      inquiry.conversationHistory = getConversationTimeline(inquiry);
    }

    // Determine target screenshot payload:
    // If incoming request has screenshotData, that is our target screenshot
    // Otherwise, inquiry's existing screenshotData (or text message)
    const hasIncomingScreenshot = Boolean(req.body && req.body.screenshotData && req.body.screenshotData.trim().length > 0);
    const targetScreenshotData = hasIncomingScreenshot ? req.body.screenshotData : inquiry.screenshotData;
    const targetMimeType = hasIncomingScreenshot
      ? (req.body.screenshotMimeType || 'image/png')
      : (inquiry.screenshotMimeType || 'image/png');
    const targetFileName = hasIncomingScreenshot
      ? (req.body.fileName || `Fiverr_Attachment_${(inquiry.clientAttachments?.length || 0) + 1}.png`)
      : 'Fiverr_Conversation_Screenshot.png';

    // Compute deterministic binary content fingerprint
    const targetFingerprint = generateContentFingerprint({
      screenshotData: targetScreenshotData,
      rawMessage: inquiry.rawMessage,
    });

    console.log(`[AI ANALYSIS] Target fingerprint: ${targetFingerprint ? targetFingerprint.substring(0, 16) + '...' : 'none'} (isNewUpload: ${hasIncomingScreenshot})`);

    // Backfill legacy analyzedScreenshots if inquiry already had analysisResult and screenshotData but no analyzedScreenshots
    if (inquiry.analyzedScreenshots.length === 0 && inquiry.analysisResult) {
      const legacyFp = generateContentFingerprint({
        screenshotData: inquiry.screenshotData,
        rawMessage: inquiry.rawMessage,
      });
      if (legacyFp) {
        inquiry.analyzedScreenshots.push({
          fingerprint: legacyFp,
          fileName: 'Fiverr_Conversation_Screenshot.png',
          mimeType: inquiry.screenshotMimeType || 'image/png',
          analysisResult: {
            clientWants: inquiry.analysisResult.clientWants || [],
            extractedSkillsRequired: inquiry.analysisResult.requiredSkills || [],
            scopeComplexity: inquiry.analysisResult.scopeComplexity || 'medium',
            detectedItems: inquiry.analysisResult.pricingEstimate?.breakdown?.map((b: any) => ({
              name: typeof b.item === 'string' ? b.item.replace(/\s*\(x\d+\)$/, '') : b.item,
              qty: b.qty || 1,
            })) || [],
            informationToClarify: inquiry.analysisResult.questionsToClarify || [],
            extractedMessageText: inquiry.analysisResult.extractedMessageText || inquiry.extractedMessageText || '',
          },
          extractedMessageText: inquiry.extractedMessageText || '',
          analyzedAt: inquiry.analysisResult.analyzedAt || inquiry.createdAt || new Date().toISOString(),
        });
      }
    }

    // CHECK IF SCREENSHOT HAS ALREADY BEEN ANALYZED
    const alreadyAnalyzed = Boolean(
      targetFingerprint &&
      (inquiry.analyzedScreenshots || []).some((item: any) => item.fingerprint === targetFingerprint)
    );

    // If already analyzed (or Analyze Again clicked without changing screenshot)
    if (alreadyAnalyzed && inquiry.analysisResult) {
      console.log(`[AI ANALYSIS] Screenshot already analyzed (fingerprint: ${targetFingerprint.substring(0, 12)}...). Reusing stored authoritative analysis without credit deduction.`);

      // If this was an incoming upload with same image binary, ensure clientAttachments has it if not already present
      if (hasIncomingScreenshot) {
        const isAlreadyInAttachments = (inquiry.clientAttachments || []).some((att: any) => {
          return generateScreenshotFingerprint(att.data) === targetFingerprint;
        });
        if (!isAlreadyInAttachments) {
          const newAtt = {
            id: 'att_' + Date.now() + Math.random().toString(36).substring(2, 6),
            type: 'image',
            data: req.body.screenshotData,
            mimeType: targetMimeType,
            name: targetFileName,
            createdAt: new Date().toISOString(),
          };
          inquiry.clientAttachments.push(newAtt);
        }
      }

      // Fetch user's current credits to return exact value
      let currentCredits = 0;
      if (isUsingMemoryDB()) {
        const u = memoryStore.users.find((user) => user.id === userId || user._id === userId);
        currentCredits = u?.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT;
      } else {
        const u = await User.findById(userId);
        currentCredits = u?.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT;
      }

      res.json({
        success: true,
        message: 'Screenshot already analyzed. Reused stored analysis.',
        data: inquiry,
        aiCreditsRemaining: currentCredits,
      });
      return;
    }

    // GENUINELY NEW SCREENSHOT (OR FIRST ANALYSIS):
    // 2. Atomic Credit Reservation
    if (isUsingMemoryDB()) {
      memUser = memoryStore.users.find((u) => u.id === userId || u._id === userId);
      if (!memUser || (memUser.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT) < 1) {
        res.status(402).json({
          success: false,
          error: 'INSUFFICIENT_AI_CREDITS',
          message: "You're out of AI credits. Upgrade or wait for refill.",
        });
        return;
      }
      memUser.aiCreditsRemaining = (memUser.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT) - 1;
      creditReserved = true;
      remainingCredits = memUser.aiCreditsRemaining;
    } else {
      const user = await User.findOneAndUpdate(
        { _id: userId, aiCreditsRemaining: { $gte: 1 } },
        { $inc: { aiCreditsRemaining: -1 } },
        { new: true }
      );
      if (!user) {
        res.status(402).json({
          success: false,
          error: 'INSUFFICIENT_AI_CREDITS',
          message: "You're out of AI credits. Upgrade or wait for refill.",
        });
        return;
      }
      creditReserved = true;
      remainingCredits = user.aiCreditsRemaining;
    }

    // If incoming screenshot, register in clientAttachments & conversationHistory
    if (hasIncomingScreenshot) {
      const newAtt = {
        id: 'att_' + Date.now() + Math.random().toString(36).substring(2, 6),
        type: 'image',
        data: req.body.screenshotData,
        mimeType: targetMimeType,
        name: targetFileName,
        createdAt: new Date().toISOString(),
      };
      inquiry.clientAttachments.push(newAtt);

      const newClientMsg = {
        id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 6),
        sender: 'client',
        type: 'screenshot',
        screenshotData: req.body.screenshotData,
        screenshotMimeType: targetMimeType,
        fileName: targetFileName,
        read: false,
        createdAt: new Date().toISOString(),
      };
      inquiry.conversationHistory.push(newClientMsg);
      inquiry.read = false;

      inquiry.screenshotData = req.body.screenshotData;
      inquiry.screenshotMimeType = targetMimeType;
      inquiry.sourceType = 'screenshot';

      // Trigger Client Replied Notification for new uploaded client message
      await createNotificationHelper({
        userId,
        type: 'client_replied',
        title: `${inquiry.clientName || 'Client'} replied`,
        message: 'The client sent a new message / screenshot.',
        inquiryId: inquiry.id || inquiry._id?.toString() || id,
      });
    }

    // 3. Gemini Requirement Extraction
    currentStage = 'extractRequirements';
    console.log('[AI ANALYSIS] Running Gemini extraction for new screenshot/content...');

    const extractionParams: any = {
      freelancerProfession: profile.profession,
    };

    if (targetScreenshotData) {
      extractionParams.imageBuffer = {
        data: targetScreenshotData,
        mimeType: targetMimeType,
      };
    } else {
      extractionParams.clientMessage = inquiry.rawMessage;
    }

    // Provide baseline reference if existing analysis exists
    if (inquiry.analysisResult) {
      extractionParams.existingAnalysis = {
        clientWants: inquiry.analysisResult.clientWants,
        requiredSkills: inquiry.analysisResult.requiredSkills,
        detectedItems: inquiry.analysisResult.pricingEstimate?.breakdown?.map((b: any) => ({
          name: typeof b.item === 'string' ? b.item.replace(/\s*\(x\d+\)$/, '') : b.item,
          qty: b.qty || 1,
        })),
        scopeComplexity: inquiry.analysisResult.scopeComplexity || 'medium',
        questionsToClarify: inquiry.analysisResult.questionsToClarify,
      };
    }

    let extraction: any;
    try {
      extraction = await extractRequirements(extractionParams);
      console.log('[AI ANALYSIS] Gemini extraction completed successfully');
    } catch (err: any) {
      logAiAnalysisError(id, 'extractRequirements', err);
      throw err;
    }

    // Save individual screenshot extraction to analyzedScreenshots
    const screenshotRecord = {
      fingerprint: targetFingerprint,
      fileName: targetFileName,
      mimeType: targetMimeType,
      analysisResult: extraction,
      extractedMessageText: extraction.extractedMessageText || '',
      analyzedAt: new Date().toISOString(),
    };
    inquiry.analyzedScreenshots.push(screenshotRecord);

    // 4. Cumulative Analysis Merge
    currentStage = 'mergeAnalyses';
    const allAnalysesToMerge = (inquiry.analyzedScreenshots || []).map((s: any) => s.analysisResult);
    const mergedOutput = mergeCumulativeAnalyses({
      allAnalyses: allAnalysesToMerge,
      userProfile: profile,
    });

    // Update message text on client screenshot in conversation timeline
    if (extraction.extractedMessageText) {
      const lastClientMsg = [...inquiry.conversationHistory].reverse().find((m: any) => m.sender === 'client');
      if (lastClientMsg && (!lastClientMsg.text || lastClientMsg.text.startsWith('[Fiverr Screenshot'))) {
        lastClientMsg.text = extraction.extractedMessageText;
      }
    }

    // 5. Generate AI Suggested Proposal Reply Draft
    currentStage = 'generateReply';
    let replyText = '';
    try {
      replyText = await generateReply({
        clientMessage: mergedOutput.extractedMessageText || inquiry.rawMessage,
        clientWants: mergedOutput.clientWants,
        capabilityStatus: mergedOutput.capability,
        matchedSkills: mergedOutput.matchedSkills,
        missingSkills: mergedOutput.missingSkills,
        informationToClarify: mergedOutput.questionsToClarify,
        itemizedBreakdown: mergedOutput.pricingEstimate.breakdown,
        estimatedTotalMin: mergedOutput.pricingEstimate.minPrice,
        estimatedTotalMax: mergedOutput.pricingEstimate.maxPrice,
        estimatedDeliveryDays: mergedOutput.pricingEstimate.deliveryDays,
        tone: inquiry.selectedTone || profile.communicationTone || 'friendly',
        businessRules: profile.businessRules || [],
        depositPercentage: profile.depositPercentage,
        maxRevisions: profile.maxRevisions,
      });
      console.log('[AI ANALYSIS] Reply generation completed successfully');
    } catch (err: any) {
      logAiAnalysisError(id, 'generateReply', err);
      throw err;
    }

    // 6. Build Final Combined Analysis Result
    const finalAnalysisResult = {
      capability: mergedOutput.capability,
      clientWants: mergedOutput.clientWants,
      requiredSkills: mergedOutput.requiredSkills,
      matchedSkills: mergedOutput.matchedSkills,
      missingSkills: mergedOutput.missingSkills,
      questionsToClarify: mergedOutput.questionsToClarify,
      scopeComplexity: mergedOutput.scopeComplexity,
      pricingEstimate: mergedOutput.pricingEstimate,
      aiSuggestedReply: replyText,
      extractedMessageText: mergedOutput.extractedMessageText,
      analyzedAt: new Date().toISOString(),
      currentScreenshotFingerprint: targetFingerprint,
    };

    // 7. Persist to DB
    currentStage = 'saveAnalysis';
    if (isUsingMemoryDB()) {
      inquiry.analysisResult = finalAnalysisResult;
      if (!inquiry.analysisHistory) inquiry.analysisHistory = [];
      inquiry.analysisHistory.push(finalAnalysisResult);
      inquiry.draft = replyText;
      inquiry.extractedMessageText = mergedOutput.extractedMessageText;
      inquiry.status = 'analyzed';
      inquiry.updatedAt = new Date().toISOString();
    } else {
      inquiry = await Inquiry.findOneAndUpdate(
        { _id: id, userId },
        {
          $set: {
            analysisResult: finalAnalysisResult,
            draft: replyText,
            extractedMessageText: mergedOutput.extractedMessageText,
            clientAttachments: inquiry.clientAttachments,
            conversationHistory: inquiry.conversationHistory,
            analyzedScreenshots: inquiry.analyzedScreenshots,
            screenshotData: inquiry.screenshotData,
            screenshotMimeType: inquiry.screenshotMimeType,
            sourceType: inquiry.sourceType,
            status: 'analyzed',
          },
          $push: {
            analysisHistory: finalAnalysisResult,
          },
        },
        { new: true }
      );
    }

    console.log('[AI ANALYSIS] Complete inquiry analysis saved successfully');

    // Trigger AI Analysis Completed Notification
    await createNotificationHelper({
      userId,
      type: 'ai_analysis_completed',
      title: 'AI analysis completed',
      message: 'The inquiry is ready for your review.',
      inquiryId: inquiry.id || inquiry._id?.toString() || id,
    });

    res.json({
      success: true,
      message: 'Inquiry analyzed successfully',
      data: inquiry,
      aiCreditsRemaining: remainingCredits,
    });
  } catch (error: any) {
    // Refund credit if reserved
    if (creditReserved) {
      if (isUsingMemoryDB() && memUser) {
        memUser.aiCreditsRemaining = (memUser.aiCreditsRemaining || 0) + 1;
      } else {
        await User.updateOne({ _id: userId }, { $inc: { aiCreditsRemaining: 1 } }).catch(() => {});
      }
    }

    if (
      error instanceof GeminiQuotaExhaustedError ||
      error.name === 'GeminiQuotaExhaustedError' ||
      error.code === 'GEMINI_QUOTA_EXHAUSTED' ||
      isQuotaExhaustedError(error)
    ) {
      logAiAnalysisError(id, currentStage, error);
      res.status(429).json({
        success: false,
        error: 'GEMINI_QUOTA_EXHAUSTED',
        message:
          'AI analysis cannot currently continue because the configured Gemini API quota has been exhausted. Please try again later or check your Gemini API plan.',
      });
      return;
    }

    if (error instanceof GeminiConfigError) {
      logAiAnalysisError(id, currentStage, error);
      res.status(400).json({
        success: false,
        error: 'GEMINI_CONFIGURATION_ERROR',
        message: 'Gemini API key is missing or invalid in server environment.',
      });
      return;
    }

    if (
      error instanceof GeminiModelUnavailableError ||
      error.name === 'GeminiModelUnavailableError' ||
      error.code === 'GEMINI_MODEL_UNAVAILABLE'
    ) {
      logAiAnalysisError(id, currentStage, error);
      res.status(503).json({
        success: false,
        error: 'GEMINI_MODEL_UNAVAILABLE',
        message: 'AI model service is temporarily unavailable. Please try again in a few moments.',
      });
      return;
    }

    logAiAnalysisError(id, currentStage, error);
    next(error);
  }
}

export async function generateInquiryReply(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.userId;
  const { id } = req.params;
  const { tone = 'friendly' } = req.body;

  let memUser: any = null;
  let creditReserved = false;
  let remainingCredits = 0;

  try {
    let inquiry: any = null;
    let profile: any = null;

    if (isUsingMemoryDB()) {
      inquiry = memoryStore.inquiries.find((i) => i.id === id && i.userId === userId);
      profile = memoryStore.profiles.find((p) => p.userId === userId);
    } else {
      inquiry = await Inquiry.findOne({ _id: id, userId });
      profile = await UserProfile.findOne({ userId });
    }

    if (!inquiry) {
      res.status(404).json({ success: false, error: 'INQUIRY_NOT_FOUND', message: 'Inquiry not found' });
      return;
    }

    if (!profile) {
      res.status(404).json({ success: false, error: 'PROFILE_NOT_FOUND', message: 'User profile not found' });
      return;
    }

    if (!inquiry.analysisResult) {
      res.status(400).json({
        success: false,
        error: 'INQUIRY_NOT_ANALYZED',
        message: 'Please analyze the inquiry before generating a reply.',
      });
      return;
    }

    // Reserve 1 Credit
    if (isUsingMemoryDB()) {
      memUser = memoryStore.users.find((u) => u.id === userId || u._id === userId);
      if (!memUser || (memUser.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT) < 1) {
        res.status(402).json({
          success: false,
          error: 'INSUFFICIENT_AI_CREDITS',
          message: "You're out of AI credits. Upgrade or wait for refill.",
        });
        return;
      }
      memUser.aiCreditsRemaining = (memUser.aiCreditsRemaining ?? PRO_PLAN_AI_CREDITS_LIMIT) - 1;
      creditReserved = true;
      remainingCredits = memUser.aiCreditsRemaining;
    } else {
      const user = await User.findOneAndUpdate(
        { _id: userId, aiCreditsRemaining: { $gte: 1 } },
        { $inc: { aiCreditsRemaining: -1 } },
        { new: true }
      );
      if (!user) {
        res.status(402).json({
          success: false,
          error: 'INSUFFICIENT_AI_CREDITS',
          message: "You're out of AI credits. Upgrade or wait for refill.",
        });
        return;
      }
      creditReserved = true;
      remainingCredits = user.aiCreditsRemaining;
    }

    const analysis = inquiry.analysisResult;

    console.log(`[AI ANALYSIS] Starting reply generation for inquiry: ${id}`);
    console.log('[AI ANALYSIS] Reply generation started');

    let replyText = '';
    try {
      replyText = await generateReply({
        clientMessage: inquiry.extractedMessageText || inquiry.rawMessage,
        clientWants: analysis.clientWants || [],
        capabilityStatus: analysis.capability || 'supported',
        matchedSkills: analysis.matchedSkills || [],
        missingSkills: analysis.missingSkills || [],
        informationToClarify: analysis.questionsToClarify || [],
        itemizedBreakdown: analysis.pricingEstimate?.breakdown || [],
        estimatedTotalMin: analysis.pricingEstimate?.minPrice || 500,
        estimatedTotalMax: analysis.pricingEstimate?.maxPrice || 1000,
        estimatedDeliveryDays: analysis.pricingEstimate?.deliveryDays || 5,
        tone,
        businessRules: profile.businessRules || [],
        depositPercentage: profile.depositPercentage,
        maxRevisions: profile.maxRevisions,
      });
      console.log('[AI ANALYSIS] Reply generation completed');
    } catch (err: any) {
      logAiAnalysisError(id, 'generateReply', err);
      throw err;
    }

    if (isUsingMemoryDB()) {
      inquiry.draft = replyText;
      inquiry.selectedTone = tone;
      if (inquiry.analysisResult) {
        inquiry.analysisResult.aiSuggestedReply = replyText;
      }
      inquiry.updatedAt = new Date().toISOString();
    } else {
      inquiry = await Inquiry.findOneAndUpdate(
        { _id: id, userId },
        {
          $set: {
            draft: replyText,
            selectedTone: tone,
            'analysisResult.aiSuggestedReply': replyText,
          },
        },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'Reply generated successfully',
      data: inquiry,
      aiCreditsRemaining: remainingCredits,
    });
  } catch (error: any) {
    if (creditReserved) {
      if (isUsingMemoryDB() && memUser) {
        memUser.aiCreditsRemaining = (memUser.aiCreditsRemaining || 0) + 1;
      } else {
        await User.updateOne({ _id: userId }, { $inc: { aiCreditsRemaining: 1 } }).catch(() => {});
      }
    }

    if (
      error instanceof GeminiQuotaExhaustedError ||
      error.name === 'GeminiQuotaExhaustedError' ||
      error.code === 'GEMINI_QUOTA_EXHAUSTED' ||
      isQuotaExhaustedError(error)
    ) {
      res.status(429).json({
        success: false,
        error: 'GEMINI_QUOTA_EXHAUSTED',
        message:
          'AI reply generation cannot currently continue because the configured Gemini API quota has been exhausted. Please try again later or check your Gemini API plan.',
      });
      return;
    }

    if (error instanceof GeminiConfigError) {
      res.status(400).json({
        success: false,
        error: 'GEMINI_CONFIGURATION_ERROR',
        message: 'Gemini API key is missing or invalid in server environment.',
      });
      return;
    }

    if (
      error instanceof GeminiModelUnavailableError ||
      error.name === 'GeminiModelUnavailableError' ||
      error.code === 'GEMINI_MODEL_UNAVAILABLE'
    ) {
      res.status(503).json({
        success: false,
        error: 'GEMINI_MODEL_UNAVAILABLE',
        message: 'AI model service is temporarily unavailable. Please try again in a few moments.',
      });
      return;
    }

    next(error);
  }
}

export async function translateInquiryAnalysis(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const userId = req.userId!;
    const targetLanguage = req.body?.targetLanguage || 'bn';

    console.log(`[AI TRANSLATION] Translating inquiry analysis ${id} to ${targetLanguage} for user: ${userId}`);

    let inquiry: any = null;
    if (isUsingMemoryDB()) {
      inquiry = memoryStore.inquiries.find(
        (i) => (i.id === id || i._id === id || String(i.id) === String(id) || String(i._id) === String(id)) && (String(i.userId) === String(userId) || !i.userId)
      );
    } else {
      const isObjId = mongoose.Types.ObjectId.isValid(id);
      const isUserObjId = mongoose.Types.ObjectId.isValid(userId);

      if (isObjId && isUserObjId) {
        try {
          inquiry = await Inquiry.findOne({ _id: id, userId });
        } catch {
          inquiry = null;
        }
      }
      if (!inquiry && isObjId) {
        try {
          inquiry = await Inquiry.findOne({ _id: id });
        } catch {
          inquiry = null;
        }
      }
      if (!inquiry) {
        inquiry = memoryStore.inquiries.find(
          (i) => (i.id === id || i._id === id || String(i.id) === String(id) || String(i._id) === String(id))
        );
      }
    }

    if (!inquiry) {
      console.warn(`[AI TRANSLATION] Inquiry not found for ID: ${id}`);
      res.status(404).json({ success: false, error: 'INQUIRY_NOT_FOUND', message: 'Inquiry not found' });
      return;
    }

    if (!inquiry.analysisResult) {
      res.status(400).json({
        success: false,
        error: 'INQUIRY_NOT_ANALYZED',
        message: 'Please analyze the inquiry before translating.',
      });
      return;
    }

    // Check if already translated and cached
    if (inquiry.analysisResult.translations && inquiry.analysisResult.translations[targetLanguage]) {
      console.log(`[AI TRANSLATION] Returning cached translation for inquiry ${id}`);
      res.json({
        success: true,
        message: 'Analysis translation retrieved from cache',
        data: inquiry,
        translatedAnalysis: inquiry.analysisResult.translations[targetLanguage],
      });
      return;
    }

    // Call Gemini translation (does NOT deduct AI credits)
    console.log(`[AI TRANSLATION] Requesting Gemini translation for inquiry ${id}...`);
    const translatedAnalysis = await translateAnalysisToBengali(inquiry.analysisResult);

    if (!inquiry.analysisResult.translations) {
      inquiry.analysisResult.translations = {};
    }
    inquiry.analysisResult.translations[targetLanguage] = translatedAnalysis;

    if (isUsingMemoryDB()) {
      inquiry.updatedAt = new Date().toISOString();
    } else {
      const isDocObjId = mongoose.Types.ObjectId.isValid(inquiry._id || id);
      if (isDocObjId) {
        const updatedDoc = await Inquiry.findOneAndUpdate(
          { _id: inquiry._id || id },
          {
            $set: {
              analysisResult: inquiry.analysisResult,
            },
          },
          { new: true }
        );
        if (updatedDoc) {
          inquiry = updatedDoc;
        }
      } else {
        inquiry.updatedAt = new Date().toISOString();
      }
    }

    console.log(`[AI TRANSLATION] Analysis translation saved successfully for inquiry ${id}`);

    res.json({
      success: true,
      message: 'Analysis translated successfully',
      data: inquiry,
      translatedAnalysis,
    });
  } catch (error: any) {
    logAiAnalysisError(id, 'translateInquiryAnalysis', error);

    if (
      error instanceof GeminiQuotaExhaustedError ||
      error.name === 'GeminiQuotaExhaustedError' ||
      error.code === 'GEMINI_QUOTA_EXHAUSTED' ||
      isQuotaExhaustedError(error)
    ) {
      res.status(429).json({
        success: false,
        error: 'GEMINI_QUOTA_EXHAUSTED',
        message: 'AI translation service quota has been temporarily reached. The English analysis remains available.',
      });
      return;
    }

    if (error instanceof GeminiConfigError) {
      res.status(400).json({
        success: false,
        error: 'GEMINI_CONFIGURATION_ERROR',
        message: 'Gemini API key is not configured in server environment.',
      });
      return;
    }

    if (
      error instanceof GeminiModelUnavailableError ||
      error.name === 'GeminiModelUnavailableError' ||
      error.code === 'GEMINI_MODEL_UNAVAILABLE'
    ) {
      res.status(503).json({
        success: false,
        error: 'GEMINI_MODEL_UNAVAILABLE',
        message: 'AI translation model service is temporarily unavailable. Please try again in a moment.',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'TRANSLATION_FAILED',
      message: error?.message || 'Failed to translate inquiry analysis into Bengali.',
    });
  }
}


