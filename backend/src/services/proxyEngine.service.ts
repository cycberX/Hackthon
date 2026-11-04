import { providerRegistry } from '../providers/registry.js';
import type { ProviderCategory, ProviderConfig } from '../providers/types.js';
import { RoutingRule } from '../models/RoutingRule.js';
import { VaultSecret } from '../models/VaultSecret.js';
import { GatewayLog } from '../models/GatewayLog.js';
import { decryptSecret } from '../utils/vaultCrypto.js';
import type { IUser } from '../models/User.js';

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
   * Executes a unified proxy request with automatic failover directly for the developer/user.
   */
  public async execute<TReq = any, TRes = any>({
    user,
    category,
    endpoint,
    params,
    preferredProvider,
    ipAddress,
    userAgent,
    projectId,
  }: {
    user: IUser;
    category: ProviderCategory;
    endpoint: string;
    params: TReq;
    preferredProvider?: string;
    ipAddress?: string;
    userAgent?: string;
    projectId?: any;
  }): Promise<ProxyExecutionResult<TRes>> {
    const startTime = Date.now();

    // 1. Resolve Routing Rule (configured primary and fallback providers for this developer and project)
    let rule = null;
    if (projectId) {
      rule = await RoutingRule.findOne({ projectId, category });
    }
    if (!rule) {
      rule = await RoutingRule.findOne({ userId: user._id, category });
    }
    const defaults = providerRegistry.getDefaultRouting(category);

    let primaryId = rule?.primaryProviderId || defaults.primary;
    let fallbackId = rule?.fallbackProviderId || defaults.fallback;

    // Resolve multi-level fallback cascade chain
    let fallbackChain: string[] = [];
    if (rule?.fallbackProviderIds && rule.fallbackProviderIds.length > 0) {
      fallbackChain = rule.fallbackProviderIds.filter(
        (id) => id && id !== 'none' && id !== 'disabled' && id !== primaryId
      );
    } else if (fallbackId && fallbackId !== 'none' && fallbackId !== 'disabled') {
      fallbackChain = [fallbackId];
    }

    // Caller can explicitly target a specific provider (e.g. from interactive playground or headers)
    if (preferredProvider && providerRegistry.has(category, preferredProvider)) {
      if (preferredProvider !== primaryId) {
        fallbackChain = [primaryId, ...fallbackChain.filter((id) => id !== preferredProvider)];
        primaryId = preferredProvider;
      }
    }

    // Deduplicate fallback chain
    fallbackChain = Array.from(new Set(fallbackChain));

    const defaultTimeout = category === 'ai' ? 25000 : 8000;
    const timeoutMs = rule?.timeoutMs && rule.timeoutMs > 0 ? rule.timeoutMs : defaultTimeout;
    const retryStatuses = rule?.retryOnStatusCodes || [400, 401, 402, 403, 404, 410, 429, 500, 502, 503, 504];

    // 2. Fetch primary adapter & credentials
    const primaryAdapter = providerRegistry.get(category, primaryId);
    if (!primaryAdapter) {
      throw new Error(`Primary provider "${primaryId}" not found for category "${category}".`);
    }

    const primaryConfig = await this.resolveProviderConfig(user, category, primaryId, timeoutMs, projectId);

    // 3. Smart Direct Fallback Cascade:
    // If primary provider requires an API key that is not configured, find the first available fallback that is ready
    const isPrimaryMissingKey = primaryAdapter.isKeyRequired && !primaryConfig.apiKey;

    if (isPrimaryMissingKey && fallbackChain.length > 0) {
      for (const fbId of fallbackChain) {
        const fbAdapter = providerRegistry.get(category, fbId);
        if (!fbAdapter) continue;

        const fbConfig = await this.resolveProviderConfig(user, category, fbId, timeoutMs, projectId);
        const isReady = !fbAdapter.isKeyRequired || Boolean(fbConfig.apiKey);

        if (isReady) {
          console.log(
            `[ProxyEngine] ⚡ Primary "${primaryId}" has no key configured, but fallback "${fbId}" is ready. Calling "${fbAdapter.displayName}"...`
          );

          const fbParams = this.resolveModelForProvider(category, fbId, params, fbConfig, rule, fbAdapter);
          const fallbackData = await fbAdapter.execute(fbParams, fbConfig);
          const totalLatencyMs = Date.now() - startTime;

          await this.logTelemetry({
            userId: user._id,
            projectId,
            category,
            endpoint,
            primaryProvider: primaryId,
            finalProvider: fbId,
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
              finalProvider: fbId,
              fallbackTriggered: true,
              fallbackReason: 'PRIMARY_KEY_NOT_CONFIGURED',
              latencyMs: totalLatencyMs,
            },
          };
        }
      }
    }

    // 4. Attempt Primary Execution
    try {
      const primaryParams = this.resolveModelForProvider(category, primaryId, params, primaryConfig, rule, primaryAdapter);
      const data = await primaryAdapter.execute(primaryParams, primaryConfig);
      const latencyMs = Date.now() - startTime;

      // Log successful telemetry
      await this.logTelemetry({
        userId: user._id,
        projectId,
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
      const shouldRetry =
        retryStatuses.includes(primaryStatus) ||
        primaryStatus >= 400 ||
        primaryError.name === 'AbortError' ||
        primaryError.message?.includes('timeout');

      console.warn(
        `[ProxyEngine] Primary provider "${primaryId}" failed (${primaryError.message}). Should failover: ${shouldRetry}`
      );

      if (!shouldRetry) {
        throw primaryError;
      }

      if (fallbackChain.length === 0) {
        console.log(`[ProxyEngine] Fallback cascade is empty. Returning direct primary error.`);
        throw primaryError;
      }

      const primaryFailReason = primaryError.name === 'AbortError' ? 'TIMEOUT_EXCEEDED' : `UPSTREAM_${primaryStatus}`;
      let lastFallbackError: any = null;

      // 5. Automatic Failover across Multi-Level Fallback Cascade Chain
      for (let i = 0; i < fallbackChain.length; i++) {
        const candidateId = fallbackChain[i];
        const candidateAdapter = providerRegistry.get(category, candidateId);
        if (!candidateAdapter) continue;

        const candidateConfig = await this.resolveProviderConfig(user, category, candidateId, timeoutMs, projectId);
        if (candidateAdapter.isKeyRequired && !candidateConfig.apiKey) {
          console.log(`[ProxyEngine] Skipping fallback "${candidateId}" (requires key that is not in vault).`);
          continue;
        }

        console.log(
          `[ProxyEngine] 🔄 Failover cascade [${i + 1}/${fallbackChain.length}]: Calling "${candidateAdapter.displayName}" (${candidateId})...`
        );

        try {
          const candidateParams = this.resolveModelForProvider(category, candidateId, params, candidateConfig, rule, candidateAdapter);
          const fallbackData = await candidateAdapter.execute(candidateParams, candidateConfig);
          const totalLatencyMs = Date.now() - startTime;

          await this.logTelemetry({
            userId: user._id,
            projectId,
            category,
            endpoint,
            primaryProvider: primaryId,
            finalProvider: candidateId,
            fallbackTriggered: true,
            fallbackReason: primaryFailReason,
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
              finalProvider: candidateId,
              fallbackTriggered: true,
              fallbackReason: primaryFailReason,
              latencyMs: totalLatencyMs,
            },
          };
        } catch (candidateError: any) {
          console.warn(
            `[ProxyEngine] Fallback "${candidateId}" failed (${candidateError.message}). Proceeding down the cascade...`
          );
          lastFallbackError = candidateError;
        }
      }

      // If all fallbacks in the cascade failed:
      const totalLatencyMs = Date.now() - startTime;
      console.error(`[ProxyEngine] All providers in cascade failed for ${category}.`);

      await this.logTelemetry({
        userId: user._id,
        projectId,
        category,
        endpoint,
        primaryProvider: primaryId,
        finalProvider: fallbackChain[fallbackChain.length - 1] || primaryId,
        fallbackTriggered: true,
        fallbackReason: `CASCADE_EXHAUSTED_${lastFallbackError?.statusCode || 500}`,
        latencyMs: totalLatencyMs,
        statusCode: lastFallbackError?.statusCode || 500,
        ipAddress,
        userAgent,
      });

      throw lastFallbackError || primaryError;
    }
  }

  /**
   * Resolves decrypted provider credentials from developer's VaultSecret.
   */
  private async resolveProviderConfig(
    user: IUser,
    category: ProviderCategory,
    providerId: string,
    timeoutMs: number,
    projectId?: any
  ): Promise<ProviderConfig> {
    let secret = null;
    if (projectId) {
      secret = await VaultSecret.findOne({
        projectId,
        category,
        providerId,
      }).select('+encryptedCombined');
    }

    if (!secret) {
      secret = await VaultSecret.findOne({
        userId: user._id,
        category,
        providerId,
      }).select('+encryptedCombined');
    }

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
   * Resolves the effective model parameter for AI providers.
   */
  private resolveModelForProvider(
    category: ProviderCategory,
    providerId: string,
    params: any,
    config: ProviderConfig,
    rule: any,
    adapter: any
  ): any {
    if (category !== 'ai') return params;
    const requestedModel = params?.model;
    if (requestedModel && requestedModel !== 'default' && requestedModel !== 'auto') {
      return params;
    }
    const resolvedModel =
      rule?.models?.[providerId] ||
      config.metadata?.model ||
      adapter?.defaultModel ||
      'default';
    return { ...params, model: resolvedModel };
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
