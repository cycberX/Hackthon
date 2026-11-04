export class HealthResource {
  constructor(client) {
    this.client = client;
  }

  /**
   * Check gateway operational health, database connectivity, and uptime.
   */
  async check() {
    // Health endpoint is mounted at root /health
    const baseWithoutV1 = this.client.baseURL.replace(/\/api\/v1$/, '');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.client.timeout);

    try {
      const response = await fetch(`${baseWithoutV1}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      return {
        ok: response.ok,
        statusCode: response.status,
        ...data,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
