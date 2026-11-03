import type { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Project } from '../models/Project.js';
import { VaultSecret, type ProviderCategory } from '../models/VaultSecret.js';
import { RoutingRule } from '../models/RoutingRule.js';
import { GatewayLog } from '../models/GatewayLog.js';
import { hashToken } from '../utils/crypto.js';
import { encryptSecret, maskApiKey } from '../utils/vaultCrypto.js';
import { providerRegistry } from '../providers/registry.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

function getProjectQuery(projectId: string | string[], ownerId: any) {
  const idStr = Array.isArray(projectId) ? projectId[0] : projectId;
  const isMongoId = typeof idStr === 'string' && mongoose.Types.ObjectId.isValid(idStr);
  return {
    $or: isMongoId ? [{ projectId: idStr }, { _id: idStr }] : [{ projectId: idStr }],
    ownerId,
  };
}

/**
 * 1. Create a New OneAPI Project
 * POST /api/v1/projects
 */
export async function createProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body;
    const user = req.user!;

    // Generate unique project token: oneapi_dev_<random 24 bytes hex>
    const randomHex = crypto.randomBytes(24).toString('hex');
    const rawProjectToken = `oneapi_dev_${randomHex}`;
    const projectTokenHash = hashToken(rawProjectToken);
    const projectTokenPrefix = `oneapi_dev_${randomHex.slice(0, 8)}...${randomHex.slice(-4)}`;

    const project = await Project.create({
      name: name || 'Default Project',
      ownerId: user._id,
      projectTokenHash,
      projectTokenPrefix,
      isActive: true,
    });

    // Create default routing rules for all 5 categories
    const categories: ProviderCategory[] = ['ai', 'music', 'weather', 'news', 'environment'];
    for (const cat of categories) {
      const defaults = providerRegistry.getDefaultRouting(cat);
      await RoutingRule.create({
        projectId: project._id,
        category: cat,
        primaryProviderId: defaults.primary,
        fallbackProviderId: defaults.fallback,
        timeoutMs: 5000,
        retryOnStatusCodes: [429, 500, 502, 503, 504],
      });
    }

    res.status(201).json({
      success: true,
      message: 'OneAPI Project successfully created. Copy your project token now; it will not be displayed again!',
      data: {
        project: {
          _id: project._id,
          projectId: project.projectId,
          name: project.name,
          projectTokenPrefix: project.projectTokenPrefix,
          createdAt: project.createdAt,
        },
        projectToken: rawProjectToken,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 2. List Projects for Current Developer
 * GET /api/v1/projects
 */
export async function listProjects(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const projects = await Project.find({ ownerId: user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        projects,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 3. Get Project Details by Project ID (or slug)
 * GET /api/v1/projects/:projectId
 */
export async function getProjectById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const user = req.user!;

    const project = await Project.findOne(getProjectQuery(projectId, user._id));

    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' },
      });
      return;
    }

    const rules = await RoutingRule.find({ projectId: project._id });
    const secrets = await VaultSecret.find({ projectId: project._id }).select('category providerId keyPreview updatedAt');

    res.status(200).json({
      success: true,
      data: {
        project,
        routingRules: rules,
        vaultSecrets: secrets,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 4. Save/Update Provider Key in Secure Encrypted Vault
 * POST /api/v1/projects/:projectId/vault
 */
export async function saveVaultSecret(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const { category, providerId, apiKey, metadata } = req.body;
    const user = req.user!;

    const project = await Project.findOne(getProjectQuery(projectId, user._id));

    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' },
      });
      return;
    }

    // Encrypt the raw third-party API key with AES-256-GCM
    const encrypted = encryptSecret(apiKey);
    const keyPreview = maskApiKey(apiKey);

    const secret = await VaultSecret.findOneAndUpdate(
      { projectId: project._id, category, providerId },
      {
        encryptedCombined: encrypted.combined,
        keyPreview,
        metadata: metadata || {},
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Vault secret for ${providerId} (${category}) safely encrypted and stored.`,
      data: {
        category: secret.category,
        providerId: secret.providerId,
        keyPreview: secret.keyPreview,
        updatedAt: secret.updatedAt,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 5. List Vault Secrets for a Project (Previews Only)
 * GET /api/v1/projects/:projectId/vault
 */
export async function listVaultSecrets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const user = req.user!;

    const project = await Project.findOne(getProjectQuery(projectId, user._id));

    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' },
      });
      return;
    }

    const secrets = await VaultSecret.find({ projectId: project._id }).select('category providerId keyPreview metadata updatedAt');

    res.status(200).json({
      success: true,
      data: {
        secrets,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 6. Delete a Vault Secret
 * DELETE /api/v1/projects/:projectId/vault/:secretId
 */
export async function deleteVaultSecret(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId, secretId } = req.params;
    const user = req.user!;

    const project = await Project.findOne(getProjectQuery(projectId, user._id));

    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' },
      });
      return;
    }

    const secretIdStr = Array.isArray(secretId) ? secretId[0] : secretId;
    if (!secretIdStr || !mongoose.Types.ObjectId.isValid(secretIdStr)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_SECRET_ID', message: 'Invalid secret identifier.' },
      });
      return;
    }

    await VaultSecret.findOneAndDelete({ _id: secretIdStr, projectId: project._id });

    res.status(200).json({
      success: true,
      message: 'Vault secret successfully deleted.',
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 7. Update Category Routing Rules (Set Primary & Fallback Providers)
 * PUT /api/v1/projects/:projectId/routing
 */
export async function updateRoutingRule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const { category, primaryProviderId, fallbackProviderId, timeoutMs } = req.body;
    const user = req.user!;

    const project = await Project.findOne(getProjectQuery(projectId, user._id));

    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' },
      });
      return;
    }

    const rule = await RoutingRule.findOneAndUpdate(
      { projectId: project._id, category },
      {
        primaryProviderId,
        fallbackProviderId,
        ...(timeoutMs && { timeoutMs }),
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Routing rule for ${category} successfully updated.`,
      data: {
        rule,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 8. Project Analytics & Gateway Telemetry
 * GET /api/v1/projects/:projectId/analytics
 */
export async function getProjectAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const user = req.user!;

    const project = await Project.findOne(getProjectQuery(projectId, user._id));

    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' },
      });
      return;
    }

    const totalRequests = await GatewayLog.countDocuments({ projectId: project._id });
    const totalFallbacks = await GatewayLog.countDocuments({ projectId: project._id, fallbackTriggered: true });
    const recentLogs = await GatewayLog.find({ projectId: project._id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate fallback rate
    const fallbackRatePct = totalRequests > 0 ? ((totalFallbacks / totalRequests) * 100).toFixed(2) : '0.00';

    res.status(200).json({
      success: true,
      data: {
        totalRequests,
        totalFallbacks,
        fallbackRatePercentage: `${fallbackRatePct}%`,
        recentLogs,
      },
    });
  } catch (err: any) {
    next(err);
  }
}
