import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import { env } from './config/env.js';
import { checkDbHealth } from './config/db.js';
import { authRoutes } from './routes/auth.routes.js';
import { vaultRoutes } from './routes/vault.routes.js';
import { routingRoutes } from './routes/routing.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { projectRoutes } from './routes/project.routes.js';
import { proxyRoutes } from './routes/proxy.routes.js';
import { listAvailableProviders } from './controllers/proxy.controller.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

export function createApp(): Application {
  const app = express();

  // 1. Trust proxy for reverse proxies / load balancers
  app.set('trust proxy', 1);

  // Disable etag generation completely to eliminate 304 Not Modified responses on dynamic data
  app.set('etag', false);

  // 1.5. Prevent 304 Not Modified & HTTP Caching on all API routes
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    // Strip conditional request headers so Express never evaluates 304 freshness
    delete req.headers['if-none-match'];
    delete req.headers['if-modified-since'];

    // Enforce immediate cache invalidation across all browsers and proxies
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    next();
  });

  // 2. Universal CORS & Preflight Handler: Permits ANY origin, method, and header (zero CORS errors)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');

    const requestedHeaders = req.headers['access-control-request-headers'];
    if (requestedHeaders) {
      res.setHeader('Access-Control-Allow-Headers', requestedHeaders);
    } else {
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-api-key, x-oneapi-provider, x-user-id, x-user-email'
      );
    }

    res.setHeader(
      'Access-Control-Expose-Headers',
      'X-OneAPI-Fallback, X-OneAPI-Fallback-Reason, X-OneAPI-Primary-Provider, X-OneAPI-Final-Provider, X-OneAPI-Latency-MS, Authorization'
    );
    res.setHeader('Access-Control-Max-Age', '86400');

    // Instantly satisfy OPTIONS preflight requests with 204 No Content
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  });

  // 3. Security Headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: false,
    })
  );

  // 4. Standard cors() middleware for complete compatibility
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      exposedHeaders: [
        'X-OneAPI-Fallback',
        'X-OneAPI-Fallback-Reason',
        'X-OneAPI-Primary-Provider',
        'X-OneAPI-Final-Provider',
        'X-OneAPI-Latency-MS',
        'Authorization',
      ],
    })
  );

  // 5. Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // 6. Compression
  app.use(compression());

  // 7. Body Parsers (Accepts JSON regardless of Content-Type header - zero required content-type)
  app.use(express.json({ limit: '10mb', type: ['application/json', 'text/*', '*/*'] }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 8. HTTP Parameter Pollution Protection
  app.use(hpp());

  // 9. General Rate Limiter for all traffic
  app.use('/api', generalLimiter);

  // 10. Root & Health Check Endpoints
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'OneAPI Gateway Backend API',
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      routes: {
        health: '/health',
        auth: '/api/v1/auth',
        vault: '/api/v1/vault',
        routing: '/api/v1/routing',
        dashboard: '/api/v1/dashboard/overview',
        providers: '/api/v1/providers',
        proxy: '/api/v1/proxy',
      },
    });
  });

  app.get('/health', (_req: Request, res: Response) => {
    const dbStatus = checkDbHealth();
    const isHealthy = dbStatus.status === 'connected';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      environment: env.NODE_ENV,
    });
  });

  // Dedicated Route: Return all available providers across 5 categories
  app.get('/api/v1/providers', listAvailableProviders);

  // Serve interactive client examples statically
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use('/example', express.static(path.resolve(__dirname, '../../example')));

  // 11. Mount API Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/vault', vaultRoutes);
  app.use('/api/v1/routing', routingRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/proxy', proxyRoutes);

  // 12. 404 Route Not Found Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Cannot ${req.method} ${req.originalUrl}. Route does not exist on this server.`,
        availableEndpoints: {
          root: '/',
          health: '/health',
          auth: '/api/v1/auth',
          vault: '/api/v1/vault',
          routing: '/api/v1/routing',
          dashboard: '/api/v1/dashboard/overview',
          providers: '/api/v1/providers',
          proxy: '/api/v1/proxy',
        },
      },
    });
  });

  // 13. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
