import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { createApiRouter } from './routes.js';

export function createApp(): express.Express {
  const app = express();

  app.use(
    cors({
      origin: env.DASHBOARD_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/v1', createApiRouter());

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ message });
  });

  return app;
}
