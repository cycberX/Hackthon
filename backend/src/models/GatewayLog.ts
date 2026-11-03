import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGatewayLog extends Document {
  projectId: mongoose.Types.ObjectId;
  category: string;
  endpoint: string;
  primaryProvider: string;
  finalProvider: string;
  fallbackTriggered: boolean;
  fallbackReason?: string;
  latencyMs: number;
  statusCode: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const GatewayLogSchema = new Schema<IGatewayLog>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    primaryProvider: {
      type: String,
      required: true,
    },
    finalProvider: {
      type: String,
      required: true,
    },
    fallbackTriggered: {
      type: Boolean,
      default: false,
      index: true,
    },
    fallbackReason: {
      type: String,
    },
    latencyMs: {
      type: Number,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

GatewayLogSchema.index({ projectId: 1, createdAt: -1 });

export const GatewayLog: Model<IGatewayLog> = mongoose.model<IGatewayLog>('GatewayLog', GatewayLogSchema);
