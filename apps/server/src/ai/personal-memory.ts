export type PersonalMemoryKey = "preferred_name" | "favorite_topics";

export interface PersonalMemory {
    key: PersonalMemoryKey;
    value: string;
    confidence: number;
    sourceMessageId?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export function extractPersonalMemories(message: string): PersonalMemory[] {
    const normalized = normalizeMessage(message);
    const memories: PersonalMemory[] = [];

    const preferredName = extractPreferredName(normalized);
    if (preferredName) {
        memories.push({
            key: "preferred_name",
            value: preferredName,
            confidence: 0.95,
        });
    }

    const favoriteTopics = extractFavoriteTopics(normalized);
    if (favoriteTopics) {
        memories.push({
            key: "favorite_topics",
            value: favoriteTopics,
            confidence: 0.8,
        });
    }

    return dedupeMemories(memories);
}

export function buildPersonalMemorySummary(
    memories: PersonalMemory[],
): string | null {
    if (memories.length === 0) return null;

    const parts = memories
        .map((memory) => {
            if (memory.key === "preferred_name") {
                return `Nama panggilan yang disukai: ${memory.value}`;
            }

            if (memory.key === "favorite_topics") {
                return `Topik favorit user: ${memory.value}`;
            }

            return null;
        })
        .filter((value): value is string => Boolean(value));

    return parts.length > 0 ? parts.join("\n") : null;
}

function extractPreferredName(message: string): string | null {
    const patterns = [
        /(?:panggil aku|namaku|nama aku)\s+([a-z0-9][a-z0-9\s]{0,30})/i,
    ];

    for (const pattern of patterns) {
        const match = message.match(pattern);
        const value = cleanMemoryValue(match?.[1]);
        if (value && !looksSensitive(value)) {
            return toDisplayCase(value);
        }
    }

    return null;
}

function extractFavoriteTopics(message: string): string | null {
    const patterns = [
        /(?:aku suka|gue suka|favoritku)\s+([a-z0-9][a-z0-9,\s/&-]{1,60})/i,
    ];

    for (const pattern of patterns) {
        const match = message.match(pattern);
        const value = cleanMemoryValue(match?.[1]);
        if (!value || looksSensitive(value)) continue;
        if (value.split(/\s+/).length > 8) continue;
        return value.toLowerCase();
    }

    return null;
}

function normalizeMessage(message: string): string {
    return message.replace(/\s+/g, " ").trim();
}

function cleanMemoryValue(value?: string | null): string | null {
    const trimmed =
        value
            ?.trim()
            .replace(/[.!?,;:]+$/g, "")
            .replace(/\b(aja|ya|dong|deh)$/i, "")
            .trim() ?? "";
    if (trimmed.length < 2) return null;
    return trimmed;
}

function toDisplayCase(value: string): string {
    return value
        .split(/\s+/)
        .map((word) => word[0]!.toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

function looksSensitive(value: string): boolean {
    return /\b\d{6,}\b/.test(value);
}

function dedupeMemories(memories: PersonalMemory[]): PersonalMemory[] {
    const deduped = new Map<PersonalMemoryKey, PersonalMemory>();
    for (const memory of memories) {
        deduped.set(memory.key, memory);
    }
    return [...deduped.values()];
}
