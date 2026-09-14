import mongoose, { Schema, Document } from 'mongoose';
import { PRO_PLAN_AI_CREDITS_LIMIT } from '../../shared/planConfig.js';
import { DEFAULT_AVATAR } from '../../shared/types.js';

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'freelancer' | 'admin';
  avatar?: string;
  aiCreditsRemaining: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['freelancer', 'admin'],
      default: 'freelancer',
    },
    avatar: {
      type: String,
      default: DEFAULT_AVATAR,
    },
    aiCreditsRemaining: {
      type: Number,
      default: PRO_PLAN_AI_CREDITS_LIMIT,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUserDocument>('User', UserSchema);
