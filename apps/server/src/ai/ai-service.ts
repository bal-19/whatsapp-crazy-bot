import type { BotConfig, Message } from "@whatsapp-bot/shared";
import type { Content } from "@google/generative-ai";
import { appDb } from "../db/database.js";
import { env } from "../config/env.js";
import { buildSystemPrompt } from "./prompt-builder.js";
import { memory } from "./conversation-memory.js";
import { processGeminiOutput } from "./output-processor.js";
import { generateGeminiReply } from "./gemini-client.js";
import {
    geminiQueue,
    incrementDailyCounter,
    isQueueOverloaded,
} from "./rate-limiter.js";
import { ERROR_MESSAGES } from "./error-messages.js";
import { logService } from "../services/logService.js";
import { botConfigService } from "../services/botConfigService.js";
import { createTextReply, type BotReply } from "./reply-types.js";

export interface GenerateReplyInput {
    contactId: string;
    contactName?: string | null;
    message: string;
    config?: BotConfig;
}

export interface GenerateReplyResult {
    reply: BotReply;
    latencyMs: number;
    aiModel: string;
}

export async function generateBotReply(
    input: GenerateReplyInput,
): Promise<GenerateReplyResult> {
    if (isQueueOverloaded()) {
        return {
            reply: createTextReply(ERROR_MESSAGES.queue_full),
            latencyMs: 0,
            aiModel: env.GEMINI_MODEL,
        };
    }

    const startedAt = Date.now();
    // Prioritize passed config, otherwise load from cached BotConfigService
    const config = input.config ?? (await botConfigService.getConfig());
    await ensureMemoryHydrated(input.contactId);

    const systemPrompt = buildSystemPrompt({
        botName: config.bot_name,
        persona: config.system_prompt,
        toneStyle: config.tone_style,
        contactName: input.contactName,
    });

    try {
        const raw = await geminiQueue.add(async () => {
            incrementDailyCounter();
            return generateGeminiReply(
                systemPrompt,
                memory.getHistory(input.contactId),
                input.message,
            );
        });

        const reply = processGeminiOutput(raw ?? "");
        const latencyMs = Date.now() - startedAt;
        memory.addTurn(input.contactId, input.message, reply);
        return {
            reply: createTextReply(reply),
            latencyMs,
            aiModel: env.GEMINI_MODEL,
        };
    } catch (error) {
        const latencyMs = Date.now() - startedAt;
        const message =
            error instanceof Error ? error.message : "Unknown Gemini error";
        logService.write("error", "gemini_error", {
            contactId: input.contactId,
            errorMessage: message,
        });
        return {
            reply: createTextReply(classifyGeminiError(message)),
            latencyMs,
            aiModel: env.GEMINI_MODEL,
        };
    }
}

async function ensureMemoryHydrated(contactId: string): Promise<void> {
    const current = memory.getHistory(contactId);
    if (current.length > 0) return;

    const rows = await appDb.getRecentHistory(contactId, 20);
    const history: Content[] = rows
        .filter((message): message is Message => Boolean(message.body))
        .map((message) => ({
            role: message.direction === "inbound" ? "user" : "model",
            parts: [{ text: message.body }],
        }));

    if (history.length > 0) memory.hydrate(contactId, history);
}

function classifyGeminiError(message: string): string {
    if (/timeout/i.test(message)) return ERROR_MESSAGES.timeout;
    if (/429|rate|resource exhausted/i.test(message))
        return ERROR_MESSAGES.rate_limit;
    if (/safety|blocked/i.test(message)) return ERROR_MESSAGES.safety;
    if (/5\d\d|server/i.test(message)) return ERROR_MESSAGES.server_error;
    return ERROR_MESSAGES.generic;
}
