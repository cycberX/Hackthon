import mongoose, { Document, Model, Schema } from 'mongoose';
import type { ProviderCategory } from './VaultSecret.js';

export interface IRoutingRule extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  category: ProviderCategory;
  primaryProviderId: string;
  fallbackProviderId: string;
  timeoutMs: number;
  retryOnStatusCodes: number[];
  createdAt: Date;
  updatedAt: Date;
}

const RoutingRuleSchema = new Schema<IRoutingRule>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
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
      required: true,
    },
    timeoutMs: {
      type: Number,
      default: 5000,
    },
    retryOnStatusCodes: {
      type: [Number],
      default: [429, 500, 502, 503, 504],
    },
  },
  {
    timestamps: true,
  }
);

RoutingRuleSchema.index({ projectId: 1, category: 1 }, { unique: true });

export const RoutingRule: Model<IRoutingRule> = mongoose.model<IRoutingRule>('RoutingRule', RoutingRuleSchema);
