import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User, type IUser } from '../models/User.js';
import { ApiKey } from '../models/ApiKey.js';
import { Project, getOrCreateDefaultProject, type IProject } from '../models/Project.js';
import { hashToken, safeCompare } from '../utils/crypto.js';
import { verifyAccessToken } from '../utils/tokens.js';

export interface GatewayAuthenticatedRequest extends Request {
  user?: IUser;
  project?: IProject | null;
  projectId?: mongoose.Types.ObjectId;
  apiKeyMeta?: {
    name: string;
    keyPrefix: string;
    projectId?: mongoose.Types.ObjectId;
  };
}

/**
 * Middleware that authenticates incoming OneAPI gateway proxy calls.
 * Enforces project-scoped token validation and binds the proxy call to the
 * developer's project configuration, provider vault, and routing rules.
 *
 * Accepts:
 *   1. OneAPI Developer API Key: "x-api-key: sk_live_..." or "Authorization: Bearer sk_live_..." / "Authorization: ApiKey sk_live_..."
 *   2. User Auth JWT Token: "Authorization: Bearer <jwt_access_token>"
 */
export async function authenticateGateway(
  req: GatewayAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let rawToken: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawToken = authHeader.split(' ')[1];
    } else if (authHeader && authHeader.startsWith('ApiKey ')) {
      rawToken = authHeader.split(' ')[1];
    } else if (req.headers['x-api-key']) {
      rawToken = req.headers['x-api-key'] as string;
    } else if (req.cookies?.token) {
      rawToken = req.cookies.token;
    }

    if (!rawToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'OneAPI Developer API Key (sk_live_...) or User Auth Token is required.',
        },
      });
      return;
    }

    const callerProjectId =
      (req.headers['x-project-id'] as string) ||
      (req.headers['x-oneapi-project-id'] as string) ||
      (req.query?.projectId as string) ||
      req.body?.projectId;

    // 1. Check if token is a User JWT Session Access Token
    try {
      const decoded = verifyAccessToken(rawToken);
      if (decoded?.userId) {
        const user = await User.findById(decoded.userId);
        if (user) {
          req.user = user;

          if (callerProjectId && callerProjectId !== 'default') {
            if (!mongoose.Types.ObjectId.isValid(callerProjectId)) {
              res.status(400).json({
                success: false,
                error: {
                  code: 'INVALID_PROJECT_ID',
                  message: `The provided projectId "${callerProjectId}" is not a valid 24-character identifier.`,
                },
              });
              return;
            }

            const project = await Project.findOne({
              _id: new mongoose.Types.ObjectId(callerProjectId),
              userId: user._id,
            });

            if (!project) {
              res.status(403).json({
                success: false,
                error: {
                  code: 'FORBIDDEN_PROJECT_ACCESS',
                  message: 'Access denied: The requested project does not exist or does not belong to the authenticated user.',
                },
              });
              return;
            }

            req.project = project;
            req.projectId = project._id;
          } else {
            const defProject = await getOrCreateDefaultProject(user._id);
            req.project = defProject;
            req.projectId = defProject._id;
          }

          return next();
        }
      }
    } catch {
      // Not a valid JWT, proceed to Developer API Key check
    }

    // 2. Check Developer API Key in dedicated ApiKey model
    const hashedToken = hashToken(rawToken);
    const keyDoc = await ApiKey.findOne({
      keyHash: hashedToken,
      isActive: true,
    }).populate('userId');

    if (keyDoc && keyDoc.userId) {
      const user = keyDoc.userId as any;
      req.user = user;
      req.apiKeyMeta = {
        name: keyDoc.name,
        keyPrefix: keyDoc.keyPrefix,
        projectId: keyDoc.projectId,
      };

      if (keyDoc.projectId) {
        // Enforce strict project matching if caller also passed an explicit project ID
        if (callerProjectId && callerProjectId !== keyDoc.projectId.toString()) {
          res.status(403).json({
            success: false,
            error: {
              code: 'PROJECT_MISMATCH',
              message: `This API key is bound to project "${keyDoc.projectId}", but request specified project "${callerProjectId}".`,
            },
          });
          return;
        }

        const project = await Project.findOne({ _id: keyDoc.projectId, userId: user._id });
        req.project = project;
        req.projectId = keyDoc.projectId;
      } else if (callerProjectId && callerProjectId !== 'default') {
        if (!mongoose.Types.ObjectId.isValid(callerProjectId)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_PROJECT_ID',
              message: `The provided projectId "${callerProjectId}" is not a valid 24-character identifier.`,
            },
          });
          return;
        }

        const project = await Project.findOne({
          _id: new mongoose.Types.ObjectId(callerProjectId),
          userId: user._id,
        });

        if (!project) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN_PROJECT_ACCESS',
              message: 'Access denied: The requested project does not exist or does not belong to the authenticated user.',
            },
          });
          return;
        }

        req.project = project;
        req.projectId = project._id;
      } else {
        const defProject = await getOrCreateDefaultProject(user._id);
        req.project = defProject;
        req.projectId = defProject._id;
      }

      // Async update lastUsedAt
      ApiKey.updateOne({ _id: keyDoc._id }, { $set: { lastUsedAt: new Date() } }).catch(() => {});
      return next();
    }

    // 3. Fallback check across legacy embedded User.apiKeys
    const allUsersWithKey = await User.findOne({
      'apiKeys.keyHash': hashedToken,
      'apiKeys.isActive': true,
    });

    if (allUsersWithKey) {
      req.user = allUsersWithKey;
      const defProject = await getOrCreateDefaultProject(allUsersWithKey._id);
      req.project = defProject;
      req.projectId = defProject._id;
      return next();
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'The provided OneAPI API Key or Token is invalid or has been revoked.',
      },
    });
  } catch (err: any) {
    next(err);
  }
}
