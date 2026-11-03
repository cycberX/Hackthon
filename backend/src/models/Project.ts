import mongoose, { Document, Model, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: string;
  name: string;
  ownerId: mongoose.Types.ObjectId;
  projectTokenHash: string;
  projectTokenPrefix: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    projectId: {
      type: String,
      unique: true,
      index: true,
      default: () => `proj_${crypto.randomBytes(8).toString('hex')}`,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectTokenHash: {
      type: String,
      required: true,
      select: false,
    },
    projectTokenPrefix: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Project: Model<IProject> = mongoose.model<IProject>('Project', ProjectSchema);
