import type { Request, Response } from 'express';
import { createApp } from '../src/app.js';
import { connectDb } from '../src/config/db.js';
import { initProviders } from '../src/providers/index.js';

let isReady = false;
let appInstance: any = null;

async function prepare() {
  if (!isReady) {
    try {
      await connectDb();
      initProviders();
      appInstance = createApp();
      isReady = true;
    } catch (err) {
      console.error('[Vercel Serverless] Failed to initialize backend:', err);
      throw err;
    }
  }
  return appInstance;
}

export default async function handler(req: Request, res: Response) {
  const app = await prepare();
  return app(req, res);
}
