export class MusicResource {
  constructor(client) {
    this.client = client;
  }

  /**
   * Search tracks with automatic failover (Deezer -> iTunes)
   */
  async search({ query = "techno", limit = 10 } = {}) {
    const params = new URLSearchParams({
      query,
      limit: String(limit),
    });

    const data = await this.client.request(`/proxy/music/search?${params.toString()}`, {
      method: "GET",
    });

    return data.data || data;
  }
}
