import type { ProviderCategory } from '../models/VaultSecret.js';

export type { ProviderCategory };

export interface ProviderConfig {
  apiKey?: string;
  metadata?: Record<string, any>;
  timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// 1. AI Domain Types
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

export interface UnifiedAiResponse {
  choices: Array<{
    index: number;
    message: UnifiedAiMessage;
    finishReason?: string;
  }>;
  model: string;
  provider: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
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
  previewUrl?: string;
  coverUrl?: string;
}

export interface UnifiedMusicResponse {
  tracks: UnifiedTrack[];
  provider: string;
  total: number;
}

// ---------------------------------------------------------------------------
// 3. Weather Domain Types
// ---------------------------------------------------------------------------
export interface UnifiedWeatherRequest {
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface UnifiedWeatherResponse {
  location: string;
  current: {
    temperature: number; // Celsius
    humidity: number; // percentage
    condition: string;
    windSpeed: number; // km/h
  };
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
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface UnifiedNewsResponse {
  articles: UnifiedNewsArticle[];
  provider: string;
  total: number;
}

// ---------------------------------------------------------------------------
// 5. Environment Domain Types
// ---------------------------------------------------------------------------
export interface UnifiedEnvironmentRequest {
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface UnifiedEnvironmentResponse {
  location: string;
  airQuality: {
    aqi?: number;
    pm25?: number; // µg/m³
    pm10?: number; // µg/m³
    status: 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' | 'Unknown';
    mainPollutant?: string;
  };
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
  execute(params: TReq, config: ProviderConfig): Promise<TRes>;
}
