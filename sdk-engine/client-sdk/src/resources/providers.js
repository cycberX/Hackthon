export class ProvidersResource {
  constructor(client) {
    this.client = client;
  }

  /**
   * List all registered API providers across all 5 categories
   * with their default primary/fallback routing and credential requirements.
   */
  async list() {
    const data = await this.client.request('/providers', {
      method: 'GET',
    });

    return data.data || data;
  }
}
