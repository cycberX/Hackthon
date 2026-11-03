import { Router } from 'express';
import {
  proxyAiChat,
  proxyAiUpload,
  proxyMusicSearch,
  proxyWeatherCurrent,
  proxyNewsSearch,
  proxyEnvironmentAir,
  listAvailableProviders,
} from '../controllers/proxy.controller.js';
import { authenticateProject } from '../middleware/projectAuth.middleware.js';

const router = Router();

// 1. Discovery Route (List all 5 categories & registered providers)
router.get('/', (_req, res) => {
  res.status(200).json({
    name: 'OneAPI Multi-Provider Proxy Gateway',
    status: 'operational',
    basePath: '/api/v1/proxy',
    endpoints: [
      { method: 'GET', path: '/api/v1/proxy/providers', description: 'List all 5 categories and registered providers' },
      { method: 'POST', path: '/api/v1/proxy/ai/chat', description: 'AI Chat (Gemini -> Groq -> OpenRouter failover)' },
      { method: 'POST', path: '/api/v1/proxy/ai/upload', description: 'AI Document/File Upload (PRD 3.1)' },
      { method: 'GET / POST', path: '/api/v1/proxy/music/search', description: 'Music Search (Deezer -> iTunes failover)' },
      { method: 'GET / POST', path: '/api/v1/proxy/weather/current', description: 'Current Weather (Open-Meteo -> Weatherstack failover)' },
      { method: 'GET / POST', path: '/api/v1/proxy/news/search', description: 'News Search (HackerNews -> Spaceflight failover)' },
      { method: 'GET / POST', path: '/api/v1/proxy/environment/air-quality', description: 'Air Quality (OpenAQ -> Open-Meteo failover)' },
    ],
  });
});

router.get('/providers', listAvailableProviders);

// 2. Gateway Proxy Routes (Requires OneAPI Project Token)
router.post('/ai/chat', authenticateProject, proxyAiChat);
router.post('/ai/upload', authenticateProject, proxyAiUpload);
router.get('/ai/chat', (_req, res) => {
  res.status(200).json({
    success: true,
    endpoint: '/api/v1/proxy/ai/chat',
    method: 'POST',
    status: 'active',
    description: 'AI Chat Proxy with automatic failover (Gemini -> Groq). Requires Authorization: Bearer <oneapi_dev_token>.',
    exampleBody: {
      messages: [{ role: 'user', content: 'Explain quantum computing in two sentences.' }],
      model: 'default',
      temperature: 0.7,
    },
  });
});

router.get('/music/search', authenticateProject, proxyMusicSearch);
router.post('/music/search', authenticateProject, proxyMusicSearch);

router.get('/weather/current', authenticateProject, proxyWeatherCurrent);
router.post('/weather/current', authenticateProject, proxyWeatherCurrent);

router.get('/news/search', authenticateProject, proxyNewsSearch);
router.post('/news/search', authenticateProject, proxyNewsSearch);

router.get('/environment/air-quality', authenticateProject, proxyEnvironmentAir);
router.post('/environment/air-quality', authenticateProject, proxyEnvironmentAir);

export const proxyRoutes = router;
