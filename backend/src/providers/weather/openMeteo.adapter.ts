import type { IProviderAdapter, UnifiedWeatherRequest, UnifiedWeatherResponse, ProviderConfig } from '../types.js';

// WMO Weather interpretation codes
function mapWmoCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

export class OpenMeteoWeatherAdapter implements IProviderAdapter<UnifiedWeatherRequest, UnifiedWeatherResponse> {
  public readonly id = 'openmeteo';
  public readonly category = 'weather' as const;
  public readonly displayName = 'Open-Meteo Weather API (Public)';
  public readonly isKeyRequired = false;

  public async execute(params: UnifiedWeatherRequest, config: ProviderConfig): Promise<UnifiedWeatherResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 5000);

    try {
      let lat = params.latitude;
      let lon = params.longitude;
      let locationName = params.city || 'Coordinates';

      // If city provided, geocode via Open-Meteo geocoding
      if (params.city && (!lat || !lon)) {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(params.city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl, { signal: controller.signal });
        if (geoRes.ok) {
          const geoData = await geoRes.json() as any;
          if (geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
            locationName = `${geoData.results[0].name}, ${geoData.results[0].country || ''}`.trim();
          }
        }
      }

      // Default to London if not specified
      if (lat === undefined || lon === undefined) {
        lat = 51.5074;
        lon = -0.1278;
        locationName = 'London, UK';
      }

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
      const response = await fetch(weatherUrl, { signal: controller.signal });

      if (!response.ok) {
        const err = new Error(`Open-Meteo API error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = await response.json() as any;
      const current = data.current || {};

      return {
        location: locationName,
        current: {
          temperature: current.temperature_2m ?? 20,
          humidity: current.relative_humidity_2m ?? 50,
          condition: mapWmoCode(current.weather_code ?? 0),
          windSpeed: current.wind_speed_10m ?? 10,
        },
        provider: this.id,
        timestamp: current.time || new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
