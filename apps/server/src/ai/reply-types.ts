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

export type DocumentKind = "pdf" | "docx" | "xlsx";

export interface DocumentBotReply {
    type: "document";
    documentBuffer: Buffer;
    fileName: string;
    mimeType: string;
    documentKind: DocumentKind;
    caption?: string;
    auditMeta?: Record<string, unknown>;
}

export type BotReply = TextBotReply | ImageBotReply | DocumentBotReply;

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

export function createDocumentReply(input: {
    documentBuffer: Buffer;
    fileName: string;
    mimeType: string;
    documentKind: DocumentKind;
    caption?: string | null;
    auditMeta?: Record<string, unknown>;
}): DocumentBotReply {
    return {
        type: "document",
        documentBuffer: input.documentBuffer,
        fileName: input.fileName,
        mimeType: input.mimeType,
        documentKind: input.documentKind,
        caption: input.caption ?? undefined,
        auditMeta: input.auditMeta,
    };
}

export function getReplyPreview(reply: BotReply): string {
    if (reply.type === "text") return reply.text;
    if (reply.type === "image") return reply.caption ?? "[image reply]";
    return reply.caption ?? `[document: ${reply.fileName}]`;
}
