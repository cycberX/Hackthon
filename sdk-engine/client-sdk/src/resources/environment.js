export class EnvironmentResource {
  constructor(client) {
    this.client = client;
  }

  /**
   * Fetch ambient air quality with automated failover (OpenAQ -> Open-Meteo Air)
   *
   * @param {Object} [options]
   * @param {string} [options.city='London']
   * @param {number} [options.latitude]
   * @param {number} [options.longitude]
   * @param {string} [options.provider] Target a specific provider ('openaq' | 'openmeteo_air')
   * @returns {Promise<Object>} Unified environment response with US AQI and pollutant concentrations
   */
  async airQuality({ city = 'London', latitude, longitude, provider } = {}) {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (latitude !== undefined) params.set('latitude', String(latitude));
    if (longitude !== undefined) params.set('longitude', String(longitude));

    const headers = {};
    if (provider) {
      headers['x-oneapi-provider'] = provider;
    }

    const res = await this.client.request(`/proxy/environment/air-quality?${params.toString()}`, {
      method: 'GET',
      headers,
    });

    const payload = res.data || res;
    return {
      location: payload.location,
      coordinates: payload.coordinates,
      airQuality: payload.airQuality,
      provider: res._oneapi?.finalProvider || payload.provider,
      timestamp: payload.timestamp,
      _oneapi: res._oneapi,
      raw: res,
    };
  }
}
