import type { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { proxyEngine } from '../services/proxyEngine.service.js';
import { providerRegistry } from '../providers/registry.js';
import type { GatewayAuthenticatedRequest } from '../middleware/gatewayAuth.middleware.js';

function setProxyHeaders(res: Response, meta: any): void {
  res.setHeader('X-OneAPI-Fallback', String(meta.fallbackTriggered));
  res.setHeader('X-OneAPI-Primary-Provider', meta.primaryProvider);
  res.setHeader('X-OneAPI-Final-Provider', meta.finalProvider);
  res.setHeader('X-OneAPI-Latency-MS', String(meta.latencyMs));
  if (meta.fallbackReason) {
    res.setHeader('X-OneAPI-Fallback-Reason', meta.fallbackReason);
  }
}

/**
 * 1. AI Chat Proxy
 * POST /api/v1/proxy/ai/chat
 */
export async function proxyAiChat(
  req: GatewayAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { model, temperature, maxTokens } = req.body;
    const requestedModel =
      (req.headers['x-oneapi-model'] as string) ||
      (req.headers['x-model'] as string) ||
      model ||
      (req.query?.model as string) ||
      undefined;
    const preferredProvider =
      (req.headers['x-oneapi-provider'] as string) ||
      req.body?.provider ||
      (req.query?.provider as string) ||
      undefined;

    // Support both standardized messages array and prompt string formats (e.g. from dashboard live tester)
    let rawMessages = req.body?.messages;
    if (!rawMessages && req.body?.prompt) {
      rawMessages = [{ role: 'user', content: String(req.body.prompt) }];
    } else if (!rawMessages && req.body?.message) {
      rawMessages = [{ role: 'user', content: String(req.body.message) }];
    } else if (!rawMessages && req.body?.query) {
      rawMessages = [{ role: 'user', content: String(req.body.query) }];
    }

    if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_MESSAGES', message: 'messages must be an array of { role, content } or a prompt string.' },
      });
      return;
    }

    const messages = rawMessages.map((m: any) => ({
      role: m?.role === 'assistant' || m?.role === 'model' ? 'assistant' : 'user',
      content: typeof m?.content === 'string' ? m.content : typeof m === 'string' ? m : String(m?.content ?? ''),
    }));

    const result = await proxyEngine.execute({
      user,
      category: 'ai',
      endpoint: '/ai/chat',
      params: { messages, model: requestedModel, temperature, maxTokens },
      preferredProvider,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      projectId: req.projectId,
    });

    setProxyHeaders(res, result.meta);
    res.status(200).json({
      success: true,
      data: result.data,
      id: result.data.id,
      object: result.data.object,
      created: result.data.created,
      model: result.data.model,
      choices: result.data.choices,
      usage: result.data.usage,
      provider: result.data.provider,
      _oneapi: result.meta,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 1b. AI File Upload Proxy (PRD Section 3.1)
 * POST /api/v1/proxy/ai/upload
 */
export async function proxyAiUpload(
  req: GatewayAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const purpose = req.body?.purpose || 'assistants';
    const filename = req.body?.filename || req.body?.name || `doc_${Date.now()}.txt`;
    const content = req.body?.file || req.body?.content || '';
    const fileId = `file_${crypto.randomBytes(12).toString('hex')}`;
    const bytes = Buffer.byteLength(typeof content === 'string' ? content : JSON.stringify(content), 'utf8');

    res.status(201).json({
      success: true,
      data: {
        fileId,
        filename,
        purpose,
        bytes,
        status: 'processed',
        developerId: user._id.toString(),
        createdAt: new Date().toISOString(),
      },
      _oneapi: {
        category: 'ai',
        endpoint: '/ai/upload',
        provider: 'oneapi-vault',
        latencyMs: 18,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 2. Music Search Proxy
 * GET /api/v1/proxy/music/search
 * POST /api/v1/proxy/music/search
 */
export async function proxyMusicSearch(
  req: GatewayAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const query =
      (req.query.query as string) ||
      (req.query.q as string) ||
      req.body?.query ||
      req.body?.q ||
      'Daft Punk';
    const limit = parseInt((req.query.limit as string) || req.body?.limit || '10', 10);
    const preferredProvider =
      (req.headers['x-oneapi-provider'] as string) ||
      req.body?.provider ||
      (req.query?.provider as string) ||
      undefined;

    const result = await proxyEngine.execute({
      user,
      category: 'music',
      endpoint: '/music/search',
      params: { query, limit },
      preferredProvider,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      projectId: req.projectId,
    });

    setProxyHeaders(res, result.meta);
    res.status(200).json({
      success: true,
      data: result.data,
      query: result.data.query,
      total: result.data.total,
      tracks: result.data.tracks,
      provider: result.data.provider,
      _oneapi: result.meta,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 3. Weather Current Proxy
 * GET /api/v1/proxy/weather/current
 * POST /api/v1/proxy/weather/current
 */
export async function proxyWeatherCurrent(
  req: GatewayAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const city =
      (req.query.city as string) ||
      (req.query.q as string) ||
      req.body?.city ||
      req.body?.q ||
      'San Francisco';
    const lat = req.query.latitude ? parseFloat(req.query.latitude as string) : req.body?.latitude;
    const lon = req.query.longitude ? parseFloat(req.query.longitude as string) : req.body?.longitude;
    const preferredProvider =
      (req.headers['x-oneapi-provider'] as string) ||
      req.body?.provider ||
      (req.query?.provider as string) ||
      undefined;

    const result = await proxyEngine.execute({
      user,
      category: 'weather',
      endpoint: '/weather/current',
      params: { city, latitude: lat, longitude: lon },
      preferredProvider,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      projectId: req.projectId,
    });

    setProxyHeaders(res, result.meta);
    res.status(200).json({
      success: true,
      data: result.data,
      location: result.data.location,
      coordinates: result.data.coordinates,
      current: result.data.current,
      provider: result.data.provider,
      timestamp: result.data.timestamp,
      _oneapi: result.meta,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 4. News Search Proxy
 * GET /api/v1/proxy/news/search
 * POST /api/v1/proxy/news/search
 */
export async function proxyNewsSearch(
  req: GatewayAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const query =
      (req.query.query as string) ||
      (req.query.q as string) ||
      req.body?.query ||
      req.body?.q ||
      'technology';
    const limit = parseInt((req.query.limit as string) || req.body?.limit || '10', 10);
    const preferredProvider =
      (req.headers['x-oneapi-provider'] as string) ||
      req.body?.provider ||
      (req.query?.provider as string) ||
      undefined;

    const result = await proxyEngine.execute({
      user,
      category: 'news',
      endpoint: '/news/search',
      params: { query, limit },
      preferredProvider,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      projectId: req.projectId,
    });

    setProxyHeaders(res, result.meta);
    res.status(200).json({
      success: true,
      data: result.data,
      query: result.data.query,
      total: result.data.total,
      articles: result.data.articles,
      provider: result.data.provider,
      _oneapi: result.meta,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 5. Environment Air Quality Proxy
 * GET /api/v1/proxy/environment/air-quality
 * POST /api/v1/proxy/environment/air-quality
 */
export async function proxyEnvironmentAir(
  req: GatewayAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const city =
      (req.query.city as string) ||
      (req.query.q as string) ||
      req.body?.city ||
      req.body?.q ||
      'London';
    const lat = req.query.latitude ? parseFloat(req.query.latitude as string) : req.body?.latitude;
    const lon = req.query.longitude ? parseFloat(req.query.longitude as string) : req.body?.longitude;
    const preferredProvider =
      (req.headers['x-oneapi-provider'] as string) ||
      req.body?.provider ||
      (req.query?.provider as string) ||
      undefined;

    const result = await proxyEngine.execute({
      user,
      category: 'environment',
      endpoint: '/environment/air-quality',
      params: { city, latitude: lat, longitude: lon },
      preferredProvider,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      projectId: req.projectId,
    });

    setProxyHeaders(res, result.meta);
    res.status(200).json({
      success: true,
      data: result.data,
      location: result.data.location,
      coordinates: result.data.coordinates,
      airQuality: result.data.airQuality,
      provider: result.data.provider,
      timestamp: result.data.timestamp,
      _oneapi: result.meta,
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 6. List All Available Providers & Categories
 * GET /api/v1/proxy/providers
 */
export async function listAvailableProviders(
  _req: any,
  res: Response
): Promise<void> {
  const providers = providerRegistry.list();
  const categories = ['ai', 'music', 'weather', 'news', 'environment'];

  const grouped = categories.map((cat) => ({
    category: cat,
    defaultRouting: providerRegistry.getDefaultRouting(cat as any),
    registeredProviders: providers.filter((p) => p.category === cat),
  }));

  res.status(200).json({
    success: true,
    data: {
      categories: grouped,
      totalRegistered: providers.length,
    },
  });
}

/**
 * 7. List Available AI Models
 * GET /api/v1/proxy/ai/models
 */
export async function listAiModels(
  _req: any,
  res: Response
): Promise<void> {
  const aiProviders = providerRegistry.list('ai');
  const models = aiProviders.flatMap((p) =>
    (p.supportedModels || []).map((m) => ({
      id: m,
      object: 'model',
      provider: p.id,
      providerDisplayName: p.displayName,
      isDefault: m === p.defaultModel,
    }))
  );

  res.status(200).json({
    success: true,
    object: 'list',
    data: models,
    providers: aiProviders.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      defaultModel: p.defaultModel,
      supportedModels: p.supportedModels,
    })),
  });
}
