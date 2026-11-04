import type { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Project, getOrCreateDefaultProject, type IProject } from '../models/Project.js';
import { ApiKey } from '../models/ApiKey.js';
import { VaultSecret } from '../models/VaultSecret.js';
import { RoutingRule } from '../models/RoutingRule.js';
import { GatewayLog } from '../models/GatewayLog.js';
import type { ProjectAuthenticatedRequest } from '../middleware/projectOwnership.middleware.js';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || 'project';
}

/**
 * 1. POST /api/v1/projects
 * Creates a new isolated project for the authenticated developer.
 */
export async function createProject(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { name, description, isDefault } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROJECT_NAME',
          message: 'Project name is required.',
        },
      });
      return;
    }

    const trimmedName = name.trim();
    let baseSlug = slugify(trimmedName);
    let finalSlug = baseSlug;

    // Ensure unique slug per user
    const existingSlug = await Project.findOne({ userId: user._id, slug: finalSlug });
    if (existingSlug) {
      finalSlug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    // If marked as default, unset previous default
    if (isDefault) {
      await Project.updateMany({ userId: user._id, isDefault: true }, { $set: { isDefault: false } });
    }

    const project = await Project.create({
      userId: user._id,
      name: trimmedName,
      slug: finalSlug,
      description: description?.trim() || `Isolated configuration scope for ${trimmedName}`,
      isDefault: Boolean(isDefault),
    });

    res.status(201).json({
      success: true,
      message: `Project "${project.name}" created successfully.`,
      data: {
        project: {
          id: project._id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          isDefault: project.isDefault,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 2. GET /api/v1/projects
 * Lists all projects belonging to the authenticated user.
 */
export async function listProjects(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;

    // Ensure user has at least one default project
    await getOrCreateDefaultProject(user._id);

    const projects = await Project.find({ userId: user._id }).sort({ isDefault: -1, createdAt: 1 });

    // Aggregate statistics per project
    const projectSummaries = await Promise.all(
      projects.map(async (p) => {
        const [keyCount, vaultCount] = await Promise.all([
          ApiKey.countDocuments({ projectId: p._id, isActive: true }),
          VaultSecret.countDocuments({ projectId: p._id }),
        ]);

        return {
          id: p._id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          isDefault: p.isDefault,
          activeKeysCount: keyCount,
          vaultSecretsCount: vaultCount,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        projects: projectSummaries,
        total: projectSummaries.length,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 3. GET /api/v1/projects/default
 * Retrieves or creates the developer's default project.
 */
export async function getDefaultProject(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const project = await getOrCreateDefaultProject(user._id);

    res.status(200).json({
      success: true,
      data: {
        project: {
          id: project._id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          isDefault: project.isDefault,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 4. GET /api/v1/projects/:projectId
 * Retrieves project details after ownership verification.
 */
export async function getProjectById(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const project = req.project!;

    const [keyCount, vaultCount, routingCount] = await Promise.all([
      ApiKey.countDocuments({ projectId: project._id, isActive: true }),
      VaultSecret.countDocuments({ projectId: project._id }),
      RoutingRule.countDocuments({ projectId: project._id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        project: {
          id: project._id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          isDefault: project.isDefault,
          activeKeysCount: keyCount,
          vaultSecretsCount: vaultCount,
          routingRulesCount: routingCount,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 5. PUT /api/v1/projects/:projectId
 * Updates project settings or sets as default.
 */
export async function updateProject(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const project = req.project!;
    const { name, description, isDefault } = req.body;

    if (name && typeof name === 'string') {
      project.name = name.trim();
    }
    if (description !== undefined && typeof description === 'string') {
      project.description = description.trim();
    }

    if (isDefault) {
      await Project.updateMany({ userId: user._id, isDefault: true }, { $set: { isDefault: false } });
      project.isDefault = true;
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: `Project "${project.name}" updated successfully.`,
      data: {
        project: {
          id: project._id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          isDefault: project.isDefault,
          updatedAt: project.updatedAt,
        },
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 6. DELETE /api/v1/projects/:projectId
 * Deletes a project and cascades cleanup of its keys and secrets.
 */
export async function deleteProject(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const project = req.project!;
    const user = req.user!;

    // Cascade deletion of all project-scoped resources
    await Promise.all([
      ApiKey.deleteMany({ projectId: project._id }),
      VaultSecret.deleteMany({ projectId: project._id }),
      RoutingRule.deleteMany({ projectId: project._id }),
      GatewayLog.deleteMany({ projectId: project._id }),
      Project.deleteOne({ _id: project._id }),
    ]);

    // If the deleted project was default, promote another project if available
    if (project.isDefault) {
      const remainingProject = await Project.findOne({ userId: user._id }).sort({ createdAt: 1 });
      if (remainingProject) {
        remainingProject.isDefault = true;
        await remainingProject.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Project "${project.name}" and all associated scoped keys, secrets, rules, and logs were permanently deleted.`,
    });
  } catch (err: any) {
    next(err);
  }
}
