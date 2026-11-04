import { Router } from 'express';
import {
  proxyAiChat,
  proxyAiUpload,
  proxyMusicSearch,
  proxyWeatherCurrent,
  proxyNewsSearch,
  proxyEnvironmentAir,
  listAvailableProviders,
  listAiModels,
} from '../controllers/proxy.controller.js';
import { authenticateGateway } from '../middleware/gatewayAuth.middleware.js';

const router = Router();

// 1. Discovery Route (List all 5 categories & registered providers)
router.get('/', (_req, res) => {
  res.status(200).json({
    name: 'OneAPI Multi-Provider Proxy Gateway',
    status: 'operational',
    basePath: '/api/v1/proxy',
    endpoints: [
      { method: 'GET', path: '/api/v1/proxy/providers', description: 'List all 5 categories and registered providers' },
      { method: 'POST', path: '/api/v1/proxy/ai/chat', description: 'AI Chat Proxy (Gemini -> Groq -> OpenRouter failover)' },
      { method: 'POST', path: '/api/v1/proxy/ai/upload', description: 'AI Document/File Upload (PRD 3.1)' },
      { method: 'GET / POST', path: '/api/v1/proxy/music/search', description: 'Music Search (Deezer -> iTunes failover)' },
      { method: 'GET / POST', path: '/api/v1/proxy/weather/current', description: 'Current Weather (Open-Meteo -> Weatherstack failover)' },
      { method: 'GET / POST', path: '/api/v1/proxy/news/search', description: 'News Search (HackerNews -> Spaceflight failover)' },
      { method: 'GET / POST', path: '/api/v1/proxy/environment/air-quality', description: 'Air Quality (OpenAQ -> Open-Meteo failover)' },
    ],
  });
});

router.get('/providers', listAvailableProviders);
router.get('/ai/models', listAiModels);
router.get('/models', listAiModels);

// 2. Gateway Proxy Routes (Requires OneAPI Developer API Key or User Auth Token)
router.post('/ai/chat', authenticateGateway, proxyAiChat);
router.post('/ai/upload', authenticateGateway, proxyAiUpload);

router.get('/ai/chat', (_req, res) => {
  res.status(200).json({
    success: true,
    endpoint: '/api/v1/proxy/ai/chat',
    method: 'POST',
    status: 'active',
    description: 'AI Chat Proxy with automatic failover (Gemini -> Groq -> OpenRouter). Requires x-api-key: <sk_live_...> or Authorization: Bearer <token>.',
    exampleBody: {
      messages: [{ role: 'user', content: 'Explain quantum computing in two sentences.' }],
      model: 'default',
      temperature: 0.7,
    },
  });
});

router.get('/music/search', authenticateGateway, proxyMusicSearch);
router.post('/music/search', authenticateGateway, proxyMusicSearch);

router.get('/weather/current', authenticateGateway, proxyWeatherCurrent);
router.post('/weather/current', authenticateGateway, proxyWeatherCurrent);
router.get('/weather/forecast', authenticateGateway, proxyWeatherCurrent);
router.post('/weather/forecast', authenticateGateway, proxyWeatherCurrent);

router.get('/news/search', authenticateGateway, proxyNewsSearch);
router.post('/news/search', authenticateGateway, proxyNewsSearch);
router.get('/news/top', authenticateGateway, proxyNewsSearch);
router.post('/news/top', authenticateGateway, proxyNewsSearch);

router.get('/environment/air-quality', authenticateGateway, proxyEnvironmentAir);
router.post('/environment/air-quality', authenticateGateway, proxyEnvironmentAir);
router.get('/environment/cities', authenticateGateway, proxyEnvironmentAir);
router.post('/environment/cities', authenticateGateway, proxyEnvironmentAir);

export const proxyRoutes = router;
