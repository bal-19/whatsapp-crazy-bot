import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import type {
    BotConfig,
    CreateRoleRequest,
    CreateUserRequest,
    CreateContactRequest,
    LoginRequest,
    TestPromptRequest,
    UpdateRoleRequest,
    UpdateContactRequest,
    UpdateUserRequest,
    UpsertWhatsAppGroupRequest,
} from "@whatsapp-bot/shared";
import { appDb } from "../db/database.js";
import {
    getCurrentAuthUser,
    requireAuth,
    requirePermission,
    signToken,
    verifyLogin,
} from "../auth/jwt.js";
import { DASHBOARD_PERMISSIONS } from "../auth/permissions.js";
import { botManager } from "../bot/bot-manager.js";
import { getQueueSize } from "../ai/rate-limiter.js";
import { generateBotReply } from "../ai/ai-service.js";
import { getReplyPreview } from "../ai/reply-types.js";
import { memory } from "../ai/conversation-memory.js";
import { emitAnalyticsUpdate } from "../realtime/socket.js";
import { authRateLimiter, testPromptRateLimiter } from "./rate-limiters.js";
import {
    createRole,
    createUser,
    deleteRole,
    deleteUser,
    listRoles,
    listUsers,
    updateLastLoginAt,
    updateRole,
    updateUser,
} from "../services/accessControlService.js";

export function createApiRouter(): Router {
    const router = Router();

    router.post(
        "/auth/login",
        authRateLimiter,
        asyncHandler(async (req, res) => {
            const body = loginSchema.safeParse(req.body);
            if (!body.success) {
                res.status(400).json({ message: "Invalid login payload" });
                return;
            }

            const user = await verifyLogin(
                body.data.username,
                body.data.password,
            );
            if (!user) {
                res.status(401).json({
                    message: "Username atau password salah",
                });
                return;
            }

            // Update last login timestamp
            try {
                await updateLastLoginAt(user.id);
            } catch (err) {
                console.error("[AUTH] Failed to update last login:", err);
                // Don't fail the login if we can't update timestamp
            }

            res.json({ token: signToken(user), user });
        }),
    );

    router.use(requireAuth);

    router.get(
        "/auth/me",
        asyncHandler(async (req, res) => {
            const user = await getCurrentAuthUser(req);
            if (!user) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            res.json(user);
        }),
    );

    router.get(
        "/status",
        requirePermission("dashboard.view", "bot.manage"),
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
        requirePermission("contacts.manage"),
        asyncHandler(async (_req, res) => {
            res.json({ data: await appDb.listContacts() });
        }),
    );

    router.get(
        "/contacts/:contactId",
        requirePermission("contacts.manage"),
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
        requirePermission("contacts.manage"),
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
        requirePermission("contacts.manage"),
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
        requirePermission("contacts.manage"),
        asyncHandler(async (req, res) => {
            await appDb.deleteContact(req.params.contactId);
            res.status(204).send();
        }),
    );

    router.get(
        "/groups",
        requirePermission("groups.manage"),
        asyncHandler(async (_req, res) => {
            res.json({ data: await appDb.listGroups() });
        }),
    );

    router.post(
        "/groups",
        requirePermission("groups.manage"),
        asyncHandler(async (req, res) => {
            const body = upsertGroupSchema.safeParse(req.body);
            if (!body.success) {
                res.status(400).json({
                    message: "Invalid group payload",
                    issues: body.error.issues,
                });
                return;
            }

            const group = await appDb.upsertGroup(
                body.data.group_jid,
                body.data.display_name ?? null,
            );
            res.status(201).json(group);
        }),
    );

    router.delete(
        "/groups/:groupJid",
        requirePermission("groups.manage"),
        asyncHandler(async (req, res) => {
            await appDb.deleteGroup(req.params.groupJid);
            res.status(204).send();
        }),
    );

    router.get(
        "/conversations",
        requirePermission("conversations.view", "dashboard.view"),
        asyncHandler(async (req, res) => {
            const page = numberQuery(req.query.page, 1);
            const limit = numberQuery(req.query.limit, 20);
            res.json(await appDb.listConversations(page, limit));
        }),
    );

    router.get(
        "/conversations/:contactId",
        requirePermission("conversations.view"),
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
        requirePermission("conversations.view"),
        asyncHandler(async (req, res) => {
            await appDb.clearConversation(req.params.contactId);
            res.status(204).send();
        }),
    );

    router.get(
        "/config",
        requirePermission("config.manage"),
        asyncHandler(async (_req, res) => {
            res.json(await appDb.getConfig());
        }),
    );

    router.put(
        "/config",
        requirePermission("config.manage"),
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
        testPromptRateLimiter,
        requirePermission("config.manage"),
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
        requirePermission("analytics.view", "dashboard.view"),
        asyncHandler(async (_req, res) => {
            res.json(await appDb.getAnalyticsSummary());
        }),
    );

    router.get(
        "/logs",
        requirePermission("logs.view"),
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
        requirePermission("maintenance.manage"),
        asyncHandler(async (_req, res) => {
            const summary = await appDb.purgeOperationalData();
            memory.clearAll();
            const analytics = await appDb.getAnalyticsSummary();
            emitAnalyticsUpdate(analytics);
            await appDb.addLog("warn", "operational_data_purged", summary);

            res.status(202).json({
                ...summary,
                preserved_tables: [
                    "roles",
                    "users",
                    "bot_settings",
                    "system_logs",
                    "whatsapp_auth_state",
                ],
            });
        }),
    );

    router.post(
        "/bot/restart",
        requirePermission("bot.manage"),
        asyncHandler(async (_req, res) => {
            await botManager.restart();
            res.status(202).json({ status: botManager.getStatus() });
        }),
    );

    router.post(
        "/bot/reset-auth",
        requirePermission("bot.manage"),
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

    router.get(
        "/roles",
        requirePermission("roles.manage"),
        asyncHandler(async (_req, res) => {
            res.json({ data: await listRoles() });
        }),
    );

    router.post(
        "/roles",
        requirePermission("roles.manage"),
        asyncHandler(async (req, res) => {
            const body = createRoleSchema.safeParse(req.body);
            if (!body.success) {
                res.status(400).json({
                    message: "Invalid role payload",
                    issues: body.error.issues,
                });
                return;
            }

            res.status(201).json(await createRole(body.data));
        }),
    );

    router.put(
        "/roles/:roleId",
        requirePermission("roles.manage"),
        asyncHandler(async (req, res) => {
            const body = updateRoleSchema.safeParse(req.body);
            if (!body.success) {
                res.status(400).json({
                    message: "Invalid role payload",
                    issues: body.error.issues,
                });
                return;
            }

            res.json(await updateRole(req.params.roleId, body.data));
        }),
    );

    router.delete(
        "/roles/:roleId",
        requirePermission("roles.manage"),
        asyncHandler(async (req, res) => {
            await deleteRole(req.params.roleId);
            res.status(204).send();
        }),
    );

    router.get(
        "/users",
        requirePermission("users.manage"),
        asyncHandler(async (_req, res) => {
            res.json({ data: await listUsers() });
        }),
    );

    router.post(
        "/users",
        requirePermission("users.manage"),
        asyncHandler(async (req, res) => {
            const body = createUserSchema.safeParse(req.body);
            if (!body.success) {
                res.status(400).json({
                    message: "Invalid user payload",
                    issues: body.error.issues,
                });
                return;
            }

            res.status(201).json(await createUser(body.data));
        }),
    );

    router.put(
        "/users/:userId",
        requirePermission("users.manage"),
        asyncHandler(async (req, res) => {
            const body = updateUserSchema.safeParse(req.body);
            if (!body.success) {
                res.status(400).json({
                    message: "Invalid user payload",
                    issues: body.error.issues,
                });
                return;
            }

            res.json(await updateUser(req.params.userId, body.data));
        }),
    );

    router.delete(
        "/users/:userId",
        requirePermission("users.manage"),
        asyncHandler(async (req, res) => {
            await deleteUser(req.params.userId);
            res.status(204).send();
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

const upsertGroupSchema = z.object({
    group_jid: z
        .string()
        .min(3)
        .max(120)
        .refine((value) => value.endsWith("@g.us"), {
            message: "Group JID harus berakhiran @g.us",
        }),
    display_name: z.string().max(120).nullable().optional(),
}) satisfies z.ZodType<UpsertWhatsAppGroupRequest>;

const permissionSchema = z.custom<
    NonNullable<CreateRoleRequest["permissions"]>[number]
>((value) => typeof value === "string" && DASHBOARD_PERMISSIONS.includes(value as never), {
    message: "Permission tidak valid",
});

const createRoleSchema = z.object({
    name: z.string().min(2).max(120),
    permissions: z.array(permissionSchema).default([]),
});

const updateRoleSchema = z.object({
    name: z.string().min(2).max(120).optional(),
    permissions: z.array(permissionSchema).optional(),
});

const createUserSchema = z.object({
    username: z.string().min(3).max(120),
    password: z.string().min(6).max(120),
    email: z.string().email().nullable().optional(),
    role_id: z.string().uuid().nullable().optional(),
    is_active: z.boolean().optional(),
}) satisfies z.ZodType<CreateUserRequest>;

const updateUserSchema = z.object({
    password: z.string().min(6).max(120).optional(),
    email: z.string().email().nullable().optional(),
    role_id: z.string().uuid().nullable().optional(),
    is_active: z.boolean().optional(),
}) satisfies z.ZodType<UpdateUserRequest>;

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
