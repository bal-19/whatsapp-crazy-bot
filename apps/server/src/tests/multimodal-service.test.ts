import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Content } from "@google/generative-ai";
import {
    buildMultimodalPrompt,
    detectImageAnalysisMode,
    detectMultimodalTask,
} from "../ai/multimodal-service.js";

describe("detectImageAnalysisMode", () => {
    it("detects roast requests", () => {
        assert.equal(detectImageAnalysisMode("Ikmal roast gambar ini"), "roast");
    });

    it("detects caption requests", () => {
        assert.equal(
            detectImageAnalysisMode("caption-in foto ini dong"),
            "caption",
        );
    });

    it("detects meme explanation requests", () => {
        assert.equal(
            detectImageAnalysisMode("jelasin meme ini kenapa lucu"),
            "meme_explain",
        );
    });

    it("defaults to describe", () => {
        assert.equal(detectImageAnalysisMode("menurutmu ini apa?"), "describe");
    });
});

describe("detectMultimodalTask", () => {
    it("detects text-to-image generation requests", () => {
        assert.equal(
            detectMultimodalTask("Ikmal buatkan gambar kucing lucu", false),
            "image_generation",
        );
        assert.equal(
            detectMultimodalTask("generate image robot futuristik", false),
            "image_generation",
        );
    });

    it("detects image editing requests when an attachment is present", () => {
        assert.equal(
            detectMultimodalTask("ubah foto ini jadi gaya anime", true),
            "image_generation",
        );
    });

    it("keeps normal image captions on the analysis path", () => {
        assert.equal(
            detectMultimodalTask("jelasin gambar ini", true),
            "analysis",
        );
    });
});

describe("buildMultimodalPrompt", () => {
    it("includes system prompt, history, and user instruction", () => {
        const history: Content[] = [
            { role: "user", parts: [{ text: "halo" }] },
            { role: "model", parts: [{ text: "halo juga" }] },
        ];

        const prompt = buildMultimodalPrompt({
            systemPrompt: "Kamu adalah Ikmal",
            history,
            message: "jelasin gambar ini",
            mode: "describe",
        });

        assert.match(prompt, /Kamu adalah Ikmal/);
        assert.match(prompt, /User: halo/);
        assert.match(prompt, /Bot: halo juga/);
        assert.match(prompt, /Instruksi user: jelasin gambar ini/);
    });

    it("instructs Gemini to return an image for generation tasks", () => {
        const prompt = buildMultimodalPrompt({
            systemPrompt: "Kamu adalah Ikmal",
            history: [],
            message: "buatkan gambar kucing",
            mode: "describe",
            task: "image_generation",
        });

        assert.match(prompt, /Buat atau edit gambar/);
        assert.match(prompt, /Kembalikan gambar/);
    });
});
