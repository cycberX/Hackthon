import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IApiKeyDoc extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  name: string;
  keyPrefix: string;
  keyHash: string;
  encryptedKey?: string;
  scopes: string[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  rateLimitPerMinute: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ApiKeySchema = new Schema<IApiKeyDoc>(
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
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'Production Key',
    },
    keyPrefix: {
      type: String,
      required: true,
      trim: true,
    },
    keyHash: {
      type: String,
      required: true,
      index: true,
      select: false,
    },
    encryptedKey: {
      type: String,
      select: false,
    },
    scopes: {
      type: [String],
      default: ['read', 'write', 'proxy'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    rateLimitPerMinute: {
      type: Number,
      default: 120,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for querying active keys by user, project, and token hash
ApiKeySchema.index({ userId: 1, isActive: 1 });
ApiKeySchema.index({ projectId: 1, isActive: 1 });
ApiKeySchema.index({ keyHash: 1, isActive: 1 });

export const ApiKey: Model<IApiKeyDoc> =
  mongoose.models.ApiKey || mongoose.model<IApiKeyDoc>('ApiKey', ApiKeySchema);
