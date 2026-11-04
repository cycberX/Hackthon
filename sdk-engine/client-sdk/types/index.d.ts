export interface OneAPIOptions {
  apiKey?: string;
  projectId?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

export interface TelemetryMeta {
  category?: string;
  primaryProvider?: string;
  finalProvider?: string;
  fallbackTriggered: boolean;
  fallbackReason?: string;
  latencyMs: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  messages?: ChatMessage[];
  prompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: 'gemini' | 'groq' | 'openrouter' | string;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finishReason?: string;
  finish_reason?: string;
}

export interface ChatUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export declare class ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  provider: string;
  primaryProvider: string;
  fallbackTriggered: boolean;
  fallbackReason: string | null;
  latencyMs: number;
  choices: ChatChoice[];
  usage: ChatUsage;
  raw: any;

  readonly content: string;
  readonly message: ChatMessage | null;
  readonly finishReason: string;
  readonly usedFallback: boolean;
  readonly providerUsed: string;
  readonly telemetry: TelemetryMeta;

  toJSON(): any;
}

export interface FileUploadOptions {
  file: string | Buffer;
  filename?: string;
  purpose?: string;
}

export interface WeatherOptions {
  city?: string;
  latitude?: number;
  longitude?: number;
  provider?: 'openmeteo' | 'weatherstack' | string;
}

export interface WeatherResult {
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    lat?: number;
    lon?: number;
  };
  current: {
    temperature: number;
    humidity: number;
    condition: string;
    windSpeed: number;
    pressure?: number;
  };
  provider: string;
  timestamp: string;
  _oneapi?: TelemetryMeta;
  raw: any;
}

export interface MusicSearchOptions {
  query?: string;
  limit?: number;
  provider?: 'deezer' | 'itunes' | string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  durationFormatted: string;
  previewUrl?: string;
  coverUrl?: string;
  albumCover?: string;
  provider?: string;
}

export interface MusicResult {
  query: string;
  total: number;
  tracks: MusicTrack[];
  provider: string;
  _oneapi?: TelemetryMeta;
  raw: any;
}

export interface NewsSearchOptions {
  query?: string;
  limit?: number;
  category?: string;
  provider?: 'hackernews' | 'spaceflight' | string;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  snippet?: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: string;
  imageUrl?: string;
  provider?: string;
}

export interface NewsResult {
  query: string;
  total: number;
  articles: NewsArticle[];
  provider: string;
  _oneapi?: TelemetryMeta;
  raw: any;
}

export interface EnvironmentOptions {
  city?: string;
  latitude?: number;
  longitude?: number;
  provider?: 'openaq' | 'openmeteo_air' | string;
}

export interface EnvironmentResult {
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    lat?: number;
    lon?: number;
  };
  airQuality: {
    aqi: number;
    status: 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' | 'Unknown';
    pm25?: number;
    pm10?: number;
    o3?: number;
    no2?: number;
    so2?: number;
    co?: number;
    mainPollutant?: string;
  };
  provider: string;
  timestamp: string;
  _oneapi?: TelemetryMeta;
  raw: any;
}

export interface ProviderItem {
  id: string;
  category: string;
  displayName: string;
  isKeyRequired: boolean;
}

export interface ProvidersListResult {
  categories: Array<{
    category: string;
    defaultRouting: { primary: string; fallback: string };
    registeredProviders: ProviderItem[];
  }>;
  totalRegistered: number;
}

export declare class OneAPIError extends Error {
  statusCode: number | null;
  code: string;
  requestId?: string;
  provider?: string;
  constructor(message: string, options?: any);
}

export declare class AIResource {
  constructor(client: OneAPI);
  chat(options: ChatOptions): Promise<ChatResponse>;
  upload_file(options: FileUploadOptions): Promise<any>;
}

export declare class WeatherResource {
  constructor(client: OneAPI);
  current(options?: WeatherOptions): Promise<WeatherResult>;
}

export declare class MusicResource {
  constructor(client: OneAPI);
  search(options?: MusicSearchOptions): Promise<MusicResult>;
}

export declare class NewsResource {
  constructor(client: OneAPI);
  search(options?: NewsSearchOptions): Promise<NewsResult>;
}

export declare class EnvironmentResource {
  constructor(client: OneAPI);
  airQuality(options?: EnvironmentOptions): Promise<EnvironmentResult>;
}

export declare class ProvidersResource {
  constructor(client: OneAPI);
  list(): Promise<ProvidersListResult>;
}

export declare class HealthResource {
  constructor(client: OneAPI);
  check(): Promise<any>;
}

export declare class OneAPI {
  apiKey: string;
  projectId?: string;
  baseURL: string;
  timeout: number;
  ai: AIResource;
  weather: WeatherResource;
  music: MusicResource;
  news: NewsResource;
  environment: EnvironmentResource;
  providers: ProvidersResource;
  health: HealthResource;

  constructor(options?: OneAPIOptions | string, projectId?: string);
  request(path: string, options?: any): Promise<any>;
}
