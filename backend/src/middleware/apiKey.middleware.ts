import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User, type IUser, type IApiKey } from '../models/User.js';
import { ApiKey } from '../models/ApiKey.js';
import { hashToken, safeCompare } from '../utils/crypto.js';
import { AuditLog } from '../models/AuditLog.js';

export interface ApiKeyAuthenticatedRequest extends Request {
  apiKeyUser?: IUser;
  apiKeyData?: IApiKey;
}

/**
 * Middleware to validate an API key together with user_id and email.
 * Suitable for AI agents and service-to-service communication.
 * Looks for:
 *   - x-api-key / Authorization: ApiKey <key>
 *   - x-user-id
 *   - x-user-email
 */
export async function validateApiKey(
  req: ApiKeyAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawApiKey =
      (req.headers['x-api-key'] as string) ||
      (req.headers.authorization?.startsWith('ApiKey ')
        ? req.headers.authorization.split(' ')[1]
        : undefined) ||
      req.body?.apiKey;

    const userId = (req.headers['x-user-id'] as string) || req.body?.user_id || req.body?.userId;
    const userEmail = (req.headers['x-user-email'] as string) || req.body?.email;

    if (!rawApiKey) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key is required in x-api-key header or body.',
        },
      });
      return;
    }

    if (!userId || !userEmail) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Both user ID (x-user-id) and user email (x-user-email) are required for AI validation.',
        },
      });
      return;
    }

    // Find user matching both user_id (or _id) and email safely
    const query: Record<string, any> = { email: userEmail.toLowerCase() };
    if (typeof userId === 'string' && userId.startsWith('usr_')) {
      query.user_id = userId;
    } else if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
      query.$or = [{ user_id: userId }, { _id: userId }];
    } else if (typeof userId === 'string') {
      query.user_id = userId;
    }

    const hashedKey = hashToken(rawApiKey);

    // 1. Try finding in dedicated ApiKey model
    const dbKey = await ApiKey.findOne({ keyHash: hashedKey }).populate('userId');
    if (dbKey && dbKey.userId) {
      const u = dbKey.userId as any;
      const matchesEmail = !userEmail || u.email.toLowerCase() === userEmail.toLowerCase();
      const matchesId = !userId || u.user_id === userId || u._id.toString() === userId;

      if (!matchesEmail || !matchesId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'USER_MISMATCH',
            message: 'No account matches the provided user ID and email combination.',
          },
        });
        return;
      }

      if (!dbKey.isActive) {
        res.status(403).json({
          success: false,
          error: {
            code: 'API_KEY_DEACTIVATED',
            message: 'This API key has been deactivated. Please generate or activate a new one.',
          },
        });
        return;
      }

      if (dbKey.expiresAt && dbKey.expiresAt < new Date()) {
        res.status(403).json({
          success: false,
          error: {
            code: 'API_KEY_EXPIRED',
            message: 'This API key has expired.',
          },
        });
        return;
      }

      req.apiKeyUser = u;
      req.apiKeyData = dbKey as any;

      ApiKey.updateOne({ _id: dbKey._id }, { $set: { lastUsedAt: new Date() } }).catch(() => {});
      return next();
    }

    const user = await User.findOne(query).select('+apiKeys.keyHash');
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_MISMATCH',
          message: 'No account matches the provided user ID and email combination.',
        },
      });
      return;
    }

    const keyRecord = user.apiKeys.find((k) => safeCompare(k.keyHash, hashedKey));

    if (!keyRecord) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Provided API key is not recognized for this user.',
        },
      });
      return;
    }

    if (!keyRecord.isActive) {
      res.status(403).json({
        success: false,
        error: {
          code: 'API_KEY_DEACTIVATED',
          message: 'This API key has been deactivated. Please generate or activate a new one.',
        },
      });
      return;
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      res.status(403).json({
        success: false,
        error: {
          code: 'API_KEY_EXPIRED',
          message: 'This API key has expired.',
        },
      });
      return;
    }

    // Update lastUsedAt timestamp on key
    keyRecord.lastUsedAt = new Date();
    await user.save();

    req.apiKeyUser = user;
    req.apiKeyData = keyRecord;

    await AuditLog.create({
      action: 'API_KEY_VALIDATED',
      userId: user._id,
      userEmail: user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'SUCCESS',
      details: { keyId: keyRecord._id, keyName: keyRecord.name },
    });

    next();
  } catch (err: any) {
    next(err);
  }
}
