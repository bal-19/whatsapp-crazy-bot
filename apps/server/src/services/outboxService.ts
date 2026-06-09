import crypto from "node:crypto";
import type { proto } from "@whiskeysockets/baileys";
import { appDb } from "../db/database.js";
import { emitAnalyticsUpdate, emitNewMessage } from "../realtime/socket.js";
import { getReplyPreview, type BotReply } from "../ai/reply-types.js";
import { mediaService } from "./mediaService.js";
import { logService } from "./logService.js";

type SendTransport = (
    deliveryJid: string,
    reply: BotReply,
    quotedMessage?: proto.IWebMessageInfo,
) => Promise<void>;

interface QueueInput {
    contactId: string;
    deliveryJid: string;
    reply: BotReply;
    aiModel: string | null;
    latencyMs: number | null;
    quotedMessage?: proto.IWebMessageInfo;
    scopeMeta?: Record<string, unknown>;
}

class OutboxService {
    private sendTransport: SendTransport | null = null;
    private timer: NodeJS.Timeout | null = null;
    private isFlushing = false;
    private readonly pollIntervalMs = 5_000;

    setTransport(sendTransport: SendTransport): void {
        this.sendTransport = sendTransport;
    }

    start(): void {
        if (this.timer) return;
        this.timer = setInterval(() => {
            void this.flushPending();
        }, this.pollIntervalMs);
        this.timer.unref();
    }

    async enqueue(input: QueueInput): Promise<void> {
        const preview = getReplyPreview(input.reply);
        const payload = {
            reply: mediaService.serializeReply(input.reply),
            aiModel: input.aiModel,
            latencyMs: input.latencyMs,
            rawPayload: mediaService.toStoragePayload(input.reply),
            auditSummary: mediaService.toAuditSummary(input.reply),
            replyToMessageId: input.quotedMessage?.key.id ?? null,
            scopeMeta: input.scopeMeta ?? null,
        };

        await appDb.createOutboxMessage({
            contact_id: input.contactId,
            delivery_jid: input.deliveryJid,
            reply_preview: preview,
            payload,
        });

        void this.flushPending();
    }

    async flushPending(): Promise<void> {
        if (this.isFlushing || !this.sendTransport) return;
        this.isFlushing = true;

        try {
            const pending = await appDb.claimPendingOutboxMessages(5);
            for (const item of pending) {
                await this.deliver(item);
            }
        } finally {
            this.isFlushing = false;
        }
    }

    private async deliver(
        item: {
            id: string;
            contact_id: string;
            delivery_jid: string;
            payload: Record<string, unknown>;
            reply_preview: string;
            attempt_count: number;
            max_attempts: number;
        },
    ): Promise<void> {
        if (!this.sendTransport) return;

        try {
            const payload = item.payload;
            const replyPayload = asRecord(payload.reply);
            if (!replyPayload) {
                throw new Error("Outbox payload reply is invalid");
            }

            const reply = mediaService.deserializeReply(replyPayload);
            const aiModel =
                typeof payload.aiModel === "string" ? payload.aiModel : null;
            const latencyMs =
                typeof payload.latencyMs === "number" ? payload.latencyMs : null;
            const rawPayload = asRecord(payload.rawPayload) ?? null;
            const auditSummary = asRecord(payload.auditSummary) ?? {};
            const scopeMeta = asRecord(payload.scopeMeta) ?? {};
            const replyToMessageId =
                typeof payload.replyToMessageId === "string"
                    ? payload.replyToMessageId
                    : null;

            await this.sendTransport(item.delivery_jid, reply);
            await appDb.markOutboxMessageSent(item.id);

            const outbound = await appDb.insertMessage({
                id: `bot-${Date.now()}-${crypto.randomUUID()}`,
                contact_id: item.contact_id,
                direction: "outbound",
                body: item.reply_preview,
                ai_model: aiModel,
                latency_ms: latencyMs,
                reply_to_message_id: replyToMessageId,
                raw_payload: rawPayload,
                message_timestamp: new Date().toISOString(),
            });

            emitNewMessage(item.contact_id, outbound);
            emitAnalyticsUpdate(await appDb.getAnalyticsSummary());
            logService.write("info", "audit_reply_sent", {
                ...scopeMeta,
                aiModel,
                latencyMs,
                replyToMessageId,
                ...auditSummary,
                outputLength: item.reply_preview.length,
                outboxId: item.id,
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Unknown outbox error";
            const nextRetryAt = computeNextRetryAt(item.attempt_count, item.max_attempts);
            const markFailed = nextRetryAt === null;
            await appDb.rescheduleOutboxMessage(
                item.id,
                message,
                nextRetryAt,
                markFailed,
            );
            logService.write(markFailed ? "error" : "warn", "outbox_delivery_failed", {
                outboxId: item.id,
                contactId: item.contact_id,
                deliveryJid: item.delivery_jid,
                attemptCount: item.attempt_count,
                maxAttempts: item.max_attempts,
                nextRetryAt,
                errorMessage: message,
            });
        }
    }
}

function computeNextRetryAt(
    attemptCount: number,
    maxAttempts: number,
): string | null {
    if (attemptCount >= maxAttempts) {
        return null;
    }

    const backoffMs = [30_000, 120_000, 600_000][attemptCount - 1] ?? 600_000;
    return new Date(Date.now() + backoffMs).toISOString();
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === "object" && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

export const outboxService = new OutboxService();
