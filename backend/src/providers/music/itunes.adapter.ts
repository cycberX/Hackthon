import type { IProviderAdapter, UnifiedMusicRequest, UnifiedMusicResponse, ProviderConfig } from '../types.js';

export class ItunesMusicAdapter implements IProviderAdapter<UnifiedMusicRequest, UnifiedMusicResponse> {
  public readonly id = 'itunes';
  public readonly category = 'music' as const;
  public readonly displayName = 'Apple iTunes Search API (Fallback)';
  public readonly isKeyRequired = false;

  public async execute(params: UnifiedMusicRequest, config: ProviderConfig): Promise<UnifiedMusicResponse> {
    const limit = params.limit || 10;
    const term = encodeURIComponent(params.query || 'electronic');
    const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=${limit}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 5000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        const err = new Error(`iTunes Search API error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = await response.json() as any;
      const rawResults = data.results || [];

      const tracks = rawResults.map((t: any) => ({
        id: String(t.trackId),
        title: t.trackName || 'Unknown Title',
        artist: t.artistName || 'Unknown Artist',
        album: t.collectionName || 'Unknown Album',
        duration: Math.round((t.trackTimeMillis || 0) / 1000),
        previewUrl: t.previewUrl,
        coverUrl: t.artworkUrl100 || t.artworkUrl60,
      }));

      return {
        tracks,
        provider: this.id,
        total: data.resultCount || tracks.length,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
