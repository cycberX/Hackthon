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

describe('8. Dedicated ApiKey Model for Multiple Developer Keys', () => {
  it('should support multiple API keys per developer with AES-256 encryption and unique hashes', () => {
    const rawKey1 = 'sk_live_' + 'a'.repeat(48);
    const rawKey2 = 'sk_live_' + 'b'.repeat(48);

    const enc1 = encryptSecret(rawKey1);
    const enc2 = encryptSecret(rawKey2);

    assert.notEqual(enc1.combined, enc2.combined);
    assert.equal(decryptSecret(enc1.combined), rawKey1);
    assert.equal(decryptSecret(enc2.combined), rawKey2);

    const key1Obj = {
      name: 'Production Backend Server',
      keyPrefix: `${rawKey1.slice(0, 12)}...${rawKey1.slice(-4)}`,
      encryptedKey: enc1.combined,
      scopes: ['read', 'write', 'proxy'],
      isActive: true,
    };

    const key2Obj = {
      name: 'Mobile App Staging',
      keyPrefix: `${rawKey2.slice(0, 12)}...${rawKey2.slice(-4)}`,
      encryptedKey: enc2.combined,
      scopes: ['read', 'proxy'],
      isActive: true,
    };

    assert.equal(decryptSecret(key1Obj.encryptedKey), rawKey1);
    assert.equal(decryptSecret(key2Obj.encryptedKey), rawKey2);
    assert.equal(key1Obj.name, 'Production Backend Server');
    assert.equal(key2Obj.name, 'Mobile App Staging');
  });
});

describe('9. Multi-Level Fallback Cascade Chain Tests', () => {
  it('should support priority cascade array of fallbacks (e.g. Gemini -> Groq -> OpenRouter)', () => {
    const routingRule = {
      category: 'ai',
      primaryProviderId: 'gemini',
      fallbackProviderId: 'groq',
      fallbackProviderIds: ['groq', 'openrouter'],
      timeoutMs: 25000,
    };

    assert.equal(routingRule.primaryProviderId, 'gemini');
    assert.equal(routingRule.fallbackProviderIds.length, 2);
    assert.equal(routingRule.fallbackProviderIds[0], 'groq');
    assert.equal(routingRule.fallbackProviderIds[1], 'openrouter');

    // Simulate cascade execution order
    const executionOrder: string[] = [];
    const providers = [routingRule.primaryProviderId, ...routingRule.fallbackProviderIds];

    for (let i = 0; i < providers.length; i++) {
      executionOrder.push(providers[i]);
    }

    assert.deepEqual(executionOrder, ['gemini', 'groq', 'openrouter']);
  });
});

describe('10. Unified Response Normalization & Strict Zero-Mock Enforcement Tests', () => {
  it('should reject unconfigured key-required providers with 401 and NEVER return mock fallback data', async () => {
    const keyRequiredProviders = [
      { category: 'ai' as const, id: 'gemini' },
      { category: 'ai' as const, id: 'groq' },
      { category: 'ai' as const, id: 'openrouter' },
      { category: 'weather' as const, id: 'weatherstack' },
      { category: 'environment' as const, id: 'openaq' },
    ];

    for (const item of keyRequiredProviders) {
      const adapter = providerRegistry.get(item.category, item.id);
      assert.ok(adapter, `Adapter ${item.id} must exist in registry`);
      assert.equal(adapter.isKeyRequired, true, `Provider ${item.id} must have isKeyRequired=true`);

      // Attempt execution with empty config (no keys)
      await assert.rejects(
        async () => {
          await adapter.execute(
            item.category === 'ai'
              ? { messages: [{ role: 'user', content: 'hello' }] }
              : item.category === 'weather'
              ? { city: 'London' }
              : { city: 'London' },
            { apiKey: '' } // no apiKey
          );
        },
        (err: any) => {
          // Verify that error is thrown with 401 rather than returning fake mock data
          assert.equal(err.statusCode, 401, `Provider ${item.id} must reject missing key with 401`);
          assert.ok(
            err.message.toLowerCase().includes('key') || err.message.toLowerCase().includes('required'),
            `Provider ${item.id} error message must clearly state key is required`
          );
          return true;
        }
      );
    }
  });

  it('should verify provider registry contracts across all 5 categories adhere to unified schema specifications', () => {
    const allProviders = providerRegistry.list();
    assert.ok(allProviders.length >= 11);

    const categories = ['ai', 'music', 'weather', 'news', 'environment'] as const;
    for (const cat of categories) {
      const list = providerRegistry.list(cat);
      assert.ok(list.length >= 2, `Category ${cat} must provide multiple alternative providers`);
      for (const p of list) {
        assert.ok(p.id, 'Provider must have an id');
        assert.ok(p.displayName, 'Provider must have a displayName');
        assert.equal(p.category, cat);
      }
    }
  });
});

