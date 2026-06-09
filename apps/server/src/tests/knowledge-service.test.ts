import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { appDb } from "../db/database.js";
import { knowledgeService } from "../services/knowledgeService.js";

describe("knowledgeService", () => {
    it("retrieves active knowledge items that best match the user message", async () => {
        const created = await appDb.createKnowledgeItem({
            title: `Jam Operasional ${Date.now()}`,
            question: "Kapan toko buka?",
            answer: "Toko buka setiap hari pukul 08.00 sampai 21.00 WIB.",
            tags: ["jam", "operasional", "toko"],
            is_active: true,
        });

        await appDb.createKnowledgeItem({
            title: `Nonaktif ${Date.now()}`,
            question: "Apakah ada promo?",
            answer: "Promo lama sudah habis.",
            tags: ["promo"],
            is_active: false,
        });

        const items = await knowledgeService.retrieveRelevantContext(
            "jam buka toko hari ini jam berapa",
        );

        assert.equal(items.some((item) => item.id === created.id), true);

        const promptContext = knowledgeService.formatPromptContext(items);
        assert.match(promptContext ?? "", /Jam Operasional/);
        assert.match(promptContext ?? "", /08.00/);
    });
});
