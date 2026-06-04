import { appDb } from "../db/database.js";
import {
    buildPersonalMemorySummary,
    extractPersonalMemories,
    type PersonalMemory,
} from "../ai/personal-memory.js";

export const personalMemoryService = {
    async list(contactId: string): Promise<PersonalMemory[]> {
        return appDb.listPersonalMemories(contactId);
    },

    async getSummary(contactId: string): Promise<string | null> {
        return buildPersonalMemorySummary(await this.list(contactId));
    },

    async rememberFromMessage(
        contactId: string,
        message: string,
        sourceMessageId?: string | null,
    ): Promise<PersonalMemory[]> {
        const extracted = extractPersonalMemories(message);
        if (extracted.length === 0) return [];

        for (const memory of extracted) {
            await appDb.upsertPersonalMemory(contactId, {
                ...memory,
                sourceMessageId,
            });
        }

        return this.list(contactId);
    },

    async clear(contactId: string): Promise<void> {
        await appDb.clearPersonalMemories(contactId);
    },
};
