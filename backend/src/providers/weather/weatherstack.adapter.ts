import type { IProviderAdapter, UnifiedWeatherRequest, UnifiedWeatherResponse, ProviderConfig } from '../types.js';

export class WeatherstackAdapter implements IProviderAdapter<UnifiedWeatherRequest, UnifiedWeatherResponse> {
  public readonly id = 'weatherstack';
  public readonly category = 'weather' as const;
  public readonly displayName = 'Weatherstack (APILayer) / wttr.in (Fallback)';
  public readonly isKeyRequired = false;

  public async execute(params: UnifiedWeatherRequest, config: ProviderConfig): Promise<UnifiedWeatherResponse> {
    const apiKey = config.apiKey || process.env.WEATHERSTACK_API_KEY;
    const city = params.city || 'London';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 5000);

    try {
      if (apiKey) {
        // APILayer Weatherstack
        const url = `https://api.weatherstack.com/current?access_key=${apiKey}&query=${encodeURIComponent(city)}`;
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          const err = new Error(`Weatherstack API error: ${response.status}`);
          (err as any).statusCode = response.status;
          throw err;
        }

        const data = await response.json() as any;
        if (data.error) {
          const err = new Error(`Weatherstack error: ${data.error.info || 'Unknown error'}`);
          (err as any).statusCode = 400;
          throw err;
        }

        return {
          location: `${data.location?.name}, ${data.location?.country}`,
          current: {
            temperature: data.current?.temperature ?? 0,
            humidity: data.current?.humidity ?? 0,
            condition: data.current?.weather_descriptions?.[0] || 'Clear',
            windSpeed: data.current?.wind_speed ?? 0,
          },
          provider: this.id,
          timestamp: new Date().toISOString(),
        };
      }

      // Public Fallback using wttr.in JSON
      const fallbackUrl = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
      const response = await fetch(fallbackUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'OneAPI-Gateway/1.0' },
      });

      if (!response.ok) {
        const err = new Error(`wttr.in fallback error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = await response.json() as any;
      const current = data.current_condition?.[0] || {};
      const area = data.nearest_area?.[0];
      const areaName = area?.areaName?.[0]?.value || city;
      const country = area?.country?.[0]?.value || '';

      return {
        location: `${areaName}, ${country}`.trim(),
        current: {
          temperature: parseFloat(current.temp_C || '20'),
          humidity: parseFloat(current.humidity || '50'),
          condition: current.weatherDesc?.[0]?.value || 'Clear',
          windSpeed: parseFloat(current.windspeedKmph || '10'),
        },
        provider: this.id,
        timestamp: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
