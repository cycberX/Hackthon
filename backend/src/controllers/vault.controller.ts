import type { Response, NextFunction } from 'express';
import { VaultSecret, type ProviderCategory } from '../models/VaultSecret.js';
import { encryptSecret, maskApiKey } from '../utils/vaultCrypto.js';
import { providerRegistry } from '../providers/registry.js';
import type { ProjectAuthenticatedRequest } from '../middleware/projectOwnership.middleware.js';

/**
 * 1. GET /api/v1/vault
 * Retrieves all encrypted API keys stored in vault by the authenticated developer for the active project.
 */
export async function getVaultSecrets(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const targetProjectId = req.projectId;
    const isDefault = req.project?.isDefault;

    const filter: Record<string, any> = { userId: user._id };
    if (targetProjectId) {
      if (isDefault) {
        filter.$or = [{ projectId: targetProjectId }, { projectId: { $exists: false } }, { projectId: null }];
      } else {
        filter.projectId = targetProjectId;
      }
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const secrets = await VaultSecret.find(filter).select(
      'category providerId keyPreview metadata updatedAt projectId'
    );

    res.status(200).json({
      success: true,
      data: {
        projectId: targetProjectId,
        secrets,
        vaultSecrets: secrets,
        count: secrets.length,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 2. POST /api/v1/vault
 * Encrypts and securely stores or updates a provider API key in the developer's project-scoped vault.
 */
export async function saveVaultSecret(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const targetProjectId = req.projectId!;
    const { category, providerId, apiKey, metadata, model } = req.body;

    if (!category || !providerId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'category and providerId are required fields.',
        },
      });
      return;
    }

    if (!providerRegistry.has(category as ProviderCategory, providerId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROVIDER',
          message: `Provider "${providerId}" is not registered under category "${category}".`,
        },
      });
      return;
    }

    const existingSecret = await VaultSecret.findOne({
      userId: user._id,
      projectId: targetProjectId,
      category,
      providerId,
    }).select('+encryptedCombined');

    const effectiveMetadata = {
      ...(existingSecret?.metadata || {}),
      ...(metadata || {}),
      ...(model ? { model } : {}),
    };

    // If apiKey is omitted but secret exists and model was supplied, update metadata only
    if (!apiKey && existingSecret) {
      existingSecret.metadata = effectiveMetadata;
      await existingSecret.save();
      res.status(200).json({
        success: true,
        message: `Configuration and model updated for ${providerId} (${category}).`,
        data: {
          id: existingSecret._id,
          projectId: existingSecret.projectId,
          category: existingSecret.category,
          providerId: existingSecret.providerId,
          keyPreview: existingSecret.keyPreview,
          metadata: existingSecret.metadata,
        },
      });
      return;
    }

    if (!apiKey) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'apiKey is required to configure a new vault credential.',
        },
      });
      return;
    }

    const trimmedKey = String(apiKey).trim();
    if (trimmedKey.length < 4) {
      res.status(400).json({
        success: false,
        error: {
          code: 'KEY_TOO_SHORT',
          message: 'API Key must be at least 4 characters long.',
        },
      });
      return;
    }

    const encryption = encryptSecret(trimmedKey);
    const encryptedCombined = encryption.combined;
    const keyPreview = maskApiKey(trimmedKey);

    const secret = await VaultSecret.findOneAndUpdate(
      { userId: user._id, projectId: targetProjectId, category, providerId },
      {
        encryptedCombined,
        keyPreview,
        metadata: effectiveMetadata,
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: `Vault secret for ${providerId} (${category}) safely encrypted and stored in project.`,
      data: {
        id: secret._id,
        projectId: secret.projectId,
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
 * 3. DELETE /api/v1/vault/:providerId
 * Deletes a provider credential from developer's project-scoped vault.
 */
export async function deleteVaultSecret(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const targetProjectId = req.projectId;
    const isDefault = req.project?.isDefault;
    const { providerId } = req.params;
    const category = req.query.category as string | undefined;

    const query: any = { userId: user._id, providerId };
    if (targetProjectId) {
      if (isDefault) {
        query.$or = [{ projectId: targetProjectId }, { projectId: { $exists: false } }, { projectId: null }];
      } else {
        query.projectId = targetProjectId;
      }
    }
    if (category) {
      query.category = category;
    }

    const result = await VaultSecret.findOneAndDelete(query);
    if (!result) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SECRET_NOT_FOUND',
          message: `Vault secret for provider "${providerId}" was not found in this project.`,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Vault credential for ${providerId} was successfully deleted.`,
    });
  } catch (err: any) {
    next(err);
  }
}
