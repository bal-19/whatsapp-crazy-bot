import { Router } from 'express';
import { z } from 'zod';
import type { BotConfig, LoginRequest, TestPromptRequest } from '@whatsapp-bot/shared';
import { appDb } from '../db/database.js';
import { requireAuth, signToken, verifyLogin } from '../auth/jwt.js';
import { botManager } from '../bot/bot-manager.js';
import { getQueueSize } from '../ai/rate-limiter.js';
import { generateBotReply } from '../ai/ai-service.js';

export function createApiRouter(): Router {
  const router = Router();

  router.post('/auth/login', async (req, res) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ message: 'Invalid login payload' });
      return;
    }

    const ok = await verifyLogin(body.data.username, body.data.password);
    if (!ok) {
      res.status(401).json({ message: 'Username atau password salah' });
      return;
    }

    res.json({ token: signToken(body.data.username) });
  });

  router.use(requireAuth);

  router.get('/status', (_req, res) => {
    res.json({
      status: botManager.getStatus(),
      uptime_seconds: botManager.getUptimeSeconds(),
      total_messages_today: appDb.getTotalMessagesToday(),
      queue_size: getQueueSize()
    });
  });

  router.get('/conversations', (req, res) => {
    const page = numberQuery(req.query.page, 1);
    const limit = numberQuery(req.query.limit, 20);
    res.json(appDb.listConversations(page, limit));
  });

  router.get('/conversations/:contactId', (req, res) => {
    const detail = appDb.getConversation(req.params.contactId);
    if (!detail) {
      res.status(404).json({ message: 'Conversation not found' });
      return;
    }
    res.json(detail);
  });

  router.delete('/conversations/:contactId/history', (req, res) => {
    appDb.clearConversation(req.params.contactId);
    res.status(204).send();
  });

  router.get('/config', (_req, res) => {
    res.json(appDb.getConfig());
  });

  router.put('/config', (req, res) => {
    const body = configSchema.partial().safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ message: 'Invalid config payload', issues: body.error.issues });
      return;
    }
    res.json(appDb.updateConfig(body.data));
  });

  router.post('/test-prompt', async (req, res) => {
    const body = testPromptSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ message: 'Invalid test prompt payload', issues: body.error.issues });
      return;
    }

    const baseConfig = appDb.getConfig();
    const result = await generateBotReply({
      contactId: 'dashboard-test',
      contactName: 'Admin Dashboard',
      message: body.data.message,
      config: { ...baseConfig, ...body.data.config }
    });

    res.json({ reply: result.reply, latency_ms: result.latencyMs });
  });

  router.get('/analytics/summary', (_req, res) => {
    res.json(appDb.getAnalyticsSummary());
  });

  router.get('/logs', (req, res) => {
    const level = typeof req.query.level === 'string' ? req.query.level : undefined;
    const limit = numberQuery(req.query.limit, 100);
    res.json({ data: appDb.listLogs(level, limit) });
  });

  router.post('/bot/restart', async (_req, res) => {
    await botManager.restart();
    res.status(202).json({ status: botManager.getStatus() });
  });

  return router;
}

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
}) satisfies z.ZodType<LoginRequest>;

const configSchema = z.object({
  system_prompt: z.string().min(10).max(4000),
  bot_name: z.string().min(1).max(80),
  is_active: z.boolean(),
  ignore_groups: z.boolean(),
  tone_style: z.enum(['pedas', 'wholesome', 'absurd', 'custom'])
}) satisfies z.ZodType<BotConfig>;

const testPromptSchema = z.object({
  message: z.string().min(1).max(2000),
  config: configSchema.partial().optional()
}) satisfies z.ZodType<TestPromptRequest>;

function numberQuery(value: unknown, fallback: number): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
