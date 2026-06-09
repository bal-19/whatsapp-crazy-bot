import type { KnowledgeItem } from "@whatsapp-bot/shared";
import { appDb } from "../db/database.js";

interface KnowledgeMatch {
    item: KnowledgeItem;
    score: number;
}

export const knowledgeService = {
    async retrieveRelevantContext(
        message: string,
        limit = 3,
    ): Promise<KnowledgeItem[]> {
        const normalizedMessage = message.toLowerCase();
        const tokens = tokenize(normalizedMessage);
        if (tokens.length === 0) return [];

        const items = await appDb.listKnowledgeItems();
        const ranked = items
            .filter((item) => item.is_active)
            .map((item) => ({ item, score: scoreItem(item, normalizedMessage, tokens) }))
            .filter((entry) => entry.score > 0)
            .sort((a, b) => b.score - a.score || Date.parse(b.item.updated_at) - Date.parse(a.item.updated_at))
            .slice(0, limit);

        return ranked.map((entry) => entry.item);
    },

    formatPromptContext(items: KnowledgeItem[]): string | null {
        if (items.length === 0) return null;

        return items
            .map(
                (item, index) =>
                    `${index + 1}. ${item.title}\nPertanyaan: ${item.question}\nJawaban: ${item.answer}`,
            )
            .join("\n\n");
    },
};

function scoreItem(
    item: KnowledgeItem,
    normalizedMessage: string,
    tokens: string[],
): number {
    let score = 0;
    const haystacks = [
        item.title.toLowerCase(),
        item.question.toLowerCase(),
        item.answer.toLowerCase(),
        item.tags.join(" ").toLowerCase(),
    ];

    for (const token of tokens) {
        if (token.length < 3) continue;
        if (haystacks[0]?.includes(token)) score += 6;
        if (haystacks[1]?.includes(token)) score += 5;
        if (haystacks[2]?.includes(token)) score += 2;
        if (haystacks[3]?.includes(token)) score += 4;
    }

    if (normalizedMessage.includes(item.question.toLowerCase())) {
        score += 8;
    }

    return score;
}

function tokenize(input: string): string[] {
    return input
        .split(/[^a-z0-9@._-]+/i)
        .map((token) => token.trim())
        .filter(Boolean);
}
