export interface TextBotReply {
    type: "text";
    text: string;
}

export interface ImageBotReply {
    type: "image";
    imageUrl?: string;
    imageBuffer?: Buffer;
    caption?: string;
    mimeType?: string;
    auditMeta?: Record<string, unknown>;
}

export type BotReply = TextBotReply | ImageBotReply;

export function createTextReply(text: string): TextBotReply {
    return { type: "text", text };
}

export function createImageReply(input: {
    imageBuffer: Buffer;
    caption?: string | null;
    mimeType?: string | null;
    auditMeta?: Record<string, unknown>;
}): ImageBotReply {
    return {
        type: "image",
        imageBuffer: input.imageBuffer,
        caption: input.caption ?? undefined,
        mimeType: input.mimeType ?? undefined,
        auditMeta: input.auditMeta,
    };
}

export function getReplyPreview(reply: BotReply): string {
    if (reply.type === "text") return reply.text;
    return reply.caption ?? "[image reply]";
}
