import type { IProviderAdapter, UnifiedMusicRequest, UnifiedMusicResponse, ProviderConfig } from '../types.js';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export class ItunesMusicAdapter implements IProviderAdapter<UnifiedMusicRequest, UnifiedMusicResponse> {
  public readonly id = 'itunes';
  public readonly category = 'music' as const;
  public readonly displayName = 'Apple iTunes Search API (Fallback)';
  public readonly isKeyRequired = false;

  public async execute(params: UnifiedMusicRequest, config: ProviderConfig): Promise<UnifiedMusicResponse> {
    const limit = params.limit || 10;
    const query = params.query || 'electronic';
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 8000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        const err = new Error(`iTunes Search upstream error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = (await response.json()) as any;
      const rawResults = data.results || [];

      const tracks = rawResults.map((t: any) => {
        const duration = Math.round((t.trackTimeMillis || 0) / 1000);
        const cover = t.artworkUrl100 || t.artworkUrl60;
        return {
          id: String(t.trackId),
          title: String(t.trackName || 'Unknown Title'),
          artist: String(t.artistName || 'Unknown Artist'),
          album: String(t.collectionName || 'Unknown Album'),
          duration,
          durationFormatted: formatDuration(duration),
          previewUrl: t.previewUrl || undefined,
          coverUrl: cover,
          albumCover: cover,
          provider: this.id,
        };
      });

      return {
        query,
        total: Number(data.resultCount || tracks.length),
        tracks,
        provider: this.id,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
