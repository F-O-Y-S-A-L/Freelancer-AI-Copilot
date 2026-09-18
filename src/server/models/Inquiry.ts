import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiryDocument extends Document {
  userId: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  clientName: string;
  clientEmail?: string;
  subject?: string;
  rawMessage: string;
  sourceChannel?: string;
  sourceType?: 'screenshot' | 'text';
  screenshotData?: string;
  screenshotMimeType?: string;
  clientAttachments?: any[];
  conversationHistory?: any[];
  extractedMessageText?: string;
  status: 'new' | 'analyzed' | 'replied' | 'converted' | 'declined' | 'archived';
  read: boolean;
  readAt?: Date;
  starred: boolean;
  starredAt?: Date;
  draft?: string;
  sentReply?: string;
  selectedTone?: 'friendly' | 'formal' | 'concise' | 'detailed';
  analysisResult?: any;
  analysisHistory?: any[];
  analyzedScreenshots?: any[];
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<IInquiryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
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
      default: 'New Client Project Inquiry',
    },
    rawMessage: {
      type: String,
      required: true,
    },
    sourceChannel: {
      type: String,
      default: 'Fiverr',
    },
    sourceType: {
      type: String,
      enum: ['screenshot', 'text'],
      default: 'text',
    },
    screenshotData: {
      type: String,
      default: '',
    },
    screenshotMimeType: {
      type: String,
      default: '',
    },
    clientAttachments: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
    conversationHistory: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
    extractedMessageText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['new', 'analyzed', 'replied', 'converted', 'declined', 'archived'],
      default: 'new',
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    starred: {
      type: Boolean,
      default: false,
      index: true,
    },
    starredAt: {
      type: Date,
    },
    draft: {
      type: String,
      default: '',
    },
    sentReply: {
      type: String,
      default: '',
    },
    selectedTone: {
      type: String,
      enum: ['friendly', 'formal', 'concise', 'detailed'],
      default: 'friendly',
    },
    analysisResult: {
      type: Schema.Types.Mixed,
      default: null,
    },
    analysisHistory: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
    analyzedScreenshots: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for tenant isolation, deduplication, and queries
InquirySchema.index({ userId: 1, status: 1 });
InquirySchema.index({ userId: 1, read: 1 });
InquirySchema.index({ userId: 1, starred: 1 });
InquirySchema.index({ userId: 1, createdAt: -1 });
InquirySchema.index({ userId: 1, clientId: 1, subject: 1 });
InquirySchema.index({ userId: 1, clientEmail: 1, subject: 1 });

export const Inquiry =
  (mongoose.models.Inquiry as mongoose.Model<IInquiryDocument>) ||
  mongoose.model<IInquiryDocument>('Inquiry', InquirySchema);
