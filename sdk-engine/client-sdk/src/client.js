import { AIResource } from './resources/ai.js';
import { WeatherResource } from './resources/weather.js';
import { MusicResource } from './resources/music.js';
import { NewsResource } from './resources/news.js';
import { EnvironmentResource } from './resources/environment.js';
import { ProvidersResource } from './resources/providers.js';
import { HealthResource } from './resources/health.js';
import { OneAPIError } from './errors.js';

export class OneAPI {
  /**
   * Initializes the OneAPI Gateway client SDK.
   * Developers only need to provide their API Key and Project ID.
   * Gateway routing and baseURL are handled automatically.
   *
   * @param {Object|string} [options] API key or options object
   * @param {string} [options.apiKey] OneAPI developer key (sk_live_...)
   * @param {string} [options.projectId] Project identifier
   * @param {number} [options.timeout=30000] Milliseconds before request times out
   * @param {Record<string, string>} [options.defaultHeaders] Custom headers applied to every request
   * @param {string} [projectIdArg] Optional project ID if first argument was apiKey string
   */
  constructor(options = {}, projectIdArg = '') {
    let apiKey = '';
    let projectId = '';
    let timeout = 30000;
    let defaultHeaders = {};

    if (typeof options === 'string') {
      apiKey = options;
      projectId = projectIdArg || '';
    } else if (options && typeof options === 'object') {
      apiKey = options.apiKey || (typeof process !== 'undefined' ? process.env?.ONEAPI_API_KEY : '');
      projectId = options.projectId || (typeof process !== 'undefined' ? process.env?.ONEAPI_PROJECT_ID : '');
      timeout = options.timeout || 30000;
      defaultHeaders = options.defaultHeaders || {};
    }

    this.apiKey = apiKey || '';
    this.projectId = projectId || '';
    this.timeout = timeout;
    this.defaultHeaders = defaultHeaders;

    // Base URL is resolved automatically by the SDK without manual configuration
    const envBase = typeof process !== 'undefined' ? process.env?.ONEAPI_BASE_URL : undefined;
    const winBase = typeof window !== 'undefined' ? (window.__ONEAPI_BASE_URL__ || '') : '';
    this.baseURL = (envBase || winBase || 'http://localhost:5000/api/v1').replace(/\/+$/, '');

    // Domain Resources
    this.ai = new AIResource(this);
    this.weather = new WeatherResource(this);
    this.music = new MusicResource(this);
    this.news = new NewsResource(this);
    this.environment = new EnvironmentResource(this);
    this.providers = new ProvidersResource(this);
    this.health = new HealthResource(this);
  }

  /**
   * Universal HTTP request dispatcher with failover telemetry capture
   *
   * @param {string} path Endpoint path (e.g. '/proxy/ai/chat')
   * @param {Object} [options]
   * @param {string} [options.method='POST']
   * @param {any} [options.body]
   * @param {Record<string, string>} [options.headers]
   * @returns {Promise<any>}
   */
  async request(path, { method = 'POST', body, headers = {} } = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const requestHeaders = {
        ...this.defaultHeaders,
        ...headers,
      };

      // Inject authentication credentials if provided
      if (this.apiKey) {
        requestHeaders['Authorization'] = `Bearer ${this.apiKey}`;
        requestHeaders['x-api-key'] = this.apiKey;
      }

      // Inject project identifier if bound
      if (this.projectId && !requestHeaders['x-project-id']) {
        requestHeaders['x-project-id'] = this.projectId;
      }

      if (body !== undefined && !requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json';
      }

      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const url = `${this.baseURL}${cleanPath}`;

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";

      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      const responseData =
        data && typeof data === "object" ? data : {};

      // Extract telemetry headers if present
      const meta = data._oneapi || {
        fallbackTriggered: response.headers.get('X-OneAPI-Fallback') === 'true',
        fallbackReason: response.headers.get('X-OneAPI-Fallback-Reason') || undefined,
        primaryProvider: response.headers.get('X-OneAPI-Primary-Provider') || undefined,
        finalProvider: response.headers.get('X-OneAPI-Final-Provider') || undefined,
        latencyMs: parseInt(response.headers.get('X-OneAPI-Latency-MS') || '0', 10),
      };

      if (!response.ok || data.success === false) {
        const errorMsg = data.error?.message || data.message || `OneAPI request failed with status ${response.status}`;
        throw new OneAPIError(errorMsg, {
          statusCode: response.status,
          code: data.error?.code || data.code || 'GATEWAY_ERROR',
          provider: meta.finalProvider || data.provider,
          requestId: response.headers.get('x-request-id') || undefined,
        });
      }

      // Attach telemetry to response
      data._oneapi = meta;
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new OneAPIError(`Request timed out after ${this.timeout}ms`, {
          code: 'TIMEOUT',
          statusCode: 504,
        });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
