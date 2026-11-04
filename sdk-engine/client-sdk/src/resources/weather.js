export class WeatherResource {
  constructor(client) {
    this.client = client;
  }

  /**
   * Fetch current weather with automated failover (Open-Meteo -> Weatherstack)
   *
   * @param {Object} [options]
   * @param {string} [options.city='San Francisco']
   * @param {number} [options.latitude]
   * @param {number} [options.longitude]
   * @param {string} [options.provider] Target a specific provider ('openmeteo' | 'weatherstack')
   * @returns {Promise<Object>} Unified weather response
   */
  async current({ city = 'San Francisco', latitude, longitude, provider } = {}) {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (latitude !== undefined) params.set('latitude', String(latitude));
    if (longitude !== undefined) params.set('longitude', String(longitude));

    const headers = {};
    if (provider) {
      headers['x-oneapi-provider'] = provider;
    }

    const res = await this.client.request(`/proxy/weather/current?${params.toString()}`, {
      method: 'GET',
      headers,
    });

    const payload = res.data || res;
    return {
      location: payload.location,
      coordinates: payload.coordinates,
      current: payload.current,
      provider: res._oneapi?.finalProvider || payload.provider,
      timestamp: payload.timestamp,
      _oneapi: res._oneapi,
      raw: res,
    };
  }
}
