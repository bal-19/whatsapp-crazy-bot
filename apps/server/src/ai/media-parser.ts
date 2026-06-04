import {
    downloadMediaMessage,
    type WASocket,
    type proto,
} from "@whiskeysockets/baileys";
import { logger } from "../logging/logger.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface InboundImageAttachment {
    buffer: Buffer;
    mimeType: string;
    caption: string | null;
    fileLength: number | null;
}

export async function parseInboundImageAttachment(
    sock: WASocket,
    message: proto.IWebMessageInfo,
): Promise<InboundImageAttachment | null> {
    const imageMessage = message.message?.imageMessage;
    if (!imageMessage) return null;

    const fileLength = toNumber(imageMessage.fileLength);
    if (fileLength !== null && fileLength > MAX_IMAGE_BYTES) {
        throw new Error("IMAGE_TOO_LARGE");
    }

    const mimeType = imageMessage.mimetype?.trim() || "image/jpeg";
    const buffer = await downloadMediaMessage(
        message,
        "buffer",
        {},
        {
            logger,
            reuploadRequest: sock.updateMediaMessage,
        },
    );

    return {
        buffer,
        mimeType,
        caption: imageMessage.caption?.trim() || null,
        fileLength,
    };
}

function toNumber(value?: number | Long | null): number | null {
    if (typeof value === "number") return value;
    if (!value || typeof value !== "object") return null;
    if (typeof value.toNumber === "function") return value.toNumber();
    return null;
}
