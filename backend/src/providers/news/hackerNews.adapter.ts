import type { IProviderAdapter, UnifiedNewsRequest, UnifiedNewsResponse, ProviderConfig } from '../types.js';

export class HackerNewsAdapter implements IProviderAdapter<UnifiedNewsRequest, UnifiedNewsResponse> {
  public readonly id = 'hackernews';
  public readonly category = 'news' as const;
  public readonly displayName = 'HackerNews Algolia API (Public)';
  public readonly isKeyRequired = false;

  public async execute(params: UnifiedNewsRequest, config: ProviderConfig): Promise<UnifiedNewsResponse> {
    const limit = params.limit || 10;
    const query = params.query || 'technology';
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 8000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        const err = new Error(`HackerNews API upstream error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = (await response.json()) as any;
      const hits = data.hits || [];

      const articles = hits.map((h: any) => {
        const desc = h.story_text || `Score: ${h.points ?? 0} points | ${h.num_comments ?? 0} comments`;
        return {
          id: String(h.objectID),
          title: String(h.title || 'Untitled'),
          description: desc,
          snippet: desc,
          url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
          source: 'HackerNews',
          author: h.author || 'community',
          publishedAt: h.created_at || new Date().toISOString(),
          provider: this.id,
        };
      });

      return {
        query,
        total: Number(data.nbHits || articles.length),
        articles,
        provider: this.id,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
