import type { IProviderAdapter, UnifiedWeatherRequest, UnifiedWeatherResponse, ProviderConfig } from '../types.js';

export class WeatherstackAdapter implements IProviderAdapter<UnifiedWeatherRequest, UnifiedWeatherResponse> {
  public readonly id = 'weatherstack';
  public readonly category = 'weather' as const;
  public readonly displayName = 'Weatherstack (APILayer)';
  public readonly isKeyRequired = true;

  public async execute(params: UnifiedWeatherRequest, config: ProviderConfig): Promise<UnifiedWeatherResponse> {
    const apiKey = config.apiKey || process.env.WEATHERSTACK_API_KEY;
    const city = params.city || (params.latitude && params.longitude ? `${params.latitude},${params.longitude}` : 'San Francisco');

    if (!apiKey) {
      const err = new Error('Weatherstack API access key is required. Please add your key to the project vault or configure failover to Open-Meteo.');
      (err as any).statusCode = 401;
      throw err;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 8000);

    try {
      const url = `https://api.weatherstack.com/current?access_key=${apiKey}&query=${encodeURIComponent(city)}`;
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        const err = new Error(`Weatherstack upstream error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = (await response.json()) as any;
      if (data.error) {
        const err = new Error(`Weatherstack error: ${data.error.info || 'API error'}`);
        (err as any).statusCode = data.error.code === 101 ? 401 : data.error.code === 104 ? 429 : 400;
        throw err;
      }

      const lat = parseFloat(data.location?.lat) || (params.latitude ?? 0);
      const lon = parseFloat(data.location?.lon) || (params.longitude ?? 0);
      const locationName = data.location?.name
        ? `${data.location.name}${data.location.country ? ', ' + data.location.country : ''}`
        : city;

      return {
        location: locationName,
        coordinates: {
          latitude: lat,
          longitude: lon,
          lat,
          lon,
        },
        current: {
          temperature: Number(data.current?.temperature ?? 0),
          humidity: Number(data.current?.humidity ?? 0),
          condition: data.current?.weather_descriptions?.[0] || 'Clear',
          windSpeed: Number(data.current?.wind_speed ?? 0),
          pressure: Number(data.current?.pressure ?? 1013),
        },
        provider: this.id,
        timestamp: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
