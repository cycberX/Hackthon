import type { IProviderAdapter, UnifiedEnvironmentRequest, UnifiedEnvironmentResponse, ProviderConfig } from '../types.js';

export class OpenMeteoAirQualityAdapter implements IProviderAdapter<UnifiedEnvironmentRequest, UnifiedEnvironmentResponse> {
  public readonly id = 'openmeteo_air';
  public readonly category = 'environment' as const;
  public readonly displayName = 'Open-Meteo Atmospheric Air Quality (Fallback)';
  public readonly isKeyRequired = false;

  public async execute(params: UnifiedEnvironmentRequest, config: ProviderConfig): Promise<UnifiedEnvironmentResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 8000);

    try {
      let lat = params.latitude;
      let lon = params.longitude;
      let locationName = params.city || 'Coordinates';

      // Geocode city if provided
      if (params.city && (!lat || !lon)) {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(params.city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl, { signal: controller.signal });
        if (geoRes.ok) {
          const geoData = (await geoRes.json()) as any;
          if (geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
            locationName = `${geoData.results[0].name}, ${geoData.results[0].country || ''}`.trim();
          }
        }
      }

      if (lat === undefined || lon === undefined) {
        lat = 51.5074; // Default to London
        lon = -0.1278;
        locationName = 'London, United Kingdom';
      }

      const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi`;
      const response = await fetch(airUrl, { signal: controller.signal });

      if (!response.ok) {
        const err = new Error(`Open-Meteo Air Quality upstream error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = (await response.json()) as any;
      const current = data.current;
      if (!current) {
        const err = new Error('Open-Meteo Air Quality returned empty dataset.');
        (err as any).statusCode = 502;
        throw err;
      }

      const pm25 = current.pm2_5;
      const pm10 = current.pm10;
      const aqi = Number(current.us_aqi ?? current.european_aqi ?? 35);

      let status: UnifiedEnvironmentResponse['airQuality']['status'] = 'Good';
      if (aqi > 300) status = 'Hazardous';
      else if (aqi > 200) status = 'Very Unhealthy';
      else if (aqi > 150) status = 'Unhealthy';
      else if (aqi > 50) status = 'Moderate';

      let mainPollutant = 'PM2.5';
      if (pm10 && pm25 && pm10 > pm25 * 2) mainPollutant = 'PM10';
      else if (current.ozone && current.ozone > 120) mainPollutant = 'O₃';

      return {
        location: locationName,
        coordinates: {
          latitude: lat,
          longitude: lon,
          lat,
          lon,
        },
        airQuality: {
          aqi: Math.round(aqi),
          status,
          pm25: pm25 !== undefined ? Math.round(pm25 * 10) / 10 : undefined,
          pm10: pm10 !== undefined ? Math.round(pm10 * 10) / 10 : undefined,
          o3: current.ozone !== undefined ? Math.round(current.ozone * 10) / 10 : undefined,
          no2: current.nitrogen_dioxide !== undefined ? Math.round(current.nitrogen_dioxide * 10) / 10 : undefined,
          so2: current.sulphur_dioxide !== undefined ? Math.round(current.sulphur_dioxide * 10) / 10 : undefined,
          co: current.carbon_monoxide !== undefined ? Math.round(current.carbon_monoxide * 10) / 10 : undefined,
          mainPollutant,
        },
        provider: this.id,
        timestamp: current.time || new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
