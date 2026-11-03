import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Project, type IProject } from '../models/Project.js';
import { User } from '../models/User.js';
import { hashToken } from '../utils/crypto.js';
import { verifyAccessToken } from '../utils/tokens.js';

export interface ProjectAuthenticatedRequest extends Request {
  project?: IProject;
}

/**
 * Middleware that authenticates incoming proxy requests.
 * Flexible authentication accepts:
 *   1. Project Token: "x-project-token: oneapi_dev_xxx" or "Authorization: Bearer oneapi_dev_xxx"
 *   2. User JWT Session Token: "Authorization: Bearer <jwt>" (resolves user's active project)
 *   3. Developer API Key: "x-api-key: sk_live_xxx" or "Authorization: ApiKey sk_live_xxx" (resolves user's active project)
 */
export async function authenticateProject(
  req: ProjectAuthenticatedRequest,
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
    } else if (req.headers['x-project-token']) {
      rawToken = req.headers['x-project-token'] as string;
    } else if (req.headers['x-api-key']) {
      rawToken = req.headers['x-api-key'] as string;
    } else if (req.cookies?.token) {
      rawToken = req.cookies.token;
    }

    if (!rawToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_PROJECT_TOKEN',
          message: 'OneAPI Project Token is required. Supply via "Authorization: Bearer <token>" or "x-project-token" header.',
        },
      });
      return;
    }

    // 1. Check direct project token match (hash of oneapi_dev_xxx)
    const hashedToken = hashToken(rawToken);
    let project = await Project.findOne({ projectTokenHash: hashedToken, isActive: true });

    if (project) {
      req.project = project;
      return next();
    }

    // 2. Check if token is a User JWT Access Token (e.g. testing from dashboard with user session)
    try {
      const decoded = verifyAccessToken(rawToken);
      if (decoded?.userId) {
        const requestedProjectId = (req.headers['x-project-id'] as string) || (req.query.projectId as string) || req.body?.projectId;
        if (requestedProjectId) {
          const isMongoId = mongoose.Types.ObjectId.isValid(requestedProjectId);
          project = await Project.findOne({
            $or: isMongoId ? [{ projectId: requestedProjectId }, { _id: requestedProjectId }] : [{ projectId: requestedProjectId }],
            ownerId: decoded.userId,
            isActive: true,
          });
        }

        if (!project) {
          project = await Project.findOne({ ownerId: decoded.userId, isActive: true }).sort({ createdAt: -1 });
        }

        if (project) {
          req.project = project;
          return next();
        } else {
          res.status(404).json({
            success: false,
            error: {
              code: 'NO_ACTIVE_PROJECT',
              message: 'No active OneAPI project found for your account. Please create a project first at /api/v1/projects.',
            },
          });
          return;
        }
      }
    } catch {
      // Not a JWT, proceed to Developer API key check
    }

    // 3. Check if token is a Developer API Key (sk_live_xxx)
    const user = await User.findOne({
      'apiKeys.keyHash': hashedToken,
      'apiKeys.isActive': true,
    });

    if (user) {
      const requestedProjectId = (req.headers['x-project-id'] as string) || (req.query.projectId as string) || req.body?.projectId;
      if (requestedProjectId) {
        const isMongoId = mongoose.Types.ObjectId.isValid(requestedProjectId);
        project = await Project.findOne({
          $or: isMongoId ? [{ projectId: requestedProjectId }, { _id: requestedProjectId }] : [{ projectId: requestedProjectId }],
          ownerId: user._id,
          isActive: true,
        });
      }

      if (!project) {
        project = await Project.findOne({ ownerId: user._id, isActive: true }).sort({ createdAt: -1 });
      }

      if (project) {
        req.project = project;
        return next();
      }
    }

    // If none matched, return 401
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_PROJECT_TOKEN',
        message: 'The provided OneAPI Project Token is invalid or has been deactivated.',
      },
    });
  } catch (err: any) {
    next(err);
  }
}
