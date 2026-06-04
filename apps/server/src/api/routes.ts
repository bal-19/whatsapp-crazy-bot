import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import type {
    BotConfig,
    CreateContactRequest,
    LoginRequest,
    TestPromptRequest,
    UpdateContactRequest,
} from "@whatsapp-bot/shared";
import { appDb } from "../db/database.js";
import { requireAuth, signToken, verifyLogin } from "../auth/jwt.js";
import { updateLastLoginAt } from "../services/adminUserService.js";
import { botManager } from "../bot/bot-manager.js";
import { getQueueSize } from "../ai/rate-limiter.js";
import { generateBotReply } from "../ai/ai-service.js";
import { getReplyPreview } from "../ai/reply-types.js";
import { memory } from "../ai/conversation-memory.js";
import { emitAnalyticsUpdate } from "../realtime/socket.js";

export function createApiRouter(): Router {
    const router = Router();

    router.post(
        "/auth/login",
        asyncHandler(async (req, res) => {
            const body = loginSchema.safeParse(req.body);
            if (!body.success) {
                res.status(400).json({ message: "Invalid login payload" });
                return;
            }

            const userId = await verifyLogin(
                body.data.username,
                body.data.password,
            );
            if (!userId) {
                res.status(401).json({
                    message: "Username atau password salah",
                });
                return;
            }

            // Update last login timestamp
            try {
                await updateLastLoginAt(userId);
            } catch (err) {
                console.error("[AUTH] Failed to update last login:", err);
                // Don't fail the login if we can't update timestamp
            }

            res.json({ token: signToken(userId, body.data.username) });
        }),
    );

    router.use(requireAuth);

    router.get(
        "/status",
        asyncHandler(async (_req, res) => {
            res.json({
                status: botManager.getStatus(),
                uptime_seconds: botManager.getUptimeSeconds(),
                total_messages_today: await appDb.getTotalMessagesToday(),
                queue_size: getQueueSize(),
                qr_code: botManager.getQrCode(),
            });
        }),
    );

    router.get(
        "/contacts",
        asyncHandler(async (_req, res) => {
            res.json({ data: await appDb.listContacts() });
        }),
    );

    router.get(
        "/contacts/:contactId",
        asyncHandler(async (req, res) => {
            const detail = await appDb.getContact(req.params.contactId);
            if (!detail) {
                res.status(404).json({ message: "Contact not found" });
                return;
            }
            res.json(detail);
        }),
    );

    router.post(
        "/contacts",
        asyncHandler(async (req, res) => {
            const body = createContactSchema.safeParse(req.body);
            if (!body.success) {
                res.status(400).json({
                    message: "Invalid contact payload",
                    issues: body.error.issues,
                });
                return;
            }

            res.status(201).json(await appDb.createContact(body.data));
        }),
    );

    router.put(
        "/contacts/:contactId",
        asyncHandler(async (req, res) => {
            const body = updateContactSchema.safeParse(req.body);
            if (!body.success) {
                res.status(400).json({
                    message: "Invalid contact payload",
                    issues: body.error.issues,
                });
                return;
            }

            const updated = await appDb.updateContact(
                req.params.contactId,
                body.data,
            );
            if (!updated) {
                res.status(404).json({ message: "Contact not found" });
                return;
            }

            res.json(updated);
        }),
    );

    router.delete(
        "/contacts/:contactId",
        asyncHandler(async (req, res) => {
            await appDb.deleteContact(req.params.contactId);
            res.status(204).send();
        }),
    );

    router.get(
        "/conversations",
        asyncHandler(async (req, res) => {
            const page = numberQuery(req.query.page, 1);
            const limit = numberQuery(req.query.limit, 20);
            res.json(await appDb.listConversations(page, limit));
        }),
    );

    router.get(
        "/conversations/:contactId",
        asyncHandler(async (req, res) => {
            const detail = await appDb.getConversation(req.params.contactId);
            if (!detail) {
                res.status(404).json({ message: "Conversation not found" });
                return;
            }
            res.json(detail);
        }),
    );

    router.delete(
        "/conversations/:contactId/history",
        asyncHandler(async (req, res) => {
            await appDb.clearConversation(req.params.contactId);
            res.status(204).send();
        }),
    );

    router.get(
        "/config",
        asyncHandler(async (_req, res) => {
            res.json(await appDb.getConfig());
        }),
    );

    router.put(
        "/config",
        asyncHandler(async (req, res) => {
            const body = configSchema.partial().safeParse(req.body);
            if (!body.success) {
                res.status(400).json({
                    message: "Invalid config payload",
                    issues: body.error.issues,
                });
                return;
            }
            res.json(await appDb.updateConfig(body.data));
        }),
    );

    router.post(
        "/test-prompt",
        asyncHandler(async (req, res) => {
            const body = testPromptSchema.safeParse(req.body);
            if (!body.success) {
                res.status(400).json({
                    message: "Invalid test prompt payload",
                    issues: body.error.issues,
                });
                return;
            }

            const baseConfig = await appDb.getConfig();
            const result = await generateBotReply({
                contactId: "dashboard-test",
                contactName: "Admin Dashboard",
                message: body.data.message,
                config: { ...baseConfig, ...body.data.config },
            });

            res.json({
                reply: getReplyPreview(result.reply),
                latency_ms: result.latencyMs,
            });
        }),
    );

    router.get(
        "/analytics/summary",
        asyncHandler(async (_req, res) => {
            res.json(await appDb.getAnalyticsSummary());
        }),
    );

    router.get(
        "/logs",
        asyncHandler(async (req, res) => {
            const level =
                typeof req.query.level === "string"
                    ? req.query.level
                    : undefined;
            const limit = numberQuery(req.query.limit, 100);
            res.json({ data: await appDb.listLogs(level, limit) });
        }),
    );

    router.post(
        "/maintenance/purge-operational-data",
        asyncHandler(async (_req, res) => {
            const summary = await appDb.purgeOperationalData();
            memory.clearAll();
            const analytics = await appDb.getAnalyticsSummary();
            emitAnalyticsUpdate(analytics);
            await appDb.addLog("warn", "operational_data_purged", summary);

            res.status(202).json({
                ...summary,
                preserved_tables: [
                    "admin_users",
                    "bot_settings",
                    "system_logs",
                    "whatsapp_auth_state",
                ],
            });
        }),
    );

    router.post(
        "/bot/restart",
        asyncHandler(async (_req, res) => {
            await botManager.restart();
            res.status(202).json({ status: botManager.getStatus() });
        }),
    );

    router.post(
        "/bot/reset-auth",
        asyncHandler(async (_req, res) => {
            await botManager.resetAuth();
            res.status(202).json({
                status: botManager.getStatus(),
                uptime_seconds: botManager.getUptimeSeconds(),
                total_messages_today: await appDb.getTotalMessagesToday(),
                queue_size: getQueueSize(),
                qr_code: botManager.getQrCode(),
            });
        }),
    );

    return router;
}

const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
}) satisfies z.ZodType<LoginRequest>;

const createContactSchema = z.object({
    id: z.string().min(3).max(120),
    name: z.string().max(120).nullable().optional(),
    is_blocked: z.boolean().optional(),
    last_seen: z.string().datetime({ offset: true }).nullable().optional(),
}) satisfies z.ZodType<CreateContactRequest>;

const updateContactSchema = z
    .object({
        id: z.string().min(3).max(120).optional(),
        name: z.string().max(120).nullable().optional(),
        is_blocked: z.boolean().optional(),
        last_seen: z.string().datetime({ offset: true }).nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one contact field is required",
    }) satisfies z.ZodType<UpdateContactRequest>;

const configSchema = z.object({
    system_prompt: z.string().min(10).max(4000),
    bot_name: z.string().min(1).max(80),
    is_active: z.boolean(),
    ignore_groups: z.boolean(),
    tone_style: z.enum(["pedas", "wholesome", "absurd", "helpful", "custom"]),
}) satisfies z.ZodType<BotConfig>;

const testPromptSchema = z.object({
    message: z.string().min(1).max(2000),
    config: configSchema.partial().optional(),
}) satisfies z.ZodType<TestPromptRequest>;

function numberQuery(value: unknown, fallback: number): number {
    const parsed = typeof value === "string" ? Number.parseInt(value, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function asyncHandler(
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
    return (req: Request, res: Response, next: NextFunction) => {
        void handler(req, res, next).catch(next);
    };
}
