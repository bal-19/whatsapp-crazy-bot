import type { AnyMessageContent } from "@whiskeysockets/baileys";
import type { BotReply } from "../ai/reply-types.js";

export interface ReplyAuditSummary {
    replyType: BotReply["type"];
    mimeType?: string;
    mediaSource?: "url" | "buffer";
    hasCaption?: boolean;
}

export const mediaService = {
    toWhatsAppContent(reply: BotReply): AnyMessageContent {
        if (reply.type === "text") {
            return { text: reply.text };
        }

        if (reply.imageUrl) {
            assertHttpUrl(reply.imageUrl);
            return {
                image: { url: reply.imageUrl },
                caption: reply.caption,
                mimetype: reply.mimeType,
            };
        }

        if (reply.imageBuffer) {
            return {
                image: reply.imageBuffer,
                caption: reply.caption,
                mimetype: reply.mimeType,
            };
        }

        throw new Error("Image reply requires imageUrl or imageBuffer");
    },

    toStoragePayload(reply: BotReply): Record<string, unknown> | null {
        if (reply.type === "text") return null;

        return {
            reply_type: reply.type,
            media_url: reply.imageUrl ?? null,
            mime_type: reply.mimeType ?? null,
            has_buffer: Boolean(reply.imageBuffer),
            caption: reply.caption ?? null,
            ...(reply.auditMeta ?? {}),
        };
    },

    toAuditSummary(reply: BotReply): ReplyAuditSummary {
        if (reply.type === "text") {
            return { replyType: "text" };
        }

        return {
            replyType: "image",
            mimeType: reply.mimeType,
            mediaSource: reply.imageUrl ? "url" : "buffer",
            hasCaption: Boolean(reply.caption),
        };
    },
};

function assertHttpUrl(value: string): void {
    let url: URL;

    try {
        url = new URL(value);
    } catch {
        throw new Error("Image reply URL is invalid");
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Image reply URL must use http or https");
    }
}
