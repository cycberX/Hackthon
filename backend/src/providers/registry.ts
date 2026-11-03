import type { IProviderAdapter, ProviderCategory } from './types.js';

class ProviderRegistry {
  private adapters: Map<string, IProviderAdapter> = new Map();

  private makeKey(category: ProviderCategory, providerId: string): string {
    return `${category.toLowerCase()}:${providerId.toLowerCase()}`;
  }

  /**
   * Registers a provider adapter in the registry.
   * Can be called by core adapters or custom developer-defined adapters.
   */
  public register(adapter: IProviderAdapter): void {
    const key = this.makeKey(adapter.category, adapter.id);
    this.adapters.set(key, adapter);
    console.log(`[ProviderRegistry] Registered: ${adapter.category.toUpperCase()} -> "${adapter.displayName}" (${adapter.id})`);
  }

  /**
   * Retrieves an adapter by category and provider ID.
   */
  public get<TReq = any, TRes = any>(
    category: ProviderCategory,
    providerId: string
  ): IProviderAdapter<TReq, TRes> | undefined {
    return this.adapters.get(this.makeKey(category, providerId));
  }

  /**
   * Checks if an adapter exists.
   */
  public has(category: ProviderCategory, providerId: string): boolean {
    return this.adapters.has(this.makeKey(category, providerId));
  }

  /**
   * Lists all registered adapters, optionally filtered by category.
   */
  public list(category?: ProviderCategory): Array<{
    id: string;
    category: ProviderCategory;
    displayName: string;
    isKeyRequired: boolean;
  }> {
    const all = Array.from(this.adapters.values()).map((a) => ({
      id: a.id,
      category: a.category,
      displayName: a.displayName,
      isKeyRequired: a.isKeyRequired,
    }));

    if (category) {
      return all.filter((a) => a.category === category);
    }
    return all;
  }

  /**
   * Default routing defaults (2 providers per category: 1 primary, 1 fallback)
   */
  public getDefaultRouting(category: ProviderCategory): { primary: string; fallback: string } {
    const defaults: Record<ProviderCategory, { primary: string; fallback: string }> = {
      ai: { primary: 'gemini', fallback: 'groq' },
      music: { primary: 'deezer', fallback: 'itunes' },
      weather: { primary: 'openmeteo', fallback: 'weatherstack' },
      news: { primary: 'hackernews', fallback: 'spaceflight' },
      environment: { primary: 'openaq', fallback: 'openmeteo_air' },
    };
    return defaults[category];
  }
}

export const providerRegistry = new ProviderRegistry();
