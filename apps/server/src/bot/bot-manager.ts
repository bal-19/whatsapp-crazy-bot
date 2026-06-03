import crypto from "node:crypto";
import makeWASocket, {
    Browsers,
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    type WASocket,
    type proto,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import type { BotStatus, Message } from "@whatsapp-bot/shared";
import { env } from "../config/env.js";
import { appDb } from "../db/database.js";
import {
    emitAnalyticsUpdate,
    emitBotStatus,
    emitNewMessage,
} from "../realtime/socket.js";
import { logService } from "../services/logService.js";
import { sanitizeInput } from "../ai/input-sanitizer.js";
import { detectIntent, shouldBotRespond } from "../ai/intent-detector.js";
import { ERROR_MESSAGES } from "../ai/error-messages.js";
import { memory } from "../ai/conversation-memory.js";
import { generateBotReply } from "../ai/ai-service.js";

export class BotManager {
    private sock: WASocket | null = null;
    private status: BotStatus = "disconnected";
    private reconnectAttempts = 0;
    private startedAt = Date.now();
    private isStarting = false;

    getStatus(): BotStatus {
        return this.status;
    }

    getUptimeSeconds(): number {
        return Math.floor((Date.now() - this.startedAt) / 1000);
    }

    async start(): Promise<void> {
        if (this.isStarting) return;
        this.isStarting = true;
        this.setStatus("connecting");

        try {
            const { state, saveCreds } = await useMultiFileAuthState(
                env.WA_AUTH_DIR,
            );
            const { version } = await fetchLatestBaileysVersion();

            this.sock = makeWASocket({
                auth: state,
                version,
                printQRInTerminal: false,
                browser: Browsers.macOS("WhatsApp AI Bot"),
            });

            this.sock.ev.on("creds.update", saveCreds);
            this.sock.ev.on("connection.update", (update) => {
                void this.handleConnectionUpdate(update);
            });
            this.sock.ev.on("messages.upsert", (event) => {
                void this.handleMessages(event.messages);
            });

            logService.write("info", "bot_starting");
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

    private async handleConnectionUpdate(update: {
        connection?: string;
        qr?: string;
        lastDisconnect?: { error?: unknown };
    }): Promise<void> {
        if (update.qr) {
            qrcode.generate(update.qr, { small: true });
            logService.write("info", "bot_qr_generated");
        }

        if (update.connection === "open") {
            this.reconnectAttempts = 0;
            this.startedAt = Date.now();
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

            if (statusCode === DisconnectReason.loggedOut) {
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

        const text = extractText(message);
        if (!text) {
            return;
        }

        const config = await appDb.getConfig();
        const isGroup = jid.endsWith("@g.us");
        if (!config.is_active || (isGroup && config.ignore_groups)) return;

        // Cek apakah bot harus merespons (mention detection)
        if (!shouldBotRespond(text, config.bot_name)) {
            // Log bahwa pesan tidak memention bot
            logService.write("info", "message_ignored_no_mention", {
                contactId: jid,
                messagePreview: text.substring(0, 50),
            });
            return;
        }

        const contactName = message.pushName ?? null;
        await appDb.upsertContact(jid, contactName);
        const inbound = await appDb.insertMessage({
            id: messageId,
            contact_id: jid,
            direction: "inbound",
            body: text,
        });
        emitNewMessage(jid, inbound);
        emitAnalyticsUpdate(await appDb.getAnalyticsSummary());
        logService.write("info", "message_received", {
            contactId: jid,
            inputLength: text.length,
        });

        const sanitized = sanitizeInput(text);
        if (!sanitized.isValid) return;

        const intent = detectIntent(sanitized.sanitized);
        if (intent === "reset") {
            memory.clearSession(jid);
            await appDb.clearConversation(jid);
            await this.sendAndLog(jid, ERROR_MESSAGES.reset, null, 0);
            return;
        }

        if (intent === "handoff") {
            await this.sendAndLog(jid, ERROR_MESSAGES.handoff, null, 0);
            return;
        }

        await this.sock.sendPresenceUpdate("composing", jid);
        const result = await generateBotReply({
            contactId: jid,
            contactName,
            message: sanitized.sanitized,
            config,
        });
        await this.sock.sendPresenceUpdate("paused", jid);
        await this.sendAndLog(
            jid,
            result.reply,
            result.aiModel,
            result.latencyMs,
        );
    }

    private async sendAndLog(
        jid: string,
        body: string,
        aiModel: string | null,
        latencyMs: number | null,
    ): Promise<Message> {
        await this.sock?.sendMessage(jid, { text: body });
        await appDb.upsertContact(jid);
        const outbound = await appDb.insertMessage({
            id: `bot-${Date.now()}-${crypto.randomUUID()}`,
            contact_id: jid,
            direction: "outbound",
            body,
            ai_model: aiModel,
            latency_ms: latencyMs,
        });
        emitNewMessage(jid, outbound);
        emitAnalyticsUpdate(await appDb.getAnalyticsSummary());
        return outbound;
    }

    private setStatus(status: BotStatus): void {
        this.status = status;
        emitBotStatus(status);
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
