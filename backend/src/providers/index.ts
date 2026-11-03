import { providerRegistry } from './registry.js';
import { GeminiAiAdapter } from './ai/gemini.adapter.js';
import { GroqAiAdapter } from './ai/groq.adapter.js';
import { OpenRouterAiAdapter } from './ai/openrouter.adapter.js';
import { DeezerMusicAdapter } from './music/deezer.adapter.js';
import { ItunesMusicAdapter } from './music/itunes.adapter.js';
import { OpenMeteoWeatherAdapter } from './weather/openMeteo.adapter.js';
import { WeatherstackAdapter } from './weather/weatherstack.adapter.js';
import { HackerNewsAdapter } from './news/hackerNews.adapter.js';
import { SpaceflightNewsAdapter } from './news/spaceflight.adapter.js';
import { OpenAqAdapter } from './environment/openaq.adapter.js';
import { OpenMeteoAirQualityAdapter } from './environment/openMeteoAir.adapter.js';

/**
 * Initializes and registers the default providers for each of the 5 categories.
 */
export function initProviders(): void {
  // 1. AI Category
  providerRegistry.register(new GeminiAiAdapter());
  providerRegistry.register(new GroqAiAdapter());
  providerRegistry.register(new OpenRouterAiAdapter());

  // 2. Music Category (from public-apis)
  providerRegistry.register(new DeezerMusicAdapter());
  providerRegistry.register(new ItunesMusicAdapter());

  // 3. Weather Category (from public-apis & APILayer reference)
  providerRegistry.register(new OpenMeteoWeatherAdapter());
  providerRegistry.register(new WeatherstackAdapter());

  // 4. News Category (from public-apis)
  providerRegistry.register(new HackerNewsAdapter());
  providerRegistry.register(new SpaceflightNewsAdapter());

  // 5. Environment Category (from public-apis)
  providerRegistry.register(new OpenAqAdapter());
  providerRegistry.register(new OpenMeteoAirQualityAdapter());

  console.log('[Providers] Initialized 11 default providers across 5 categories (AI, Music, Weather, News, Environment)');
}

export * from './types.js';
export * from './registry.js';
