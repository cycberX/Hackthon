import type { IProviderAdapter, UnifiedNewsRequest, UnifiedNewsResponse, ProviderConfig } from '../types.js';

export class SpaceflightNewsAdapter implements IProviderAdapter<UnifiedNewsRequest, UnifiedNewsResponse> {
  public readonly id = 'spaceflight';
  public readonly category = 'news' as const;
  public readonly displayName = 'Spaceflight News API (Fallback)';
  public readonly isKeyRequired = false;

  public async execute(params: UnifiedNewsRequest, config: ProviderConfig): Promise<UnifiedNewsResponse> {
    const limit = params.limit || 10;
    const query = params.query || '';
    const search = query ? encodeURIComponent(query) : '';
    const url = `https://api.spaceflightnewsapi.net/v4/articles/?limit=${limit}${search ? `&search=${search}` : ''}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 8000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        const err = new Error(`Spaceflight News API upstream error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = (await response.json()) as any;
      const results = data.results || [];

      const articles = results.map((r: any) => ({
        id: String(r.id),
        title: String(r.title || 'Untitled'),
        description: String(r.summary || ''),
        snippet: String(r.summary || ''),
        url: r.url,
        source: r.news_site || 'Spaceflight News',
        author: r.news_site || 'Spaceflight News',
        publishedAt: r.published_at || new Date().toISOString(),
        imageUrl: r.image_url,
        provider: this.id,
      }));

      return {
        query,
        total: Number(data.count || articles.length),
        articles,
        provider: this.id,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
