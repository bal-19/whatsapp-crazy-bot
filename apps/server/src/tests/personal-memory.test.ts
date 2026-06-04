import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    buildPersonalMemorySummary,
    extractPersonalMemories,
} from "../ai/personal-memory.js";

describe("extractPersonalMemories", () => {
    it("extracts preferred name from explicit phrasing", () => {
        const memories = extractPersonalMemories("Ikmal panggil aku bima aja");

        assert.deepEqual(memories, [
            {
                key: "preferred_name",
                value: "Bima",
                confidence: 0.95,
            },
        ]);
    });

    it("extracts favorite topics from explicit phrasing", () => {
        const memories = extractPersonalMemories(
            "gue suka anime, game, dan coding",
        );

        assert.deepEqual(memories, [
            {
                key: "favorite_topics",
                value: "anime, game, dan coding",
                confidence: 0.8,
            },
        ]);
    });

    it("ignores messages without explicit memory cues", () => {
        const memories = extractPersonalMemories("cuaca panas juga hari ini");
        assert.deepEqual(memories, []);
    });
});

describe("buildPersonalMemorySummary", () => {
    it("builds a readable summary for the prompt", () => {
        const summary = buildPersonalMemorySummary([
            {
                key: "preferred_name",
                value: "Bima",
                confidence: 0.95,
            },
            {
                key: "favorite_topics",
                value: "anime dan game",
                confidence: 0.8,
            },
        ]);

        assert.equal(
            summary,
            "Nama panggilan yang disukai: Bima\nTopik favorit user: anime dan game",
        );
    });
});
