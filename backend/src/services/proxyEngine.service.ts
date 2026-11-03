import { providerRegistry } from '../providers/registry.js';
import type { ProviderCategory, ProviderConfig } from '../providers/types.js';
import { RoutingRule } from '../models/RoutingRule.js';
import { VaultSecret } from '../models/VaultSecret.js';
import { GatewayLog } from '../models/GatewayLog.js';
import { decryptSecret } from '../utils/vaultCrypto.js';
import type { IProject } from '../models/Project.js';

export interface ProxyExecutionResult<T = any> {
  data: T;
  meta: {
    category: ProviderCategory;
    primaryProvider: string;
    finalProvider: string;
    fallbackTriggered: boolean;
    fallbackReason?: string;
    latencyMs: number;
  };
}

export class ProxyEngineService {
  /**
   * Executes a unified proxy request with automatic failover.
   */
  public async execute<TReq = any, TRes = any>({
    project,
    category,
    endpoint,
    params,
    preferredProvider,
    ipAddress,
    userAgent,
  }: {
    project: IProject;
    category: ProviderCategory;
    endpoint: string;
    params: TReq;
    preferredProvider?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ProxyExecutionResult<TRes>> {
    const startTime = Date.now();

    // 1. Resolve Routing Rule (configured primary and fallback providers)
    let rule = await RoutingRule.findOne({ projectId: project._id, category });
    const defaults = providerRegistry.getDefaultRouting(category);

    let primaryId = rule?.primaryProviderId || defaults.primary;
    let fallbackId = rule?.fallbackProviderId || defaults.fallback;

    // Caller can explicitly target a specific provider (e.g. from interactive playground or headers)
    if (preferredProvider && providerRegistry.has(category, preferredProvider)) {
      if (preferredProvider !== primaryId) {
        if (preferredProvider === fallbackId) {
          fallbackId = primaryId;
          primaryId = preferredProvider;
        } else {
          // preferredProvider is a third provider (e.g. openrouter).
          // Keep the existing fallback (or primary) as the failover target.
          primaryId = preferredProvider;
        }
      }
    }

    const defaultTimeout = category === 'ai' ? 25000 : 8000;
    const timeoutMs = rule?.timeoutMs && rule.timeoutMs > 0 ? rule.timeoutMs : defaultTimeout;
    const retryStatuses = rule?.retryOnStatusCodes || [400, 401, 402, 403, 404, 410, 429, 500, 502, 503, 504];

    // 2. Fetch provider adapters
    const primaryAdapter = providerRegistry.get(category, primaryId);
    if (!primaryAdapter) {
      throw new Error(`Primary provider "${primaryId}" not found for category "${category}".`);
    }

    const fallbackAdapter = providerRegistry.get(category, fallbackId);

    // 3. Resolve provider credentials from vault
    const primaryConfig = await this.resolveProviderConfig(project, category, primaryId, timeoutMs);
    const fallbackConfig = fallbackAdapter
      ? await this.resolveProviderConfig(project, category, fallbackId, timeoutMs)
      : { timeoutMs };

    // 4. Smart Direct Fallback:
    // If primary provider requires an API key that is not configured, but fallback IS configured (or public),
    // directly execute the configured fallback provider and return live content immediately!
    const isPrimaryMissingKey = primaryAdapter.isKeyRequired && !primaryConfig.apiKey;
    const isFallbackConfigured = fallbackAdapter && (!fallbackAdapter.isKeyRequired || Boolean(fallbackConfig.apiKey));

    if (isPrimaryMissingKey && isFallbackConfigured && fallbackAdapter) {
      console.log(
        `[ProxyEngine] ⚡ Primary "${primaryId}" has no key configured, but fallback "${fallbackId}" is ready. Directly calling fallback "${fallbackAdapter.displayName}"...`
      );

      const fallbackData = await fallbackAdapter.execute(params, fallbackConfig);
      const totalLatencyMs = Date.now() - startTime;

      await this.logTelemetry({
        projectId: project._id,
        category,
        endpoint,
        primaryProvider: primaryId,
        finalProvider: fallbackId,
        fallbackTriggered: true,
        fallbackReason: 'PRIMARY_KEY_NOT_CONFIGURED',
        latencyMs: totalLatencyMs,
        statusCode: 200,
        ipAddress,
        userAgent,
      });

      return {
        data: fallbackData,
        meta: {
          category,
          primaryProvider: primaryId,
          finalProvider: fallbackId,
          fallbackTriggered: true,
          fallbackReason: 'PRIMARY_KEY_NOT_CONFIGURED',
          latencyMs: totalLatencyMs,
        },
      };
    }

    // 5. Attempt Primary Execution
    try {
      const data = await primaryAdapter.execute(params, primaryConfig);
      const latencyMs = Date.now() - startTime;

      // Log successful telemetry
      await this.logTelemetry({
        projectId: project._id,
        category,
        endpoint,
        primaryProvider: primaryId,
        finalProvider: primaryId,
        fallbackTriggered: false,
        latencyMs,
        statusCode: 200,
        ipAddress,
        userAgent,
      });

      return {
        data,
        meta: {
          category,
          primaryProvider: primaryId,
          finalProvider: primaryId,
          fallbackTriggered: false,
          latencyMs,
        },
      };
    } catch (primaryError: any) {
      const primaryStatus = primaryError.statusCode || 500;
      const shouldRetry = retryStatuses.includes(primaryStatus) || primaryStatus >= 400 || primaryError.name === 'AbortError' || primaryError.message?.includes('timeout');

      console.warn(`[ProxyEngine] Primary provider "${primaryId}" failed (${primaryError.message}). Should failover: ${shouldRetry}`);

      if (!shouldRetry) {
        throw primaryError;
      }

      // 6. Automatic Failover to Fallback Provider
      const fallbackReason = primaryError.name === 'AbortError' ? 'TIMEOUT_EXCEEDED' : `UPSTREAM_${primaryStatus}`;

      if (!fallbackAdapter) {
        console.error(`[ProxyEngine] Fallback provider "${fallbackId}" not found. Cannot failover.`);
        throw primaryError;
      }

      console.log(`[ProxyEngine] 🔄 Automatically failing over to "${fallbackAdapter.displayName}" (${fallbackId})...`);

      try {
        const fallbackData = await fallbackAdapter.execute(params, fallbackConfig);
        const totalLatencyMs = Date.now() - startTime;

        // Log failover telemetry
        await this.logTelemetry({
          projectId: project._id,
          category,
          endpoint,
          primaryProvider: primaryId,
          finalProvider: fallbackId,
          fallbackTriggered: true,
          fallbackReason,
          latencyMs: totalLatencyMs,
          statusCode: 200,
          ipAddress,
          userAgent,
        });

        return {
          data: fallbackData,
          meta: {
            category,
            primaryProvider: primaryId,
            finalProvider: fallbackId,
            fallbackTriggered: true,
            fallbackReason,
            latencyMs: totalLatencyMs,
          },
        };
      } catch (fallbackError: any) {
        const totalLatencyMs = Date.now() - startTime;
        console.error(`[ProxyEngine] Both primary and fallback providers failed for ${category}.`);

        await this.logTelemetry({
          projectId: project._id,
          category,
          endpoint,
          primaryProvider: primaryId,
          finalProvider: fallbackId,
          fallbackTriggered: true,
          fallbackReason: `FALLBACK_FAILED_${fallbackError.statusCode || 500}`,
          latencyMs: totalLatencyMs,
          statusCode: fallbackError.statusCode || 500,
          ipAddress,
          userAgent,
        });

        throw fallbackError;
      }
    }
  }

  /**
   * Resolves decrypted provider credentials from VaultSecret.
   */
  private async resolveProviderConfig(
    project: IProject,
    category: ProviderCategory,
    providerId: string,
    timeoutMs: number
  ): Promise<ProviderConfig> {
    const secret = await VaultSecret.findOne({
      projectId: project._id,
      category,
      providerId,
    }).select('+encryptedCombined');

    let apiKey: string | undefined;
    if (secret?.encryptedCombined) {
      try {
        apiKey = decryptSecret(secret.encryptedCombined);
      } catch (err: any) {
        console.error(`[ProxyEngine] Failed to decrypt vault secret for ${providerId}:`, err.message);
      }
    }

    return {
      apiKey,
      metadata: secret?.metadata,
      timeoutMs,
    };
  }

  /**
   * Records telemetry in GatewayLog.
   */
  private async logTelemetry(logData: any): Promise<void> {
    try {
      await GatewayLog.create(logData);
    } catch (err: any) {
      console.error('[ProxyEngine] Telemetry log failed:', err.message);
    }
  }
}

export const proxyEngine = new ProxyEngineService();
