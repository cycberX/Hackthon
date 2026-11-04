import type { IProviderAdapter, UnifiedMusicRequest, UnifiedMusicResponse, ProviderConfig } from '../types.js';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export class DeezerMusicAdapter implements IProviderAdapter<UnifiedMusicRequest, UnifiedMusicResponse> {
  public readonly id = 'deezer';
  public readonly category = 'music' as const;
  public readonly displayName = 'Deezer Music API (Public)';
  public readonly isKeyRequired = false;

  public async execute(params: UnifiedMusicRequest, config: ProviderConfig): Promise<UnifiedMusicResponse> {
    const limit = params.limit || 10;
    const query = params.query || 'electronic';
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 8000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        const err = new Error(`Deezer API upstream error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = (await response.json()) as any;
      if (data.error) {
        const err = new Error(`Deezer error: ${data.error.message || 'Catalog lookup failed'}`);
        (err as any).statusCode = 400;
        throw err;
      }

      const rawTracks = data.data || [];
      if (!Array.isArray(rawTracks) || rawTracks.length === 0) {
        const err = new Error('Deezer catalog returned no tracks for this query. Triggering failover to iTunes.');
        (err as any).statusCode = 404;
        throw err;
      }

      const tracks = rawTracks.map((t: any) => {
        const duration = Number(t.duration || 0);
        const cover = t.album?.cover_medium || t.album?.cover_big || t.album?.cover || t.artist?.picture_medium;
        return {
          id: String(t.id),
          title: String(t.title || 'Untitled'),
          artist: String(t.artist?.name || 'Unknown Artist'),
          album: String(t.album?.title || 'Unknown Album'),
          duration,
          durationFormatted: formatDuration(duration),
          previewUrl: t.preview || undefined,
          coverUrl: cover,
          albumCover: cover,
          provider: this.id,
        };
      });

      return {
        query,
        total: Number(data.total || tracks.length),
        tracks,
        provider: this.id,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
