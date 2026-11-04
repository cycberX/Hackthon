import type { ProviderCategory } from '../models/VaultSecret.js';

export type { ProviderCategory };

export interface ProviderConfig {
  apiKey?: string;
  metadata?: Record<string, any>;
  timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// 1. AI Domain Types (OpenAI Chat Completion Compliant)
// ---------------------------------------------------------------------------
export interface UnifiedAiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface UnifiedAiRequest {
  model?: string;
  messages: UnifiedAiMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface UnifiedAiChoice {
  index: number;
  message: UnifiedAiMessage;
  finishReason?: string;
  finish_reason?: string;
}

export interface UnifiedAiUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface UnifiedAiResponse {
  id: string;
  object: string; // 'chat.completion'
  created: number;
  choices: UnifiedAiChoice[];
  model: string;
  provider: string;
  usage?: UnifiedAiUsage;
}

// ---------------------------------------------------------------------------
// 2. Music Domain Types
// ---------------------------------------------------------------------------
export interface UnifiedMusicRequest {
  query: string;
  limit?: number;
}

export interface UnifiedTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  durationFormatted: string; // e.g. "3:45"
  previewUrl?: string;
  coverUrl?: string;
  albumCover?: string;
  provider?: string;
}

export interface UnifiedMusicResponse {
  query: string;
  total: number;
  tracks: UnifiedTrack[];
  provider: string;
}

// ---------------------------------------------------------------------------
// 3. Weather Domain Types
// ---------------------------------------------------------------------------
export interface UnifiedWeatherRequest {
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface UnifiedWeatherCoordinates {
  latitude: number;
  longitude: number;
  lat?: number;
  lon?: number;
}

export interface UnifiedWeatherCurrent {
  temperature: number; // Celsius
  humidity: number; // percentage
  condition: string;
  windSpeed: number; // km/h
  pressure?: number; // hPa
}

export interface UnifiedWeatherResponse {
  location: string;
  coordinates?: UnifiedWeatherCoordinates;
  current: UnifiedWeatherCurrent;
  provider: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// 4. News Domain Types
// ---------------------------------------------------------------------------
export interface UnifiedNewsRequest {
  query?: string;
  category?: string;
  limit?: number;
}

export interface UnifiedNewsArticle {
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

export interface UnifiedNewsResponse {
  query: string;
  total: number;
  articles: UnifiedNewsArticle[];
  provider: string;
}

// ---------------------------------------------------------------------------
// 5. Environment Domain Types
// ---------------------------------------------------------------------------
export interface UnifiedEnvironmentRequest {
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface UnifiedEnvironmentCoordinates {
  latitude: number;
  longitude: number;
  lat?: number;
  lon?: number;
}

export interface UnifiedAirQuality {
  aqi: number;
  status: 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' | 'Unknown';
  pm25?: number; // µg/m³
  pm10?: number; // µg/m³
  o3?: number; // µg/m³
  no2?: number; // µg/m³
  so2?: number; // µg/m³
  co?: number; // µg/m³
  mainPollutant?: string;
}

export interface UnifiedEnvironmentResponse {
  location: string;
  coordinates?: UnifiedEnvironmentCoordinates;
  airQuality: UnifiedAirQuality;
  provider: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Generic Provider Adapter Interface
// ---------------------------------------------------------------------------
export interface IProviderAdapter<TReq = any, TRes = any> {
  id: string;
  category: ProviderCategory;
  displayName: string;
  isKeyRequired: boolean;
  supportedModels?: string[];
  defaultModel?: string;
  execute(params: TReq, config: ProviderConfig): Promise<TRes>;
}
