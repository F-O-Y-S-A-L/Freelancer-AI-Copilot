import mongoose, { Schema, Document } from 'mongoose';
import { IUserProfile, IServiceItem, IPricingRule, DEFAULT_AVATAR } from '../../shared/types.js';

export type IServiceSchema = IServiceItem;
export type IPricingRuleSchema = IPricingRule;

export interface IUserProfileDocument extends Omit<IUserProfile, 'id' | '_id' | 'userId'>, Document {
  userId: any;
}

const ServiceItemSchema = new Schema<IServiceItem>(
  {
    id: { type: String },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    basePrice: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD' },
    pricingModel: {
      type: String,
      enum: ['fixed', 'hourly', 'starting_at', 'custom'],
      default: 'fixed',
    },
    deliveryDays: { type: Number, default: 3 },
    deliverables: [{ type: String }],
  },
  { _id: false }
);

const UserProfileSchema = new Schema<IUserProfileDocument>(
  {
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      unique: true,
      index: true,
    },
    profession: {
      type: String,
      default: '',
    },
    professions: [{ type: String }],
    categories: [{ type: String }],
    specializations: [{ type: String }],
    experienceLevel: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'expert'],
      default: 'mid',
    },
    bio: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: DEFAULT_AVATAR,
    },
    skills: [{ type: String }],
    toolsAndFrameworks: [{ type: String }],
    supportedWork: [{ type: String }],
    unsupportedWork: [{ type: String }],
    services: [ServiceItemSchema],
    pricingRules: {
      type: Object,
      default: () => ({
        minProjectPrice: 0,
        hourlyRate: 0,
        rushOrderMultiplier: 1.0,
        currency: 'USD',
      }),
    },
    businessRules: [{ type: String }],
    maxRevisions: {
      type: Number,
      default: 0,
    },
    depositPercentage: {
      type: Number,
      default: 0,
    },
    communicationTone: {
      type: String,
      enum: ['formal', 'friendly', 'concise', 'detailed'],
      default: 'friendly',
    },
    followUpThresholdDays: {
      type: Number,
      default: 3,
      min: 1,
      max: 30,
    },
  },
  {
    timestamps: true,
  }
);

export const UserProfile =
  (mongoose.models.UserProfile as mongoose.Model<IUserProfileDocument>) ||
  mongoose.model<IUserProfileDocument>('UserProfile', UserProfileSchema);
