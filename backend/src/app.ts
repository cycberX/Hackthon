import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import { env } from './config/env.js';
import { checkDbHealth } from './config/db.js';
import { authRoutes } from './routes/auth.routes.js';
import { projectRoutes } from './routes/project.routes.js';
import { proxyRoutes } from './routes/proxy.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

export function createApp(): Application {
  const app = express();

  // 1. Trust proxy for reverse proxies / load balancers
  app.set('trust proxy', 1);

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
        'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-project-token, x-api-key, x-user-id, x-user-email, x-project-id'
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

  // 4. Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // 5. Compression
  app.use(compression());

  // 6. Body Parsers & Cookie Parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 7. HTTP Parameter Pollution Protection
  app.use(hpp());

  // 8. General Rate Limiter for all traffic
  app.use('/api', generalLimiter);

  // 9. Root & Health Check Endpoints
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'HackVsak Backend API',
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      routes: {
        health: '/health',
        auth: '/api/v1/auth',
        projects: '/api/v1/projects',
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

  // 10. Mount API Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/proxy', proxyRoutes);

  // 11. 404 Route Not Found Handler
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
          projects: '/api/v1/projects',
          proxy: '/api/v1/proxy',
        },
      },
    });
  });

  // 12. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
