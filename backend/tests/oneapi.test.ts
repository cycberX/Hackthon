import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encryptSecret, decryptSecret, maskApiKey } from '../src/utils/vaultCrypto.js';
import { providerRegistry } from '../src/providers/registry.js';
import { initProviders } from '../src/providers/index.js';
import type { IProviderAdapter } from '../src/providers/types.js';

describe('5. OneAPI Vault & AES-256-GCM Encryption Tests', () => {
  it('should encrypt and decrypt provider API keys without loss', () => {
    const rawSecret = 'AIzaSyDemoKey1234567890abcdefghijklmnopqrstuvwxyz';
    const encrypted = encryptSecret(rawSecret);

    assert.ok(encrypted.combined.includes(':'));
    assert.equal(encrypted.combined.split(':').length, 3);

    const decrypted = decryptSecret(encrypted.combined);
    assert.equal(decrypted, rawSecret);
  });

  it('should mask API keys securely for UI preview', () => {
    const masked = maskApiKey('sk_live_1234567890abcdef');
    assert.ok(masked.includes('...'));
    assert.ok(masked.startsWith('sk_live_'));
    assert.ok(masked.endsWith('cdef'));
  });

  it('should throw error when decrypting malformed ciphertext', () => {
    assert.throws(() => {
      decryptSecret('invalid_format_string');
    });
  });
});

describe('6. OneAPI Multi-Category Provider Registry Tests', () => {
  initProviders();

  it('should have registered demo providers across 5 categories', () => {
    const all = providerRegistry.list();
    assert.ok(all.length >= 11);

    const categories = ['ai', 'music', 'weather', 'news', 'environment'] as const;
    for (const cat of categories) {
      const catProviders = providerRegistry.list(cat);
      assert.ok(catProviders.length >= 2, `Category ${cat} must have at least 2 providers`);
    }
  });

  it('should return default routing pairs for all 5 categories', () => {
    const ai = providerRegistry.getDefaultRouting('ai');
    assert.equal(ai.primary, 'gemini');
    assert.equal(ai.fallback, 'groq');

    const music = providerRegistry.getDefaultRouting('music');
    assert.equal(music.primary, 'deezer');
    assert.equal(music.fallback, 'itunes');

    const weather = providerRegistry.getDefaultRouting('weather');
    assert.equal(weather.primary, 'openmeteo');
    assert.equal(weather.fallback, 'weatherstack');

    const news = providerRegistry.getDefaultRouting('news');
    assert.equal(news.primary, 'hackernews');
    assert.equal(news.fallback, 'spaceflight');

    const env = providerRegistry.getDefaultRouting('environment');
    assert.equal(env.primary, 'openaq');
    assert.equal(env.fallback, 'openmeteo_air');
  });

  it('should allow developers to dynamically add new custom providers', () => {
    const customWeatherAdapter: IProviderAdapter = {
      id: 'my_custom_sensor',
      category: 'weather',
      displayName: 'My IoT Weather Station',
      isKeyRequired: false,
      async execute(params) {
        return {
          location: params.city || 'Home Station',
          current: {
            temperature: 24.5,
            humidity: 45,
            condition: 'Ideal Room Temperature',
            windSpeed: 2.1,
          },
          provider: 'my_custom_sensor',
          timestamp: new Date().toISOString(),
        };
      },
    };

    // Register custom provider
    providerRegistry.register(customWeatherAdapter);

    // Verify it exists in the registry
    assert.ok(providerRegistry.has('weather', 'my_custom_sensor'));
    const retrieved = providerRegistry.get('weather', 'my_custom_sensor');
    assert.ok(retrieved);
    assert.equal(retrieved.displayName, 'My IoT Weather Station');
  });
});
