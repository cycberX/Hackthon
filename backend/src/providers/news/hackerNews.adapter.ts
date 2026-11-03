import type { IProviderAdapter, UnifiedNewsRequest, UnifiedNewsResponse, ProviderConfig } from '../types.js';

export class HackerNewsAdapter implements IProviderAdapter<UnifiedNewsRequest, UnifiedNewsResponse> {
  public readonly id = 'hackernews';
  public readonly category = 'news' as const;
  public readonly displayName = 'HackerNews Algolia API (Public)';
  public readonly isKeyRequired = false;

  public async execute(params: UnifiedNewsRequest, config: ProviderConfig): Promise<UnifiedNewsResponse> {
    const limit = params.limit || 10;
    const query = encodeURIComponent(params.query || 'technology');
    const url = `https://hn.algolia.com/api/v1/search?query=${query}&tags=story&hitsPerPage=${limit}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 5000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        const err = new Error(`HackerNews API error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = await response.json() as any;
      const hits = data.hits || [];

      const articles = hits.map((h: any) => ({
        id: String(h.objectID),
        title: h.title || 'Untitled',
        description: h.story_text || `Points: ${h.points || 0} | Comments: ${h.num_comments || 0}`,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        source: 'HackerNews',
        publishedAt: h.created_at || new Date().toISOString(),
      }));

      return {
        articles,
        provider: this.id,
        total: data.nbHits || articles.length,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
