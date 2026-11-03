import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED' | 'ATTEMPT';
  details?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userEmail: {
      type: String,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'ATTEMPT'],
      default: 'SUCCESS',
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
