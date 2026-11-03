import type { IProviderAdapter, UnifiedEnvironmentRequest, UnifiedEnvironmentResponse, ProviderConfig } from '../types.js';

export class OpenAqAdapter implements IProviderAdapter<UnifiedEnvironmentRequest, UnifiedEnvironmentResponse> {
  public readonly id = 'openaq';
  public readonly category = 'environment' as const;
  public readonly displayName = 'OpenAQ Global Air Quality API (Public)';
  public readonly isKeyRequired = false;

  public async execute(params: UnifiedEnvironmentRequest, config: ProviderConfig): Promise<UnifiedEnvironmentResponse> {
    const city = params.city || 'Delhi';
    const url = `https://api.openaq.org/v2/latest?city=${encodeURIComponent(city)}&limit=1`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 5000);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...(config.apiKey && { 'X-API-Key': config.apiKey }),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = new Error(`OpenAQ API error: ${response.status}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = await response.json() as any;
      const result = data.results?.[0];

      let pm25: number | undefined;
      let pm10: number | undefined;

      if (result && Array.isArray(result.measurements)) {
        for (const m of result.measurements) {
          if (m.parameter === 'pm25') pm25 = m.value;
          if (m.parameter === 'pm10') pm10 = m.value;
        }
      }

      // Calculate simple AQI status from PM2.5
      let status: UnifiedEnvironmentResponse['airQuality']['status'] = 'Good';
      if (pm25 !== undefined) {
        if (pm25 > 150) status = 'Very Unhealthy';
        else if (pm25 > 55) status = 'Unhealthy';
        else if (pm25 > 35) status = 'Moderate';
      }

      return {
        location: result?.location || city,
        airQuality: {
          pm25,
          pm10,
          status,
          mainPollutant: 'PM2.5',
        },
        provider: this.id,
        timestamp: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
