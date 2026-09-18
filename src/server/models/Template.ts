import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplateDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplateDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'Custom',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user isolation and fast category/updated sorting
TemplateSchema.index({ userId: 1, category: 1 });
TemplateSchema.index({ userId: 1, updatedAt: -1 });

export const Template = mongoose.model<ITemplateDocument>('Template', TemplateSchema);
