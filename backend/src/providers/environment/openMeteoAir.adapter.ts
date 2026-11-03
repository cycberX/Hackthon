import type { IProviderAdapter, UnifiedEnvironmentRequest, UnifiedEnvironmentResponse, ProviderConfig } from '../types.js';

export class OpenMeteoAirQualityAdapter implements IProviderAdapter<UnifiedEnvironmentRequest, UnifiedEnvironmentResponse> {
  public readonly id = 'openmeteo_air';
  public readonly category = 'environment' as const;
  public readonly displayName = 'Open-Meteo Atmospheric Air Quality (Fallback)';
  public readonly isKeyRequired = false;

  public async execute(params: UnifiedEnvironmentRequest, config: ProviderConfig): Promise<UnifiedEnvironmentResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 5000);

    try {
      let lat = params.latitude;
      let lon = params.longitude;
      let locationName = params.city || 'Coordinates';

      // Geocode city if provided
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

      if (lat === undefined || lon === undefined) {
        lat = 28.6139; // Default to Delhi
        lon = 77.209;
        locationName = 'Delhi, India';
      }

      const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,us_aqi,european_aqi`;
      const response = await fetch(airUrl, { signal: controller.signal });

      if (!response.ok) {
        const err = new Error(`Open-Meteo Air Quality error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = await response.json() as any;
      const current = data.current || {};
      const pm25 = current.pm2_5;
      const pm10 = current.pm10;
      const aqi = current.us_aqi ?? current.european_aqi;

      let status: UnifiedEnvironmentResponse['airQuality']['status'] = 'Good';
      if (aqi > 200) status = 'Very Unhealthy';
      else if (aqi > 150) status = 'Unhealthy';
      else if (aqi > 50) status = 'Moderate';

      return {
        location: locationName,
        airQuality: {
          aqi,
          pm25,
          pm10,
          status,
          mainPollutant: 'PM2.5',
        },
        provider: this.id,
        timestamp: current.time || new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
