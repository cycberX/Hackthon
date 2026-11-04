import type { Response, NextFunction } from 'express';
import { RoutingRule } from '../models/RoutingRule.js';
import { providerRegistry } from '../providers/registry.js';
import type { ProviderCategory } from '../models/VaultSecret.js';
import type { ProjectAuthenticatedRequest } from '../middleware/projectOwnership.middleware.js';

const CATEGORIES: ProviderCategory[] = ['ai', 'music', 'weather', 'news', 'environment'];

/**
 * 1. GET /api/v1/routing
 * Retrieves all priority routing rules for the developer across the 5 categories for the active project.
 */
export async function getRoutingRules(
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

    const savedRules = await RoutingRule.find(filter);

    const rules = CATEGORIES.map((cat) => {
      const existing = savedRules.find((r) => r.category === cat);
      const defaults = providerRegistry.getDefaultRouting(cat);

      const fallbackList =
        existing?.fallbackProviderIds && existing.fallbackProviderIds.length > 0
          ? existing.fallbackProviderIds
          : existing?.fallbackProviderId && existing.fallbackProviderId !== 'none'
          ? [existing.fallbackProviderId]
          : defaults.fallback !== 'none'
          ? [defaults.fallback]
          : [];

      return {
        category: cat,
        projectId: targetProjectId,
        primaryProviderId: existing?.primaryProviderId || defaults.primary,
        fallbackProviderId: existing?.fallbackProviderId ?? defaults.fallback,
        fallbackProviderIds: fallbackList,
        timeoutMs: existing?.timeoutMs || (cat === 'ai' ? 25000 : 5000),
        retryOnStatusCodes: existing?.retryOnStatusCodes || [400, 401, 402, 403, 404, 410, 429, 500, 502, 503, 504],
        model: existing?.model || '',
        models: existing?.models || {},
        isCustomized: !!existing,
        updatedAt: existing?.updatedAt || null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        projectId: targetProjectId,
        rules,
        routingRules: rules,
        count: rules.length,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 2. PUT /api/v1/routing
 * Updates or sets the primary and fallback providers for a specific category within the active project.
 * If fallbackProviderId is 'none' or empty, fallback failover is disabled (direct only).
 */
export async function updateRoutingRule(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const targetProjectId = req.projectId!;
    const { category, primaryProviderId, fallbackProviderId, fallbackProviderIds, timeoutMs, retryOnStatusCodes, model, models } = req.body;

    if (!category || !primaryProviderId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'category and primaryProviderId are required fields.',
        },
      });
      return;
    }

    if (!CATEGORIES.includes(category)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: `Category "${category}" is invalid. Must be one of: ${CATEGORIES.join(', ')}.`,
        },
      });
      return;
    }

    if (!providerRegistry.has(category, primaryProviderId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PRIMARY_PROVIDER',
          message: `Primary provider "${primaryProviderId}" is not registered under category "${category}".`,
        },
      });
      return;
    }

    // Normalized cascade of fallbacks: support multiple fallback providers in order!
    let effectiveFallbacks: string[] = [];
    if (Array.isArray(fallbackProviderIds)) {
      effectiveFallbacks = fallbackProviderIds.filter(
        (id) => typeof id === 'string' && id.trim() && id !== 'none' && id !== 'disabled' && id !== primaryProviderId
      );
    } else if (fallbackProviderId && fallbackProviderId !== 'none' && fallbackProviderId !== 'disabled') {
      effectiveFallbacks = [fallbackProviderId];
    }

    // Deduplicate while preserving priority order
    effectiveFallbacks = Array.from(new Set(effectiveFallbacks));

    for (const fbId of effectiveFallbacks) {
      if (!providerRegistry.has(category, fbId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FALLBACK_PROVIDER',
            message: `Fallback provider "${fbId}" is not registered under category "${category}".`,
          },
        });
        return;
      }
    }

    const effectiveFallback = effectiveFallbacks[0] || 'none';

    const rule = await RoutingRule.findOneAndUpdate(
      { userId: user._id, projectId: targetProjectId, category },
      {
        primaryProviderId,
        fallbackProviderId: effectiveFallback,
        fallbackProviderIds: effectiveFallbacks,
        timeoutMs: timeoutMs && timeoutMs > 0 ? timeoutMs : (category === 'ai' ? 25000 : 5000),
        ...(retryOnStatusCodes && { retryOnStatusCodes }),
        ...(model !== undefined && { model }),
        ...(models !== undefined && { models }),
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(200).json({
      success: true,
      message: `Routing for category "${category}" in project updated: Primary=${primaryProviderId}, Fallbacks=[${effectiveFallbacks.join(' -> ')}]`,
      data: {
        projectId: targetProjectId,
        rule,
        routingRule: rule,
      },
    });
  } catch (err: any) {
    next(err);
  }
}
