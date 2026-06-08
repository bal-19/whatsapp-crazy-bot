import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    createImageReply,
    createTextReply,
    getReplyPreview,
} from "../ai/reply-types.js";
import { mediaService } from "../services/mediaService.js";

describe("mediaService", () => {
    it("keeps text replies backward compatible", () => {
        const reply = createTextReply("halo");

        assert.deepEqual(mediaService.toWhatsAppContent(reply), { text: "halo" });
        assert.equal(mediaService.toStoragePayload(reply), null);
        assert.deepEqual(mediaService.toAuditSummary(reply), {
            replyType: "text",
        });
        assert.equal(getReplyPreview(reply), "halo");
    });

    it("builds image replies from URL", () => {
        const reply = {
            type: "image" as const,
            imageUrl: "https://example.com/test.png",
            caption: "lihat ini",
            mimeType: "image/png",
        };

        assert.deepEqual(mediaService.toWhatsAppContent(reply), {
            image: { url: "https://example.com/test.png" },
            caption: "lihat ini",
            mimetype: "image/png",
        });
        assert.deepEqual(mediaService.toStoragePayload(reply), {
            reply_type: "image",
            media_url: "https://example.com/test.png",
            mime_type: "image/png",
            has_buffer: false,
            caption: "lihat ini",
        });
        assert.deepEqual(mediaService.toAuditSummary(reply), {
            replyType: "image",
            mimeType: "image/png",
            mediaSource: "url",
            hasCaption: true,
        });
        assert.equal(getReplyPreview(reply), "lihat ini");
    });

    it("builds image replies from buffer", () => {
        const reply = createImageReply({
            imageBuffer: Buffer.from("hello"),
        });

        const content = mediaService.toWhatsAppContent(reply);
        assert.deepEqual(content, {
            image: Buffer.from("hello"),
            caption: undefined,
            mimetype: undefined,
        });
        assert.deepEqual(mediaService.toAuditSummary(reply), {
            replyType: "image",
            mimeType: undefined,
            mediaSource: "buffer",
            hasCaption: false,
        });
        assert.equal(getReplyPreview(reply), "[image reply]");
    });

    it("rejects non-http image URLs", () => {
        const reply = {
            type: "image" as const,
            imageUrl: "file:///tmp/test.png",
        };

        assert.throws(
            () => mediaService.toWhatsAppContent(reply),
            /http or https/,
        );
    });
});
