import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'new_inquiry' | 'client_replied' | 'ai_analysis_completed' | 'requires_reply' | 'followup_due';
  title: string;
  message: string;
  read: boolean;
  inquiryId?: string;
  conversationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['new_inquiry', 'client_replied', 'ai_analysis_completed', 'requires_reply', 'followup_due'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    inquiryId: {
      type: String,
      trim: true,
      index: true,
    },
    conversationId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user isolation, unread querying, and fast sorting
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export const Notification =
  (mongoose.models.Notification as mongoose.Model<INotificationDocument>) ||
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);
