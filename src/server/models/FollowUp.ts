import mongoose, { Schema, Document } from 'mongoose';
import { FollowUpStatus } from '../../shared/types.js';

export interface IFollowUpDocument extends Document {
  userId: mongoose.Types.ObjectId;
  inquiryId: mongoose.Types.ObjectId;
  clientName: string;
  clientEmail?: string;
  subject?: string;
  sourceChannel?: string;
  status: FollowUpStatus;
  lastUserReplyAt: Date;
  lastUserReplyText?: string;
  lastClientMessageText?: string;
  lastClientMessageAt?: Date;
  dueAt: Date;
  scheduledFor?: Date;
  snoozedUntil?: Date;
  completedAt?: Date;
  dismissedAt?: Date;
  generatedMessage?: string;
  sentMessage?: string;
  tone?: 'friendly' | 'formal' | 'concise' | 'detailed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new Schema<IFollowUpDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    inquiryId: {
      type: Schema.Types.ObjectId,
      ref: 'Inquiry',
      required: true,
      index: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      trim: true,
      default: 'Project Follow-up',
    },
    sourceChannel: {
      type: String,
      default: 'Direct',
    },
    status: {
      type: String,
      enum: ['due', 'scheduled', 'completed', 'dismissed', 'snoozed'],
      default: 'due',
      index: true,
    },
    lastUserReplyAt: {
      type: Date,
      required: true,
    },
    lastUserReplyText: {
      type: String,
      default: '',
    },
    lastClientMessageText: {
      type: String,
      default: '',
    },
    lastClientMessageAt: {
      type: Date,
    },
    dueAt: {
      type: Date,
      required: true,
    },
    scheduledFor: {
      type: Date,
    },
    snoozedUntil: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    dismissedAt: {
      type: Date,
    },
    generatedMessage: {
      type: String,
      default: '',
    },
    sentMessage: {
      type: String,
      default: '',
    },
    tone: {
      type: String,
      enum: ['friendly', 'formal', 'concise', 'detailed'],
      default: 'friendly',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user isolation, status querying, and inquiry matching
FollowUpSchema.index({ userId: 1, status: 1 });
FollowUpSchema.index({ userId: 1, inquiryId: 1, lastUserReplyAt: 1 });
FollowUpSchema.index({ userId: 1, dueAt: 1 });

export const FollowUp = mongoose.model<IFollowUpDocument>('FollowUp', FollowUpSchema);
