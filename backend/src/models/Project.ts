import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectModel extends Model<IProject> {
  getOrCreateDefaultProject(userId: string | mongoose.Types.ObjectId): Promise<IProject>;
}

const ProjectSchema = new Schema<IProject>(
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
      default: 'Default Project',
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: 'default',
    },
    description: {
      type: String,
      trim: true,
      default: 'Primary project configuration scope',
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique project slug per user
ProjectSchema.index({ userId: 1, slug: 1 }, { unique: true });
ProjectSchema.index({ userId: 1, isDefault: 1 });

/**
 * Resolves the user's default project or creates one automatically.
 */
ProjectSchema.statics.getOrCreateDefaultProject = async function (
  userId: string | mongoose.Types.ObjectId
): Promise<IProject> {
  const uid = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

  let project = await this.findOne({ userId: uid, isDefault: true });
  if (project) return project;

  // Check if any project exists for this user
  project = await this.findOne({ userId: uid }).sort({ createdAt: 1 });
  if (project) {
    project.isDefault = true;
    await project.save();
    return project;
  }

  // Create initial default project
  project = await this.create({
    userId: uid,
    name: 'Default Project',
    slug: 'default',
    description: 'Initial project configuration scope for OneAPI keys and vaults',
    isDefault: true,
  });

  return project;
};

export const Project = (mongoose.models.Project as IProjectModel) ||
  mongoose.model<IProject, IProjectModel>('Project', ProjectSchema);

export async function getOrCreateDefaultProject(
  userId: string | mongoose.Types.ObjectId
): Promise<IProject> {
  return Project.getOrCreateDefaultProject(userId);
}
