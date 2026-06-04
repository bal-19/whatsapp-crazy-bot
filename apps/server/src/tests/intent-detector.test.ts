import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectIntent, shouldBotRespond } from "../ai/intent-detector.js";

describe("detectIntent", () => {
    it("detects reset", () => {
        assert.equal(detectIntent("/reset"), "reset");
        assert.equal(detectIntent("mulai dari awal ya"), "reset");
    });

    it("detects handoff", () => {
        assert.equal(detectIntent("bicara dengan manusia"), "handoff");
    });

    it("detects memory reset", () => {
        assert.equal(detectIntent("/resetmemory"), "memory_reset");
        assert.equal(detectIntent("tolong lupain aku dulu"), "memory_reset");
    });

    it("returns normal by default", () => {
        assert.equal(detectIntent("halo"), "normal");
    });
});

describe("shouldBotRespond", () => {
    const botName = "Bot Gila";

    it("responds when bot name is mentioned", () => {
        assert.equal(shouldBotRespond("Bot Gila, kamu gimana?", botName), true);
        assert.equal(shouldBotRespond("bot gila bantuin dong", botName), true);
        assert.equal(shouldBotRespond("BOT GILA!!!", botName), true);
    });

    it("responds when any word from bot name is mentioned", () => {
        assert.equal(shouldBotRespond("bot, siapa kamu?", botName), true);
        assert.equal(shouldBotRespond("gila ya cuaca hari ini", botName), true);
        assert.equal(shouldBotRespond("eh bot bantuin", botName), true);
    });

    it("responds to commands regardless of mention", () => {
        assert.equal(shouldBotRespond("/reset", botName), true);
        assert.equal(shouldBotRespond("/help", botName), true);
        assert.equal(shouldBotRespond("mulai dari awal ya", botName), true);
    });

    it("does not respond when bot name is not mentioned", () => {
        assert.equal(shouldBotRespond("cuaca hari ini panas", botName), false);
        assert.equal(shouldBotRespond("halo semua", botName), false);
        assert.equal(shouldBotRespond("apa kabar?", botName), false);
    });

    it("filters out short words (< 3 chars)", () => {
        const shortNameBot = "AI";
        // Kata 'AI' hanya 2 karakter, jadi akan di-filter dari individual words
        // TAPI nama lengkap 'AI' tetap bisa match karena cek includes(botNameLower)
        assert.equal(shouldBotRespond("ai itu keren", shortNameBot), true);
        assert.equal(
            shouldBotRespond("AI, tolong bantuin", shortNameBot),
            true,
        );

        // Test dengan nama bot yang memiliki kata pendek dan panjang
        const mixedBot = "AI Helper";
        assert.equal(shouldBotRespond("helper dong", mixedBot), true); // 'helper' > 2 chars
        assert.equal(shouldBotRespond("ai helper", mixedBot), true); // full name match
    });

    it("handles multi-word bot names flexibly", () => {
        const multiWordBot = "Asisten Pintar Grup";
        assert.equal(
            shouldBotRespond("asisten, tolong dong", multiWordBot),
            true,
        );
        assert.equal(
            shouldBotRespond("kok pintar banget sih", multiWordBot),
            true,
        );
        assert.equal(shouldBotRespond("grup ini rame ya", multiWordBot), true);
    });

    it("case insensitive matching", () => {
        assert.equal(shouldBotRespond("BOT TOLONG", botName), true);
        assert.equal(shouldBotRespond("gIlA bAnGeT", botName), true);
        assert.equal(shouldBotRespond("Bot Gila", botName), true);
    });
});
