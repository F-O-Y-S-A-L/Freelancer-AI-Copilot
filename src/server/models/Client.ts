import mongoose, { Schema, Document } from 'mongoose';

export interface IClientDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  company?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClientDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    company: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for multi-tenant isolation and search query optimizations
ClientSchema.index({ userId: 1, email: 1 });
ClientSchema.index({ userId: 1, name: 1 });

export const Client =
  (mongoose.models.Client as mongoose.Model<IClientDocument>) ||
  mongoose.model<IClientDocument>('Client', ClientSchema);
