/**
 * OneAPI Client SDK (Browser & ESM Compatible)
 * Lightweight zero-dependency SDK for the OneAPI Gateway.
 */
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    global = typeof globalThis !== 'undefined' ? globalThis : global || self;
    global.OneAPI = factory().OneAPI;
    global.OneAPIError = factory().OneAPIError;
  }
})(this, function () {
  'use strict';

  class OneAPIError extends Error {
    constructor(message, options = {}) {
      super(message);
      this.name = 'OneAPIError';
      this.statusCode = options.statusCode ?? null;
      this.code = options.code ?? 'ONEAPI_ERROR';
      this.provider = options.provider ?? null;
      this.requestId = options.requestId ?? null;
    }
  }

  class ChatResponse {
    constructor(data) {
      const root = data.data || data;
      this.id = root.id || data.id || `chatcmpl_${Date.now()}`;
      this.object = root.object || 'chat.completion';
      this.created = root.created || Math.floor(Date.now() / 1000);
      this.model = root.model || data.model || 'auto';
      this.provider = data._oneapi?.finalProvider || root.provider || data.provider || 'unknown';
      this.primaryProvider = data._oneapi?.primaryProvider || this.provider;
      this.fallbackTriggered = Boolean(data._oneapi?.fallbackTriggered);
      this.fallbackReason = data._oneapi?.fallbackReason || null;
      this.latencyMs = data._oneapi?.latencyMs || root.latencyMs || 0;
      this.choices = root.choices || data.choices || [];
      this.usage = root.usage || data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      this.raw = data;
    }

    get content() {
      return this.choices[0]?.message?.content ?? '';
    }

    get message() {
      return this.choices[0]?.message ?? null;
    }

    get usedFallback() {
      return this.fallbackTriggered;
    }

    get providerUsed() {
      return this.provider;
    }
  }

  class AIResource {
    constructor(client) {
      this.client = client;
    }

    async chat({ messages, prompt, model = 'default', temperature = 0.7, maxTokens, provider } = {}) {
      let effectiveMessages = messages;
      if (!effectiveMessages && prompt) {
        effectiveMessages = [{ role: 'user', content: String(prompt) }];
      }

      if (!Array.isArray(effectiveMessages) || effectiveMessages.length === 0) {
        throw new Error('At least one chat message is required');
      }

      const headers = {};
      if (provider) headers['x-oneapi-provider'] = provider;

      const data = await this.client.request('/proxy/ai/chat', {
        method: 'POST',
        headers,
        body: {
          model,
          messages: effectiveMessages,
          temperature,
          ...(maxTokens !== undefined && { maxTokens }),
          ...(provider && { provider }),
        },
      });

      return new ChatResponse(data);
    }

    async upload_file({ file, purpose = 'assistants', filename } = {}) {
      if (!file) throw new Error('File content is required');
      const data = await this.client.request('/proxy/ai/upload', {
        method: 'POST',
        body: {
          file: typeof file === 'string' ? file : String(file),
          purpose,
          filename: filename || `upload_${Date.now()}.txt`,
        },
      });
      return data.data || data;
    }
  }

  class WeatherResource {
    constructor(client) {
      this.client = client;
    }

    async current({ city = 'San Francisco', latitude, longitude, provider } = {}) {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      if (latitude !== undefined) params.set('latitude', String(latitude));
      if (longitude !== undefined) params.set('longitude', String(longitude));

      const headers = {};
      if (provider) headers['x-oneapi-provider'] = provider;

      const res = await this.client.request(`/proxy/weather/current?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      const payload = res.data || res;
      return {
        location: payload.location,
        coordinates: payload.coordinates,
        current: payload.current,
        provider: res._oneapi?.finalProvider || payload.provider,
        timestamp: payload.timestamp,
        _oneapi: res._oneapi,
        raw: res,
      };
    }
  }

  class MusicResource {
    constructor(client) {
      this.client = client;
    }

    async search({ query = 'electronic', limit = 10, provider } = {}) {
      const params = new URLSearchParams({ query, limit: String(limit) });
      const headers = {};
      if (provider) headers['x-oneapi-provider'] = provider;

      const res = await this.client.request(`/proxy/music/search?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      const payload = res.data || res;
      return {
        query: payload.query || query,
        total: payload.total || (payload.tracks || []).length,
        tracks: payload.tracks || [],
        provider: res._oneapi?.finalProvider || payload.provider,
        _oneapi: res._oneapi,
        raw: res,
      };
    }
  }

  class NewsResource {
    constructor(client) {
      this.client = client;
    }

    async search({ query = 'technology', limit = 10, provider } = {}) {
      const params = new URLSearchParams({ query, limit: String(limit) });
      const headers = {};
      if (provider) headers['x-oneapi-provider'] = provider;

      const res = await this.client.request(`/proxy/news/search?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      const payload = res.data || res;
      return {
        query: payload.query || query,
        total: payload.total || (payload.articles || []).length,
        articles: payload.articles || [],
        provider: res._oneapi?.finalProvider || payload.provider,
        _oneapi: res._oneapi,
        raw: res,
      };
    }
  }

  class EnvironmentResource {
    constructor(client) {
      this.client = client;
    }

    async airQuality({ city = 'London', latitude, longitude, provider } = {}) {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      if (latitude !== undefined) params.set('latitude', String(latitude));
      if (longitude !== undefined) params.set('longitude', String(longitude));

      const headers = {};
      if (provider) headers['x-oneapi-provider'] = provider;

      const res = await this.client.request(`/proxy/environment/air-quality?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      const payload = res.data || res;
      return {
        location: payload.location,
        coordinates: payload.coordinates,
        airQuality: payload.airQuality,
        provider: res._oneapi?.finalProvider || payload.provider,
        timestamp: payload.timestamp,
        _oneapi: res._oneapi,
        raw: res,
      };
    }
  }

  class ProvidersResource {
    constructor(client) {
      this.client = client;
    }

    async list() {
      const res = await this.client.request('/providers', { method: 'GET' });
      return res.data || res;
    }
  }

  class OneAPI {
    constructor(options = {}, projectIdArg = '') {
      let apiKey = '';
      let projectId = '';
      let timeout = 30000;

      if (typeof options === 'string') {
        apiKey = options;
        projectId = projectIdArg || '';
      } else if (options && typeof options === 'object') {
        apiKey = options.apiKey || '';
        projectId = options.projectId || '';
        timeout = options.timeout || 30000;
      }

      this.apiKey = apiKey;
      this.projectId = projectId;
      this.timeout = timeout;

      // Base URL is resolved automatically by the SDK with environment and config support
      const winBase =
        typeof window !== 'undefined'
          ? (window.ONEAPI_CONFIG?.API_BASE_URL ||
             window.API_BASE_URL ||
             (window.ONEAPI_CONFIG?.BASE_URL ? `${window.ONEAPI_CONFIG.BASE_URL}/api/v1` : null) ||
             (window.ONEAPI_BASE_URL ? `${window.ONEAPI_BASE_URL}/api/v1` : null) ||
             window.__ONEAPI_BASE_URL__ ||
             '')
          : '';
      this.baseURL = (winBase || 'http://localhost:5000/api/v1').replace(/\/+$/, '');

      this.ai = new AIResource(this);
      this.weather = new WeatherResource(this);
      this.music = new MusicResource(this);
      this.news = new NewsResource(this);
      this.environment = new EnvironmentResource(this);
      this.providers = new ProvidersResource(this);
    }

    async request(path, { method = 'POST', body, headers = {} } = {}) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const reqHeaders = { ...headers };
        if (this.apiKey) {
          reqHeaders['Authorization'] = `Bearer ${this.apiKey}`;
          reqHeaders['x-api-key'] = this.apiKey;
        }

        if (this.projectId && !reqHeaders['x-project-id']) {
          reqHeaders['x-project-id'] = this.projectId;
        }

        if (body !== undefined && !reqHeaders['Content-Type']) {
          reqHeaders['Content-Type'] = 'application/json';
        }

        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        const url = `${this.baseURL}${cleanPath}`;

        const response = await fetch(url, {
          method,
          headers: reqHeaders,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
          throw new OneAPIError(data.error?.message || data.message || `Status ${response.status}`, {
            statusCode: response.status,
            code: data.error?.code,
            provider: data.provider,
          });
        }

        return data;
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  return { OneAPI, OneAPIError, ChatResponse };
});
