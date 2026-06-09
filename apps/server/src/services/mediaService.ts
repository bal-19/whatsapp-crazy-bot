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

        if (reply.type === "document") {
            return {
                document: reply.documentBuffer,
                fileName: reply.fileName,
                mimetype: reply.mimeType,
                caption: reply.caption,
            };
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

        if (reply.type === "document") {
            return {
                reply_type: reply.type,
                document_kind: reply.documentKind,
                file_name: reply.fileName,
                mime_type: reply.mimeType,
                has_buffer: true,
                caption: reply.caption ?? null,
                ...(reply.auditMeta ?? {}),
            };
        }

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

        if (reply.type === "document") {
            return {
                replyType: "document",
                mimeType: reply.mimeType,
                mediaSource: "buffer",
                hasCaption: Boolean(reply.caption),
            };
        }

        return {
            replyType: "image",
            mimeType: reply.mimeType,
            mediaSource: reply.imageUrl ? "url" : "buffer",
            hasCaption: Boolean(reply.caption),
        };
    },

    serializeReply(reply: BotReply): Record<string, unknown> {
        if (reply.type === "text") {
            return { type: "text", text: reply.text };
        }

        if (reply.type === "document") {
            return {
                type: "document",
                fileName: reply.fileName,
                mimeType: reply.mimeType,
                documentKind: reply.documentKind,
                caption: reply.caption ?? null,
                auditMeta: reply.auditMeta ?? null,
                documentBase64: reply.documentBuffer.toString("base64"),
            };
        }

        return {
            type: "image",
            imageUrl: reply.imageUrl ?? null,
            mimeType: reply.mimeType ?? null,
            caption: reply.caption ?? null,
            auditMeta: reply.auditMeta ?? null,
            imageBase64: reply.imageBuffer?.toString("base64") ?? null,
        };
    },

    deserializeReply(payload: Record<string, unknown>): BotReply {
        const type = payload.type;

        if (type === "text" && typeof payload.text === "string") {
            return { type: "text", text: payload.text };
        }

        if (
            type === "document" &&
            typeof payload.fileName === "string" &&
            typeof payload.mimeType === "string" &&
            typeof payload.documentKind === "string" &&
            typeof payload.documentBase64 === "string"
        ) {
            return {
                type: "document",
                fileName: payload.fileName,
                mimeType: payload.mimeType,
                documentKind: payload.documentKind as "pdf" | "docx" | "xlsx",
                caption:
                    typeof payload.caption === "string" ? payload.caption : undefined,
                auditMeta:
                    isRecord(payload.auditMeta) ? payload.auditMeta : undefined,
                documentBuffer: Buffer.from(payload.documentBase64, "base64"),
            };
        }

        if (type === "image") {
            const imageUrl =
                typeof payload.imageUrl === "string" ? payload.imageUrl : undefined;
            const imageBase64 =
                typeof payload.imageBase64 === "string"
                    ? payload.imageBase64
                    : undefined;

            if (!imageUrl && !imageBase64) {
                throw new Error("Serialized image reply is missing image data");
            }

            return {
                type: "image",
                imageUrl,
                imageBuffer: imageBase64
                    ? Buffer.from(imageBase64, "base64")
                    : undefined,
                caption:
                    typeof payload.caption === "string" ? payload.caption : undefined,
                mimeType:
                    typeof payload.mimeType === "string"
                        ? payload.mimeType
                        : undefined,
                auditMeta:
                    isRecord(payload.auditMeta) ? payload.auditMeta : undefined,
            };
        }

        throw new Error("Serialized reply payload is invalid");
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

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
