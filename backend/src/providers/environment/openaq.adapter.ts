import type { IProviderAdapter, UnifiedEnvironmentRequest, UnifiedEnvironmentResponse, ProviderConfig } from '../types.js';

export class OpenAqAdapter implements IProviderAdapter<UnifiedEnvironmentRequest, UnifiedEnvironmentResponse> {
  public readonly id = 'openaq';
  public readonly category = 'environment' as const;
  public readonly displayName = 'OpenAQ Global Air Quality API (v3)';
  public readonly isKeyRequired = true;

  public async execute(params: UnifiedEnvironmentRequest, config: ProviderConfig): Promise<UnifiedEnvironmentResponse> {
    const apiKey = config.apiKey || process.env.OPENAQ_API_KEY;
    if (!apiKey) {
      const err = new Error('OpenAQ v3 API key is required. Please add your key to the project vault or configure failover to Open-Meteo Air.');
      (err as any).statusCode = 401;
      throw err;
    }

    const city = params.city || 'Delhi';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 8000);

    try {
      // Query OpenAQ v3 locations
      let url = `https://api.openaq.org/v3/locations?limit=1`;
      if (params.latitude && params.longitude) {
        url = `https://api.openaq.org/v3/locations?coordinates=${params.latitude},${params.longitude}&radius=25000&limit=1`;
      }

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'X-API-Key': apiKey,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = new Error(`OpenAQ upstream error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = (await response.json()) as any;
      const result = data.results?.[0];
      if (!result) {
        const err = new Error(`OpenAQ has no reporting stations for "${city}". Triggering failover to Open-Meteo.`);
        (err as any).statusCode = 404;
        throw err;
      }

      const locationName = result.name || result.locality || city;
      const lat = result.coordinates?.latitude ?? params.latitude ?? 0;
      const lon = result.coordinates?.longitude ?? params.longitude ?? 0;

      // Extract sensor parameters from location
      let pm25: number | undefined;
      let pm10: number | undefined;
      let o3: number | undefined;
      let no2: number | undefined;

      if (Array.isArray(result.sensors)) {
        for (const sensor of result.sensors) {
          const paramName = sensor.parameter?.name?.toLowerCase() || '';
          const val = typeof sensor.latest?.value === 'number' ? sensor.latest.value : undefined;
          if (paramName.includes('pm25') || paramName.includes('pm2.5')) pm25 = val;
          else if (paramName.includes('pm10')) pm10 = val;
          else if (paramName.includes('o3') || paramName.includes('ozone')) o3 = val;
          else if (paramName.includes('no2')) no2 = val;
        }
      }

      // If OpenAQ station has no current measurement values, trigger failover
      if (pm25 === undefined && pm10 === undefined && o3 === undefined && no2 === undefined) {
        const err = new Error('OpenAQ station has no active sensor measurements. Triggering failover to Open-Meteo Air Quality.');
        (err as any).statusCode = 502;
        throw err;
      }

      // Calculate US AQI from PM2.5 or PM10
      let aqi = 50;
      if (pm25 !== undefined) {
        // Simple US EPA breakpoint formula
        if (pm25 <= 12.0) aqi = Math.round((50 / 12.0) * pm25);
        else if (pm25 <= 35.4) aqi = Math.round(50 + ((100 - 50) / (35.4 - 12.1)) * (pm25 - 12.1));
        else if (pm25 <= 55.4) aqi = Math.round(101 + ((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5));
        else if (pm25 <= 150.4) aqi = Math.round(151 + ((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5));
        else aqi = Math.round(201 + ((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5));
      } else if (pm10 !== undefined) {
        aqi = Math.round(pm10);
      }

      let status: UnifiedEnvironmentResponse['airQuality']['status'] = 'Good';
      if (aqi > 300) status = 'Hazardous';
      else if (aqi > 200) status = 'Very Unhealthy';
      else if (aqi > 150) status = 'Unhealthy';
      else if (aqi > 50) status = 'Moderate';

      return {
        location: locationName,
        coordinates: {
          latitude: lat,
          longitude: lon,
          lat,
          lon,
        },
        airQuality: {
          aqi,
          status,
          pm25: pm25 !== undefined ? Math.round(pm25 * 10) / 10 : undefined,
          pm10: pm10 !== undefined ? Math.round(pm10 * 10) / 10 : undefined,
          o3: o3 !== undefined ? Math.round(o3 * 10) / 10 : undefined,
          no2: no2 !== undefined ? Math.round(no2 * 10) / 10 : undefined,
          mainPollutant: pm25 !== undefined ? 'PM2.5' : pm10 !== undefined ? 'PM10' : 'O₃',
        },
        provider: this.id,
        timestamp: result.datetimeLast?.utc || new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
