import crypto from "node:crypto";
import makeWASocket, {
    Browsers,
    DisconnectReason,
    fetchLatestBaileysVersion,
    type WASocket,
    type proto,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import QRCode from "qrcode";
import type { BotStatus, Message } from "@whatsapp-bot/shared";
import { env } from "../config/env.js";
import { appDb } from "../db/database.js";
import {
    emitAnalyticsUpdate,
    emitBotStatus,
    emitNewMessage,
} from "../realtime/socket.js";
import { logService } from "../services/logService.js";
import { botConfigService } from "../services/botConfigService.js";
import { sanitizeInput } from "../ai/input-sanitizer.js";
import { detectIntent, shouldBotRespond } from "../ai/intent-detector.js";
import { ERROR_MESSAGES } from "../ai/error-messages.js";
import { memory } from "../ai/conversation-memory.js";
import { generateBotReply } from "../ai/ai-service.js";
import { createWhatsAppAuthState } from "./whatsapp-auth-state.js";
import {
    resolveConversationScope,
    toConversationScopeLogMeta,
    type ConversationScope,
} from "./conversation-scope.js";

export class BotManager {
    private sock: WASocket | null = null;
    private status: BotStatus = "disconnected";
    private reconnectAttempts = 0;
    private startedAt = Date.now();
    private isStarting = false;
    private isResettingAuth = false;
    private clearAuthState: (() => Promise<void>) | null = null;
    private latestQrCode: string | null = null;

    getStatus(): BotStatus {
        return this.status;
    }

    getUptimeSeconds(): number {
        return Math.floor((Date.now() - this.startedAt) / 1000);
    }

    getQrCode(): string | null {
        return this.latestQrCode;
    }

    async start(): Promise<void> {
        if (this.isStarting) return;
        this.isStarting = true;
        this.latestQrCode = null;
        this.setStatus("connecting");

        try {
            // Initialize bot config from database
            await botConfigService.initialize();

            const { state, saveCreds, clear } = await createWhatsAppAuthState();
            this.clearAuthState = clear;
            const { version } = await fetchLatestBaileysVersion();

            this.sock = makeWASocket({
                auth: state,
                version,
                printQRInTerminal: false,
                qrTimeout: env.WA_QR_TIMEOUT_MS,
                browser: Browsers.macOS("WhatsApp AI Bot"),
            });

            this.sock.ev.on("creds.update", saveCreds);
            this.sock.ev.on("connection.update", (update) => {
                void this.handleConnectionUpdate(update);
            });
            this.sock.ev.on("messages.upsert", (event) => {
                void this.handleMessages(event.messages);
            });

            logService.write("info", "bot_starting", {
                qrTimeoutMs: env.WA_QR_TIMEOUT_MS,
            });
        } catch (error) {
            this.setStatus("disconnected");
            logService.write("error", "bot_start_failed", {
                errorMessage: getErrorMessage(error),
            });
        } finally {
            this.isStarting = false;
        }
    }

    async restart(): Promise<void> {
        logService.write("warn", "bot_restart_requested");
        this.sock?.end(undefined);
        this.sock = null;
        this.reconnectAttempts = 0;
        await this.start();
    }

    async resetAuth(): Promise<void> {
        logService.write("warn", "bot_reset_auth_requested");
        this.isResettingAuth = true;
        this.reconnectAttempts = 0;
        this.latestQrCode = null;
        this.setStatus("disconnected");

        try {
            this.sock?.end(undefined);
            this.sock = null;
            await this.clearAuthState?.();
        } finally {
            this.isResettingAuth = false;
        }

        await this.start();
    }

    private async handleConnectionUpdate(update: {
        connection?: string;
        qr?: string;
        lastDisconnect?: { error?: unknown };
    }): Promise<void> {
        if (update.qr) {
            qrcode.generate(update.qr, { small: true });
            this.latestQrCode = await QRCode.toDataURL(update.qr, {
                errorCorrectionLevel: "M",
                margin: 1,
                width: 320,
            });
            emitBotStatus({
                status: this.status,
                qr_code: this.latestQrCode,
            });
            logService.write("info", "bot_qr_generated");
        }

        if (update.connection === "open") {
            this.reconnectAttempts = 0;
            this.startedAt = Date.now();
            this.latestQrCode = null;
            this.setStatus("connected");
            logService.write("info", "bot_connected");
            return;
        }

        if (update.connection === "close") {
            const statusCode = (
                update.lastDisconnect?.error as
                    | { output?: { statusCode?: number } }
                    | undefined
            )?.output?.statusCode;
            this.setStatus("disconnected");
            logService.write("warn", "bot_disconnected", { statusCode });

            if (this.isResettingAuth) {
                return;
            }

            if (statusCode === DisconnectReason.loggedOut) {
                await this.clearAuthState?.();
                this.latestQrCode = null;
                logService.write("error", "bot_logged_out");
                return;
            }

            await this.scheduleReconnect();
        }
    }

    private async scheduleReconnect(): Promise<void> {
        this.reconnectAttempts++;
        const delayMs = Math.min(
            30_000,
            5_000 * 2 ** Math.min(this.reconnectAttempts - 1, 3),
        );
        logService.write("info", "bot_reconnect_scheduled", {
            delayMs,
            attempt: this.reconnectAttempts,
        });
        setTimeout(() => void this.start(), delayMs).unref();
    }

    private async handleMessages(
        messages: proto.IWebMessageInfo[],
    ): Promise<void> {
        for (const message of messages) {
            await this.handleMessage(message);
        }
    }

    private async handleMessage(message: proto.IWebMessageInfo): Promise<void> {
        if (!this.sock || message.key.fromMe) return;

        const jid = message.key.remoteJid;
        const messageId = message.key.id;
        if (!jid || !messageId) return;

        // Filter: Ignore newsletter messages
        if (jid.includes("@newsletter")) {
            return;
        }

        const text = extractText(message);
        if (!text) {
            return;
        }

        const config = await botConfigService.getConfig();
        const isGroup = jid.endsWith("@g.us");
        if (!config.is_active || (isGroup && config.ignore_groups)) return;

        const scope = resolveConversationScope(message);
        if (!scope) return;

        const scopeMeta = toConversationScopeLogMeta(scope);
        if (scope.usedGroupFallback) {
            logService.write("warn", "conversation_scope_group_fallback", {
                ...scopeMeta,
                messageId,
            });
        }

        // Cek apakah bot harus merespons (mention detection)
        if (!shouldBotRespond(text, config.bot_name)) {
            // Log bahwa pesan tidak memention bot
            logService.write("info", "message_ignored_no_mention", {
                ...scopeMeta,
                messagePreview: text.substring(0, 50),
            });
            return;
        }

        const contactName = message.pushName ?? null;
        await appDb.upsertContact(scope.contactId, contactName);
        const inbound = await appDb.insertMessage({
            id: messageId,
            contact_id: scope.contactId,
            direction: "inbound",
            body: text,
        });
        emitNewMessage(scope.contactId, inbound);
        emitAnalyticsUpdate(await appDb.getAnalyticsSummary());
        logService.write("info", "message_received", {
            ...scopeMeta,
            inputLength: text.length,
        });
        logService.write("info", "audit_message_received", {
            ...scopeMeta,
            messageId,
            inputLength: text.length,
        });

        const sanitized = sanitizeInput(text);
        if (!sanitized.isValid) return;

        const intent = detectIntent(sanitized.sanitized);
        logService.write("info", "audit_intent_detected", {
            ...scopeMeta,
            messageId,
            intent,
        });
        if (intent === "reset") {
            memory.clearSession(scope.contactId);
            await appDb.clearConversation(scope.contactId);
            await this.sendAndLog(
                scope,
                ERROR_MESSAGES.reset,
                null,
                0,
                message,
            );
            return;
        }

        if (intent === "handoff") {
            await this.sendAndLog(
                scope,
                ERROR_MESSAGES.handoff,
                null,
                0,
                message,
            );
            return;
        }

        await this.sock.sendPresenceUpdate("composing", scope.deliveryJid);
        const result = await generateBotReply({
            contactId: scope.contactId,
            contactName,
            message: sanitized.sanitized,
            config,
        });
        await this.sock.sendPresenceUpdate("paused", scope.deliveryJid);
        await this.sendAndLog(
            scope,
            result.reply,
            result.aiModel,
            result.latencyMs,
            message,
        );
    }

    private async sendAndLog(
        scope: ConversationScope,
        body: string,
        aiModel: string | null,
        latencyMs: number | null,
        quotedMessage?: proto.IWebMessageInfo,
    ): Promise<Message> {
        await this.sock?.sendMessage(
            scope.deliveryJid,
            { text: body },
            quotedMessage ? { quoted: quotedMessage } : undefined,
        );
        await appDb.upsertContact(scope.contactId);
        const outbound = await appDb.insertMessage({
            id: `bot-${Date.now()}-${crypto.randomUUID()}`,
            contact_id: scope.contactId,
            direction: "outbound",
            body,
            ai_model: aiModel,
            latency_ms: latencyMs,
        });
        emitNewMessage(scope.contactId, outbound);
        emitAnalyticsUpdate(await appDb.getAnalyticsSummary());
        logService.write("info", "audit_reply_sent", {
            ...toConversationScopeLogMeta(scope),
            aiModel,
            latencyMs,
            replyType: "text",
            outputLength: body.length,
        });
        return outbound;
    }

    private setStatus(status: BotStatus): void {
        this.status = status;
        emitBotStatus({ status, qr_code: this.latestQrCode });
    }
}

function extractText(message: proto.IWebMessageInfo): string | null {
    const content = message.message;
    if (!content) return null;

    return (
        content.conversation ??
        content.extendedTextMessage?.text ??
        content.imageMessage?.caption ??
        content.videoMessage?.caption ??
        null
    );
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export const botManager = new BotManager();
