export class NewsResource {
  constructor(client) {
    this.client = client;
  }

  /**
   * Search news with automatic failover (HackerNews -> Spaceflight News)
   */
  async search({ query = "technology", limit = 10 } = {}) {
    const params = new URLSearchParams({
      query,
      limit: String(limit),
    });

    const data = await this.client.request(`/proxy/news/search?${params.toString()}`, {
      method: "GET",
    });

    return data.data || data;
  }
}
