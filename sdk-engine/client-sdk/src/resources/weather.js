export class WeatherResource {
  constructor(client) {
    this.client = client;
  }

  /**
   * Fetch current weather with automatic failover (Open-Meteo -> Weatherstack)
   */
  async current({ city = "San Francisco", latitude, longitude } = {}) {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (latitude !== undefined) params.set("latitude", String(latitude));
    if (longitude !== undefined) params.set("longitude", String(longitude));

    const data = await this.client.request(`/proxy/weather/current?${params.toString()}`, {
      method: "GET",
    });

    return data.data || data;
  }
}
