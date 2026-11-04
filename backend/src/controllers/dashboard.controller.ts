import type { Response, NextFunction } from 'express';
import { GatewayLog } from '../models/GatewayLog.js';
import { VaultSecret } from '../models/VaultSecret.js';
import { ApiKey } from '../models/ApiKey.js';
import { providerRegistry } from '../providers/registry.js';
import type { ProjectAuthenticatedRequest } from '../middleware/projectOwnership.middleware.js';

/**
 * GET /api/v1/dashboard/overview
 * Returns unified analytics, KPI metrics, and live telemetry for the authenticated developer,
 * strictly scoped to the active project (req.projectId).
 */
export async function getDashboardOverview(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const targetProjectId = req.projectId;
    const isDefault = req.project?.isDefault;

    // Filters scoped strictly to user and project (with default project fallback for legacy data)
    const logFilter: Record<string, any> = { userId: user._id };
    const vaultFilter: Record<string, any> = { userId: user._id };
    const keyFilter: Record<string, any> = { userId: user._id, isActive: true };

    if (targetProjectId) {
      if (isDefault) {
        logFilter.$or = [{ projectId: targetProjectId }, { projectId: { $exists: false } }, { projectId: null }];
        vaultFilter.$or = [{ projectId: targetProjectId }, { projectId: { $exists: false } }, { projectId: null }];
        keyFilter.$or = [{ projectId: targetProjectId }, { projectId: { $exists: false } }, { projectId: null }];
      } else {
        logFilter.projectId = targetProjectId;
        vaultFilter.projectId = targetProjectId;
        keyFilter.projectId = targetProjectId;
      }
    }

    const [totalRequests, totalFallbacks, vaultCount, activeDbKeysCount, recentLogs, latencyAgg] = await Promise.all([
      GatewayLog.countDocuments(logFilter),
      GatewayLog.countDocuments({ ...logFilter, fallbackTriggered: true }),
      VaultSecret.countDocuments(vaultFilter),
      ApiKey.countDocuments(keyFilter),
      GatewayLog.find(logFilter).sort({ createdAt: -1 }).limit(50),
      GatewayLog.aggregate([
        { $match: logFilter },
        { $group: { _id: null, avgLatency: { $avg: '$latencyMs' } } },
      ]),
    ]);

    let activeKeysCount = activeDbKeysCount;
    // For non-default projects (e.g. newly created projects), keys must be strictly 0 if activeDbKeysCount is 0.
    // Legacy fallback is only evaluated on the default project when the developer has never had any keys in the dedicated ApiKey collection.
    if (activeDbKeysCount === 0 && isDefault) {
      const hasAnyDedicatedKeys = await ApiKey.exists({ userId: user._id });
      if (!hasAnyDedicatedKeys) {
        activeKeysCount = (user.apiKeys || []).filter((k) => k.isActive).length;
      }
    }
    const fallbackRate = totalRequests > 0 ? ((totalFallbacks / totalRequests) * 100).toFixed(1) + '%' : '0.0%';
    const averageLatencyMs = latencyAgg[0]?.avgLatency ? Math.round(latencyAgg[0].avgLatency) : 0;

    res.status(200).json({
      success: true,
      data: {
        developer: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        project: req.project
          ? {
              id: req.project._id,
              name: req.project.name,
              slug: req.project.slug,
              description: req.project.description,
              isDefault: req.project.isDefault,
            }
          : null,
        totalRequests,
        totalFallbacks,
        fallbackRatePercentage: fallbackRate,
        averageLatencyMs,
        activeKeysCount,
        configuredVaultCount: vaultCount,
        totalAvailableProviders: providerRegistry.list().length,
        metrics: {
          totalRequests,
          totalFallbacks,
          fallbackRatePercentage: fallbackRate,
          averageLatencyMs,
          activeKeysCount,
          configuredVaultCount: vaultCount,
          totalAvailableProviders: providerRegistry.list().length,
        },
        recentLogs,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * GET /api/v1/dashboard/logs
 * Provides paginated and filtered gateway telemetry logs by project, category, status, and provider.
 */
export async function getDashboardLogs(
  req: ProjectAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const targetProjectId = req.projectId;
    const isDefault = req.project?.isDefault;
    const { category, provider, status, limit = 50, page = 1 } = req.query;

    const filter: Record<string, any> = { userId: user._id };
    if (targetProjectId) {
      if (isDefault) {
        filter.$or = [{ projectId: targetProjectId }, { projectId: { $exists: false } }, { projectId: null }];
      } else {
        filter.projectId = targetProjectId;
      }
    }

    if (category && typeof category === 'string' && category !== 'all') {
      filter.category = category;
    }
    if (provider && typeof provider === 'string' && provider !== 'all') {
      filter.finalProvider = provider;
    }
    if (status === 'fallback') {
      filter.fallbackTriggered = true;
    } else if (status === 'error') {
      filter.statusCode = { $gte: 400 };
    } else if (status === 'success') {
      filter.statusCode = { $lt: 400 };
    }

    const parsedLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 200);
    const parsedPage = Math.max(parseInt(String(page), 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, logs] = await Promise.all([
      GatewayLog.countDocuments(filter),
      GatewayLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
    ]);

    res.status(200).json({
      success: true,
      data: {
        projectId: targetProjectId,
        logs,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit),
        },
      },
    });
  } catch (err: any) {
    next(err);
  }
}
