export type Category = 'ai' | 'music' | 'weather' | 'news' | 'environment';

export interface ProviderCatalogItem {
  id: string;
  name: string;
  category: Category;
  requiresKey: boolean;
  tagline: string;
  docUrl: string;
  iconUrl: string;
  fallbackIcon: string;
  supportedModels?: string[];
  defaultModel?: string;
}

export const PROVIDERS_CATALOG: ProviderCatalogItem[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    category: 'ai',
    requiresKey: true,
    tagline: 'High-speed multimodal AI generation with sub-second response times and 1M+ token context.',
    docUrl: 'https://ai.google.dev/gemini-api/docs',
    iconUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    fallbackIcon: '🧠',
    defaultModel: 'gemini-2.5-flash',
    supportedModels: [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3-flash',
      'gemini-3-pro',
    ],
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    category: 'ai',
    requiresKey: true,
    tagline: 'Ultra-low latency LPU inference engine for lightning-fast AI reasoning.',
    docUrl: 'https://console.groq.com/docs/quickstart',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/groq.svg',
    fallbackIcon: '⚡',
    defaultModel: 'llama-3.3-70b-versatile',
    supportedModels: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'llama-3.2-11b-vision-preview',
      'llama-3.2-3b-preview',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    category: 'ai',
    requiresKey: true,
    tagline: 'Access 200+ top LLMs (Claude, GPT-4o, Llama 3.3, DeepSeek) through one unified key.',
    docUrl: 'https://openrouter.ai/docs',
    iconUrl: 'https://openrouter.ai/favicon.ico',
    fallbackIcon: '🌐',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    supportedModels: [
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.5-flash',
      'deepseek/deepseek-chat',
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
    ],
  },
  {
    id: 'deezer',
    name: 'Deezer Music API',
    category: 'music',
    requiresKey: false,
    tagline: 'Global music repository with millions of artists, tracks, and 30-second audio previews.',
    docUrl: 'https://developers.deezer.com/api',
    iconUrl: 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/deezer.svg',
    fallbackIcon: '🎵',
  },
  {
    id: 'itunes',
    name: 'Apple iTunes Search API',
    category: 'music',
    requiresKey: false,
    tagline: 'Apple worldwide media repository spanning songs, albums, and high-fidelity preview audio.',
    docUrl: 'https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/Searching.html',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg',
    fallbackIcon: '🍎',
  },
  {
    id: 'openmeteo',
    name: 'Open-Meteo Weather',
    category: 'weather',
    requiresKey: false,
    tagline: 'High-resolution open meteorological forecast models without API key requirements.',
    docUrl: 'https://open-meteo.com/en/docs',
    iconUrl: 'https://open-meteo.com/images/logo.svg',
    fallbackIcon: '☀️',
  },
  {
    id: 'weatherstack',
    name: 'Weatherstack (APILayer)',
    category: 'weather',
    requiresKey: true,
    tagline: 'Production-ready real-time weather conditions for 2.6M+ cities worldwide.',
    docUrl: 'https://weatherstack.com/documentation',
    iconUrl: 'https://assets.apilayer.com/weatherstack/icon.png',
    fallbackIcon: '🌤️',
  },
  {
    id: 'hackernews',
    name: 'HackerNews Algolia API',
    category: 'news',
    requiresKey: false,
    tagline: 'Real-time trending tech headlines, top algorithmic submissions, and dev discussions.',
    docUrl: 'https://github.com/HackerNews/API',
    iconUrl: 'https://news.ycombinator.com/y18.svg',
    fallbackIcon: '📰',
  },
  {
    id: 'spaceflight',
    name: 'Spaceflight News API (v4)',
    category: 'news',
    requiresKey: false,
    tagline: 'Curated space exploration, satellite launch manifests, and aerospace reports.',
    docUrl: 'https://api.spaceflightnewsapi.net/v4/docs/',
    iconUrl: 'https://spaceflightnewsapi.net/favicon.ico',
    fallbackIcon: '🚀',
  },
  {
    id: 'openaq',
    name: 'OpenAQ Global Air Quality (v3)',
    category: 'environment',
    requiresKey: true,
    tagline: 'Worldwide reference-grade ambient air quality monitoring and PM2.5 / PM10 sensor data.',
    docUrl: 'https://docs.openaq.org',
    iconUrl: 'https://openaq.org/assets/graphics/content/logo.svg',
    fallbackIcon: '🌱',
  },
  {
    id: 'openmeteo_air',
    name: 'Open-Meteo Atmospheric Air',
    category: 'environment',
    requiresKey: false,
    tagline: 'Atmospheric pollutant dispersion modeling including US AQI, European AQI, NO2, and PM2.5.',
    docUrl: 'https://open-meteo.com/en/docs/air-quality-api',
    iconUrl: 'https://open-meteo.com/images/logo.svg',
    fallbackIcon: '💨',
  },
];
