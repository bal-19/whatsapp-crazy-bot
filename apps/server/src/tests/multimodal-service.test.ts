import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Content } from "@google/generative-ai";
import {
    buildMultimodalPrompt,
    detectImageAnalysisMode,
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
});
