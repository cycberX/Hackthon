export class NewsResource {
  constructor(client) {
    this.client = client;
  }

  /**
   * Search real-time news with automated failover (HackerNews -> Spaceflight News)
   *
   * @param {Object} [options]
   * @param {string} [options.query='technology']
   * @param {number} [options.limit=10]
   * @param {string} [options.provider] Target a specific provider ('hackernews' | 'spaceflight')
   * @returns {Promise<Object>} Unified news response with articles
   */
  async search({ query = 'technology', limit = 10, provider } = {}) {
    const params = new URLSearchParams({
      query,
      limit: String(limit),
    });

    const headers = {};
    if (provider) {
      headers['x-oneapi-provider'] = provider;
    }

    const res = await this.client.request(`/proxy/news/search?${params.toString()}`, {
      method: 'GET',
      headers,
    });

    const payload = res.data || res;
    return {
      query: payload.query || query,
      total: payload.total || (payload.articles || []).length,
      articles: payload.articles || [],
      provider: res._oneapi?.finalProvider || payload.provider,
      _oneapi: res._oneapi,
      raw: res,
    };
  }
}
