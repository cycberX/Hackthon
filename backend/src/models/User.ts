import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IApiKey {
  _id: mongoose.Types.ObjectId;
  name: string;
  keyHash: string;
  keyPrefix: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  user_id: string;
  name: string;
  phone_no: string;
  email: string;
  password?: string;
  terms_accepted: boolean;
  role: 'user' | 'admin';
  isVerified: boolean;
  verificationOtp?: string;
  verificationOtpExpires?: Date;
  resetPasswordOtp?: string;
  resetPasswordExpires?: Date;
  apiKeys: IApiKey[];
  lastLogin?: Date;
  lastLoginIp?: string;
  lastLoginDevice?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    name: { type: String, required: true, trim: true },
    keyHash: { type: String, required: true, select: false },
    keyPrefix: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    lastUsedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const UserSchema = new Schema<IUser>(
  {
    user_id: {
      type: String,
      unique: true,
      index: true,
      default: () => `usr_${crypto.randomBytes(8).toString('hex')}`,
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone_no: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
      maxlength: [25, 'Phone number cannot exceed 25 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Prevents sensitive password hash leakage in normal queries
    },
    terms_accepted: {
      type: Boolean,
      required: [true, 'Terms and conditions must be accepted'],
      default: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationOtp: {
      type: String,
      select: false,
    },
    verificationOtpExpires: {
      type: Date,
      select: false,
    },
    resetPasswordOtp: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    apiKeys: [ApiKeySchema],
    lastLogin: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },
    lastLoginDevice: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret.password;
        delete ret.verificationOtp;
        delete ret.verificationOtpExpires;
        delete ret.resetPasswordOtp;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        if (Array.isArray(ret.apiKeys)) {
          ret.apiKeys.forEach((key: any) => {
            delete key.keyHash;
          });
        }
        return ret;
      },
    },
  }
);

// Pre-save hook: Ensure user_id exists & hash password if modified
UserSchema.pre('save', async function () {
  if (!this.user_id) {
    this.user_id = `usr_${crypto.randomBytes(8).toString('hex')}`;
  }

  if (!this.isModified('password') || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
