import mongoose, { Document, Model, Schema } from 'mongoose';

export type ProviderCategory = 'ai' | 'music' | 'weather' | 'news' | 'environment';

export interface IVaultSecret extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  category: ProviderCategory;
  providerId: string;
  encryptedCombined: string;
  keyPreview: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const VaultSecretSchema = new Schema<IVaultSecret>(
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
    providerId: {
      type: String,
      required: true,
      trim: true,
    },
    encryptedCombined: {
      type: String,
      required: true,
      select: false, // Never return raw encrypted ciphertext in standard queries
    },
    keyPreview: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes: one credential per provider per category per project / developer
VaultSecretSchema.index({ projectId: 1, category: 1, providerId: 1 });
VaultSecretSchema.index({ userId: 1, category: 1, providerId: 1 });

export const VaultSecret: Model<IVaultSecret> = mongoose.model<IVaultSecret>('VaultSecret', VaultSecretSchema);
