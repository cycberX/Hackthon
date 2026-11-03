import type { IProviderAdapter, UnifiedNewsRequest, UnifiedNewsResponse, ProviderConfig } from '../types.js';

export class SpaceflightNewsAdapter implements IProviderAdapter<UnifiedNewsRequest, UnifiedNewsResponse> {
  public readonly id = 'spaceflight';
  public readonly category = 'news' as const;
  public readonly displayName = 'Spaceflight News API (Fallback)';
  public readonly isKeyRequired = false;

  public async execute(params: UnifiedNewsRequest, config: ProviderConfig): Promise<UnifiedNewsResponse> {
    const limit = params.limit || 10;
    const search = params.query ? encodeURIComponent(params.query) : '';
    const url = `https://api.spaceflightnewsapi.net/v4/articles/?limit=${limit}${search ? `&search=${search}` : ''}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 5000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        const err = new Error(`Spaceflight News API error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = await response.json() as any;
      const results = data.results || [];

      const articles = results.map((r: any) => ({
        id: String(r.id),
        title: r.title || 'Untitled',
        description: r.summary || '',
        url: r.url,
        source: r.news_site || 'Spaceflight News',
        publishedAt: r.published_at || new Date().toISOString(),
        imageUrl: r.image_url,
      }));

      return {
        articles,
        provider: this.id,
        total: data.count || articles.length,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
