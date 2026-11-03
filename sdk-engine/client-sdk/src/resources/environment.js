export class EnvironmentResource {
  constructor(client) {
    this.client = client;
  }

  /**
   * Fetch atmospheric air quality with automatic failover (OpenAQ -> Open-Meteo)
   */
  async airQuality({ city = "London", latitude, longitude } = {}) {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (latitude !== undefined) params.set("latitude", String(latitude));
    if (longitude !== undefined) params.set("longitude", String(longitude));

    const data = await this.client.request(`/proxy/environment/air-quality?${params.toString()}`, {
      method: "GET",
    });

    return data.data || data;
  }
}
