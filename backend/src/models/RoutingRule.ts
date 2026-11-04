import mongoose, { Document, Model, Schema } from 'mongoose';
import type { ProviderCategory } from './VaultSecret.js';

export interface IRoutingRule extends Omit<Document, 'model'> {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  category: ProviderCategory;
  primaryProviderId: string;
  fallbackProviderId: string;
  fallbackProviderIds: string[];
  timeoutMs: number;
  retryOnStatusCodes: number[];
  model?: string;
  models?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const RoutingRuleSchema = new Schema<IRoutingRule>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    category: {
      type: String,
      enum: ['ai', 'music', 'weather', 'news', 'environment'],
      required: true,
      index: true,
    },
    primaryProviderId: {
      type: String,
      required: true,
    },
    fallbackProviderId: {
      type: String,
      default: 'none',
    },
    fallbackProviderIds: {
      type: [String],
      default: [],
    },
    timeoutMs: {
      type: Number,
      default: 5000,
    },
    retryOnStatusCodes: {
      type: [Number],
      default: [429, 500, 502, 503, 504],
    },
    model: {
      type: String,
      default: '',
    },
    models: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

RoutingRuleSchema.index({ projectId: 1, category: 1 });
RoutingRuleSchema.index({ userId: 1, category: 1 });

export const RoutingRule: Model<IRoutingRule> = mongoose.model<IRoutingRule>('RoutingRule', RoutingRuleSchema);
