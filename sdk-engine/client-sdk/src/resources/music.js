export class MusicResource {
  constructor(client) {
    this.client = client;
  }

  /**
   * Search musical tracks with automated failover (Deezer -> Apple iTunes)
   *
   * @param {Object} [options]
   * @param {string} [options.query='electronic']
   * @param {number} [options.limit=10]
   * @param {string} [options.provider] Target a specific provider ('deezer' | 'itunes')
   * @returns {Promise<Object>} Unified music response with tracks and 30s previews
   */
  async search({ query = 'electronic', limit = 10, provider } = {}) {
    const params = new URLSearchParams({
      query,
      limit: String(limit),
    });

    const headers = {};
    if (provider) {
      headers['x-oneapi-provider'] = provider;
    }

    const res = await this.client.request(`/proxy/music/search?${params.toString()}`, {
      method: 'GET',
      headers,
    });

    const payload = res.data || res;
    return {
      query: payload.query || query,
      total: payload.total || (payload.tracks || []).length,
      tracks: payload.tracks || [],
      provider: res._oneapi?.finalProvider || payload.provider,
      _oneapi: res._oneapi,
      raw: res,
    };
  }
}
