import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Project, getOrCreateDefaultProject, type IProject } from '../models/Project.js';
import type { AuthenticatedRequest } from './auth.middleware.js';

export interface ProjectAuthenticatedRequest extends AuthenticatedRequest {
  project?: IProject;
  projectId?: mongoose.Types.ObjectId;
}

/**
 * Centralized ownership verification middleware.
 * Verifies that the requested projectId belongs to the authenticated user (req.user._id)
 * before any database, vault, routing, or proxy operations are executed.
 */
export async function validateProjectOwnership(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before verifying project ownership.',
        },
      });
      return;
    }

    // 1. Extract requested projectId from header, params, query, body, or bound API key
    const rawProjectId =
      (req.headers['x-project-id'] as string) ||
      (req.headers['x-oneapi-project-id'] as string) ||
      req.params.projectId ||
      (req.query.projectId as string) ||
      (req.query.project as string) ||
      req.body?.projectId ||
      req.body?.project ||
      (req as any).apiKeyProjectId;

    // 2. If a specific projectId was requested, strictly verify user ownership
    if (rawProjectId && rawProjectId !== 'default') {
      if (!mongoose.Types.ObjectId.isValid(rawProjectId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PROJECT_ID',
            message: `The provided projectId "${rawProjectId}" is not a valid 24-character identifier.`,
          },
        });
        return;
      }

      const project = await Project.findOne({
        _id: new mongoose.Types.ObjectId(rawProjectId),
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
      return next();
    }

    // 3. If no projectId or 'default' was specified, resolve user's isolated default project
    const defaultProject = await getOrCreateDefaultProject(user._id);
    req.project = defaultProject;
    req.projectId = defaultProject._id;
    return next();
  } catch (err: any) {
    next(err);
  }
}

/**
 * Strict variant requiring an explicit projectId in headers, params, query, or body.
 */
export function requireExplicitProject(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const rawProjectId =
    req.headers['x-project-id'] ||
    req.params.projectId ||
    req.query.projectId ||
    req.body?.projectId;

  if (!rawProjectId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PROJECT_ID_REQUIRED',
        message: 'A specific projectId must be supplied in headers (x-project-id), route params, query, or body.',
      },
    });
    return;
  }

  validateProjectOwnership(req, res, next);
}
