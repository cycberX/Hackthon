import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { initProviders } from './providers/index.js';

async function bootstrap() {
  console.log('------------------------------------------------------');
  console.log('🚀 Starting OneAPI Backend Gateway Server...');
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log('------------------------------------------------------');

  // 1. Establish MongoDB connection first
  await connectDb();

  // 2. Initialize and register providers across all 5 categories
  initProviders();

  // 3. Initialize Express application
  const app = createApp();

  // 4. Start HTTP server
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`\n✅ Server is live and listening on http://0.0.0.0:${env.PORT}`);
    console.log(`📍 Health Check:        http://localhost:${env.PORT}/health`);
    console.log(`📍 Auth Routes Base:    http://localhost:${env.PORT}/api/v1/auth`);
    console.log(`📍 Vault Base:          http://localhost:${env.PORT}/api/v1/vault`);
    console.log(`📍 Routing Base:        http://localhost:${env.PORT}/api/v1/routing`);
    console.log(`📍 Dashboard Overview:  http://localhost:${env.PORT}/api/v1/dashboard/overview`);
    console.log(`📍 All Providers:       http://localhost:${env.PORT}/api/v1/providers`);
    console.log(`📍 Gateway Proxy Base:  http://localhost:${env.PORT}/api/v1/proxy`);
    console.log(`🔒 CORS Origin Policy:  All IPs allowed (${env.CORS_ORIGIN})`);
    console.log('------------------------------------------------------\n');
  });

  // 4. Graceful Shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
    server.close(async () => {
      console.log('[Server] HTTP server stopped accepting connections.');
      await disconnectDb();
      console.log('[Server] Graceful shutdown completed.');
      process.exit(0);
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.error('[Server] Forced exit due to shutdown timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal bootstrap error:', err);
  process.exit(1);
});
