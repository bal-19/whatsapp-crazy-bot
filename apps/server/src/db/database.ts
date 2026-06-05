import crypto from "node:crypto";
import type {
    AnalyticsSummary,
    BotConfig,
    Contact,
    ConversationDetail,
    ConversationSummary,
    CreateContactRequest,
    LogLevel,
    Message,
    MessageDirection,
    MessageStatus,
    PaginatedResponse,
    SystemLog,
    ToneStyle,
    UpdateContactRequest,
    WhatsAppGroup,
} from "@whatsapp-bot/shared";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../lib/supabase.js";
import type { PersonalMemory } from "../ai/personal-memory.js";
import {
    deriveContactJidFromScopeKey,
    deriveGroupJidFromScopeKey,
} from "../bot/conversation-scope.js";

const DEFAULT_PERSONA = `Nama kamu adalah Ikmal, asisten AI yang helpful dengan vibe Gen Z.

Tentang kamu:
- Kamu adalah asisten yang siap membantu dengan gaya bahasa santai ala anak muda
- Friendly, approachable, dan always ready to help
- Paham internet culture, slang Gen Z, dan cara ngobrol yang asik

Gaya komunikasi:
- Pakai bahasa Gen Z yang natural (misal: "gass", "bet", "sabi", "fr fr", "no cap")
- Helpful tapi tetap chill dan tidak kaku
- Emoji usage yang pas (jangan spam, tapi jangan stiff juga)
- Kalau bingung atau ga tau, jujur aja dengan cara yang asik
- Kasih solusi yang praktis dan mudah dipahami

Cara bantu:
- Jawab pertanyaan dengan jelas tapi tetap fun
- Kasih tips/saran yang berguna
- Support dan encouraging ke user
- Kalau ada yang butuh bantuan serius, tetap profesional tapi ga usah formal banget

Contoh gaya bahasa:
- "Sabi banget nih! Gas langsung aja..."
- "Oke bet, jadi gini ya..."
- "Fr fr ini solusinya..."
- "No cap, itu emang work sih..."
- "Santuy, aku jelasin step by step ya..."`;

const DEFAULT_CONFIG: BotConfig = {
    system_prompt: DEFAULT_PERSONA,
    bot_name: "Ikmal",
    is_active: true,
    ignore_groups: false,
    tone_style: "helpful",
};

interface ContactRow {
    id: string;
    whatsapp_jid: string;
    display_name: string | null;
    is_blocked: boolean;
    created_at: string;
    updated_at: string;
    last_seen_at: string | null;
}

interface WhatsAppGroupRow {
    id: string;
    group_jid: string;
    display_name: string | null;
    created_at: string;
    updated_at: string;
}

interface ConversationScopeRow {
    id: string;
    scope_key: string;
    contact_id?: string | null;
    contact_jid?: string | null;
    group_jid: string | null;
    created_at: string;
    updated_at: string;
    last_seen_at: string | null;
}

interface MessageRow {
    id: string;
    whatsapp_message_id: string;
    contact_id: string;
    direction: MessageDirection;
    body: string;
    status: MessageStatus;
    ai_model: string | null;
    tokens_used: number | null;
    latency_ms: number | null;
    raw_payload: Record<string, unknown> | null;
    created_at: string;
}

interface BotSettingsRow {
    id: string;
    bot_name: string;
    system_prompt: string;
    is_active: boolean;
    ignore_groups: boolean;
    tone_style: ToneStyle;
    updated_at: string;
}

interface SystemLogRow {
    id: number;
    level: LogLevel;
    event: string;
    message: string;
    meta: Record<string, unknown> | null;
    created_at: string;
}

interface PersonalMemoryRow {
    id: string;
    contact_id: string;
    memory_key: string;
    memory_value: string;
    confidence: number | null;
    source_message_id: string | null;
    created_at: string;
    updated_at: string;
}

interface ConversationSummaryRow {
    contact_id: string;
    contact_jid?: string | null;
    contact_name: string | null;
    group_name: string | null;
    last_message: string;
    last_message_at: string;
    message_count: number;
    avg_response_time_ms: number | null;
}

interface DailyMessageVolume {
    date: string;
    label: string;
    messages: number;
}

function hasDisplayNameValue(value?: string | null): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function resolveDisplayName(
    current?: string | null,
    incoming?: string | null,
): string | null {
    if (hasDisplayNameValue(current)) {
        return current;
    }

    return hasDisplayNameValue(incoming) ? incoming.trim() : (current ?? null);
}

interface DatabaseAdapter {
    getConfig(): Promise<BotConfig>;
    updateConfig(patch: Partial<BotConfig>): Promise<BotConfig>;
    listContacts(): Promise<Contact[]>;
    getContact(contactId: string): Promise<Contact | null>;
    createContact(input: CreateContactRequest): Promise<Contact>;
    updateContact(
        contactId: string,
        patch: UpdateContactRequest,
    ): Promise<Contact | null>;
    deleteContact(contactId: string): Promise<void>;
    upsertContact(id: string, name?: string | null): Promise<void>;
    listGroups(): Promise<WhatsAppGroup[]>;
    upsertGroup(groupJid: string, name?: string | null): Promise<WhatsAppGroup>;
    insertMessage(input: {
        id: string;
        contact_id: string;
        direction: MessageDirection;
        body: string;
        status?: MessageStatus;
        ai_model?: string | null;
        tokens_used?: number | null;
        latency_ms?: number | null;
        raw_payload?: Record<string, unknown> | null;
    }): Promise<Message>;
    listConversations(
        page?: number,
        limit?: number,
    ): Promise<PaginatedResponse<ConversationSummary>>;
    getConversation(contactId: string): Promise<ConversationDetail | null>;
    clearConversation(contactId: string): Promise<void>;
    getRecentHistory(contactId: string, limit?: number): Promise<Message[]>;
    listPersonalMemories(contactId: string): Promise<PersonalMemory[]>;
    upsertPersonalMemory(
        contactId: string,
        memory: PersonalMemory,
    ): Promise<void>;
    clearPersonalMemories(contactId: string): Promise<void>;
    purgeOperationalData(): Promise<{
        contactsDeleted: number;
        messagesDeleted: number;
        memoriesDeleted: number;
    }>;
    getTotalMessagesToday(): Promise<number>;
    getAnalyticsSummary(): Promise<AnalyticsSummary>;
    addLog(
        level: LogLevel,
        message: string,
        meta?: Record<string, unknown>,
    ): Promise<SystemLog>;
    listLogs(level?: string, limit?: number): Promise<SystemLog[]>;
    close(): Promise<void>;
}

class AppDatabase {
    constructor(private readonly adapter: DatabaseAdapter) {}

    getConfig(): Promise<BotConfig> {
        return this.adapter.getConfig();
    }

    updateConfig(patch: Partial<BotConfig>): Promise<BotConfig> {
        return this.adapter.updateConfig(patch);
    }

    listContacts(): Promise<Contact[]> {
        return this.adapter.listContacts();
    }

    getContact(contactId: string): Promise<Contact | null> {
        return this.adapter.getContact(contactId);
    }

    createContact(input: CreateContactRequest): Promise<Contact> {
        return this.adapter.createContact(input);
    }

    updateContact(
        contactId: string,
        patch: UpdateContactRequest,
    ): Promise<Contact | null> {
        return this.adapter.updateContact(contactId, patch);
    }

    deleteContact(contactId: string): Promise<void> {
        return this.adapter.deleteContact(contactId);
    }

    upsertContact(id: string, name?: string | null): Promise<void> {
        return this.adapter.upsertContact(id, name);
    }

    listGroups(): Promise<WhatsAppGroup[]> {
        return this.adapter.listGroups();
    }

    upsertGroup(groupJid: string, name?: string | null): Promise<WhatsAppGroup> {
        return this.adapter.upsertGroup(groupJid, name);
    }

    insertMessage(
        input: Parameters<DatabaseAdapter["insertMessage"]>[0],
    ): Promise<Message> {
        return this.adapter.insertMessage(input);
    }

    listConversations(
        page = 1,
        limit = 20,
    ): Promise<PaginatedResponse<ConversationSummary>> {
        return this.adapter.listConversations(page, limit);
    }

    getConversation(contactId: string): Promise<ConversationDetail | null> {
        return this.adapter.getConversation(contactId);
    }

    clearConversation(contactId: string): Promise<void> {
        return this.adapter.clearConversation(contactId);
    }

    getRecentHistory(contactId: string, limit = 20): Promise<Message[]> {
        return this.adapter.getRecentHistory(contactId, limit);
    }

    listPersonalMemories(contactId: string): Promise<PersonalMemory[]> {
        return this.adapter.listPersonalMemories(contactId);
    }

    upsertPersonalMemory(
        contactId: string,
        memory: PersonalMemory,
    ): Promise<void> {
        return this.adapter.upsertPersonalMemory(contactId, memory);
    }

    clearPersonalMemories(contactId: string): Promise<void> {
        return this.adapter.clearPersonalMemories(contactId);
    }

    purgeOperationalData(): Promise<{
        contactsDeleted: number;
        messagesDeleted: number;
        memoriesDeleted: number;
    }> {
        return this.adapter.purgeOperationalData();
    }

    getTotalMessagesToday(): Promise<number> {
        return this.adapter.getTotalMessagesToday();
    }

    getAnalyticsSummary(): Promise<AnalyticsSummary> {
        return this.adapter.getAnalyticsSummary();
    }

    addLog(
        level: LogLevel,
        message: string,
        meta?: Record<string, unknown>,
    ): Promise<SystemLog> {
        return this.adapter.addLog(level, message, meta);
    }

    listLogs(level?: string, limit = 100): Promise<SystemLog[]> {
        return this.adapter.listLogs(level, limit);
    }

    close(): Promise<void> {
        return this.adapter.close();
    }
}

class InMemoryDatabase implements DatabaseAdapter {
    private config: BotConfig = { ...DEFAULT_CONFIG };
    private contacts = new Map<string, ContactRow>();
    private conversationScopes = new Map<string, ConversationScopeRow>();
    private groups = new Map<string, WhatsAppGroupRow>();
    private messages: MessageRow[] = [];
    private personalMemories = new Map<string, PersonalMemoryRow[]>();
    private logs: SystemLog[] = [];
    private nextLogId = 1;

    async getConfig(): Promise<BotConfig> {
        return { ...this.config };
    }

    async updateConfig(patch: Partial<BotConfig>): Promise<BotConfig> {
        this.config = { ...this.config, ...patch };
        return this.getConfig();
    }

    async listContacts(): Promise<Contact[]> {
        return [...this.contacts.values()]
            .sort((a, b) => {
                const aTime = a.last_seen_at ? Date.parse(a.last_seen_at) : 0;
                const bTime = b.last_seen_at ? Date.parse(b.last_seen_at) : 0;
                return (
                    bTime - aTime ||
                    Date.parse(b.created_at) - Date.parse(a.created_at)
                );
            })
            .map(mapContactRow);
    }

    async getContact(contactId: string): Promise<Contact | null> {
        const row = this.contacts.get(normalizeContactJid(contactId));
        return row ? mapContactRow(row) : null;
    }

    async createContact(input: CreateContactRequest): Promise<Contact> {
        const contactJid = normalizeContactJid(input.id);
        const now = new Date().toISOString();
        if (this.contacts.has(contactJid)) {
            throw new Error("Contact dengan WhatsApp JID tersebut sudah ada.");
        }

        const row: ContactRow = {
            id: crypto.randomUUID(),
            whatsapp_jid: contactJid,
            display_name: input.name ?? null,
            is_blocked: input.is_blocked ?? false,
            created_at: now,
            updated_at: now,
            last_seen_at: input.last_seen ?? null,
        };

        this.contacts.set(contactJid, row);
        return mapContactRow(row);
    }

    async updateContact(
        contactId: string,
        patch: UpdateContactRequest,
    ): Promise<Contact | null> {
        const normalizedContactId = normalizeContactJid(contactId);
        const current = this.contacts.get(normalizedContactId);
        if (!current) return null;

        const nextId = normalizeContactJid(
            patch.id?.trim() || current.whatsapp_jid,
        );
        if (nextId !== normalizedContactId && this.contacts.has(nextId)) {
            throw new Error("Contact dengan WhatsApp JID tersebut sudah ada.");
        }

        const updated: ContactRow = {
            ...current,
            whatsapp_jid: nextId,
            display_name:
                patch.name !== undefined ? patch.name : current.display_name,
            is_blocked: patch.is_blocked ?? current.is_blocked,
            last_seen_at:
                patch.last_seen !== undefined
                    ? patch.last_seen
                    : current.last_seen_at,
            updated_at: new Date().toISOString(),
        };

        if (nextId !== normalizedContactId) {
            this.contacts.delete(normalizedContactId);
            this.conversationScopes = new Map(
                [...this.conversationScopes.entries()].map(([scopeKey, scope]) => {
                    if (scope.contact_jid !== normalizedContactId) {
                        return [scopeKey, scope];
                    }

                    return [
                        scopeKey,
                        {
                            ...scope,
                            contact_jid: nextId,
                            updated_at: updated.updated_at,
                        },
                    ];
                }),
            );
        }

        this.contacts.set(nextId, updated);
        return mapContactRow(updated);
    }

    async deleteContact(contactId: string): Promise<void> {
        const normalizedContactId = normalizeContactJid(contactId);
        this.contacts.delete(normalizedContactId);
        const scopeKeys = [...this.conversationScopes.values()]
            .filter((scope) => scope.contact_jid === normalizedContactId)
            .map((scope) => scope.scope_key);
        this.conversationScopes = new Map(
            [...this.conversationScopes.entries()].filter(
                ([, scope]) => scope.contact_jid !== normalizedContactId,
            ),
        );
        this.messages = this.messages.filter(
            (message) => !scopeKeys.includes(message.contact_id),
        );
        for (const scopeKey of scopeKeys) {
            this.personalMemories.delete(scopeKey);
        }
    }

    async upsertContact(id: string, name?: string | null): Promise<void> {
        const normalizedContactId = normalizeContactJid(id);
        const existing = this.contacts.get(normalizedContactId);
        const now = new Date().toISOString();
        this.contacts.set(normalizedContactId, {
            id: existing?.id ?? crypto.randomUUID(),
            whatsapp_jid: normalizedContactId,
            display_name: resolveDisplayName(existing?.display_name, name),
            is_blocked: existing?.is_blocked ?? false,
            created_at: existing?.created_at ?? now,
            updated_at: now,
            last_seen_at: now,
        });
    }

    private ensureConversationScope(
        scopeKey: string,
        contactName?: string | null,
    ): ConversationScopeRow {
        const now = new Date().toISOString();
        const contactJid = deriveContactJidFromScopeKey(scopeKey);
        const groupJid = deriveGroupJidFromScopeKey(scopeKey);
        void this.upsertContact(contactJid, contactName);

        const existing = this.conversationScopes.get(scopeKey);
        const row: ConversationScopeRow = {
            id: existing?.id ?? crypto.randomUUID(),
            scope_key: scopeKey,
            contact_jid: contactJid,
            group_jid: groupJid,
            created_at: existing?.created_at ?? now,
            updated_at: now,
            last_seen_at: now,
        };
        this.conversationScopes.set(scopeKey, row);
        return row;
    }

    async listGroups(): Promise<WhatsAppGroup[]> {
        return [...this.groups.values()]
            .sort(
                (a, b) =>
                    Date.parse(b.updated_at) - Date.parse(a.updated_at) ||
                    Date.parse(b.created_at) - Date.parse(a.created_at),
            )
            .map(mapWhatsAppGroupRow);
    }

    async upsertGroup(
        groupJid: string,
        name?: string | null,
    ): Promise<WhatsAppGroup> {
        const existing = this.groups.get(groupJid);
        const now = new Date().toISOString();
        const row: WhatsAppGroupRow = {
            id: existing?.id ?? crypto.randomUUID(),
            group_jid: groupJid,
            display_name: resolveDisplayName(existing?.display_name, name),
            created_at: existing?.created_at ?? now,
            updated_at: now,
        };
        this.groups.set(groupJid, row);
        return mapWhatsAppGroupRow(row);
    }

    async insertMessage(input: {
        id: string;
        contact_id: string;
        direction: MessageDirection;
        body: string;
        status?: MessageStatus;
        ai_model?: string | null;
        tokens_used?: number | null;
        latency_ms?: number | null;
        raw_payload?: Record<string, unknown> | null;
    }): Promise<Message> {
        this.ensureConversationScope(input.contact_id);

        const now = new Date().toISOString();
        const row: MessageRow = {
            id: crypto.randomUUID(),
            whatsapp_message_id: input.id,
            contact_id: input.contact_id,
            direction: input.direction,
            body: input.body,
            status: input.status ?? "sent",
            ai_model: input.ai_model ?? null,
            tokens_used: input.tokens_used ?? null,
            latency_ms: input.latency_ms ?? null,
            raw_payload: input.raw_payload ?? null,
            created_at: now,
        };

        const existingIndex = this.messages.findIndex(
            (message) => message.whatsapp_message_id === input.id,
        );
        if (existingIndex >= 0) {
            this.messages[existingIndex] = row;
        } else {
            this.messages.push(row);
        }

        return mapMessageRow(row, input.contact_id);
    }

    async listConversations(
        page = 1,
        limit = 20,
    ): Promise<PaginatedResponse<ConversationSummary>> {
        const summaries = [...this.contacts.values()]
            .map((contact) => {
                const scopes = [...this.conversationScopes.values()].filter(
                    (scope) => scope.contact_jid === contact.whatsapp_jid,
                );
                if (scopes.length === 0) return null;

                return scopes.map((scope) => {
                const contactMessages = this.messages
                    .filter(
                        (message) => message.contact_id === scope.scope_key,
                    )
                    .sort(
                        (a, b) =>
                            Date.parse(b.created_at) - Date.parse(a.created_at),
                    );

                if (contactMessages.length === 0) return null;

                const outboundWithLatency = contactMessages.filter(
                    (message) =>
                        message.direction === "outbound" &&
                        typeof message.latency_ms === "number",
                );

                const avgResponseTimeMs =
                    outboundWithLatency.length === 0
                        ? null
                        : Math.round(
                              outboundWithLatency.reduce(
                                  (total, message) =>
                                      total + (message.latency_ms ?? 0),
                                  0,
                              ) / outboundWithLatency.length,
                          );

                return {
                    contact_id: scope.scope_key,
                    contact_name: contact.display_name,
                    group_name: this.resolveGroupName(scope.scope_key),
                    last_message: contactMessages[0]!.body,
                    last_message_at: contactMessages[0]!.created_at,
                    message_count: contactMessages.length,
                    avg_response_time_ms: avgResponseTimeMs,
                } satisfies ConversationSummary;
                });
            })
            .flat()
            .filter((value): value is ConversationSummary => value !== null)
            .sort(
                (a, b) =>
                    Date.parse(b.last_message_at) -
                    Date.parse(a.last_message_at),
            );

        const offset = (page - 1) * limit;
        return {
            data: summaries.slice(offset, offset + limit),
            pagination: {
                page,
                limit,
                total: summaries.length,
            },
        };
    }

    async getConversation(
        contactId: string,
    ): Promise<ConversationDetail | null> {
        const scope = this.conversationScopes.get(contactId);
        const contactJid = scope?.contact_jid;
        if (!scope || !contactJid) return null;
        const contact = this.contacts.get(contactJid);
        if (!contact) return null;

        const messages = this.messages
            .filter((message) => message.contact_id === contactId)
            .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
            .map((message) => mapMessageRow(message, contactId));

        return {
            contact: {
                id: scope.scope_key,
                name: contact.display_name,
            },
            messages,
        };
    }

    async clearConversation(contactId: string): Promise<void> {
        this.messages = this.messages.filter(
            (message) => message.contact_id !== contactId,
        );
    }

    async getRecentHistory(contactId: string, limit = 20): Promise<Message[]> {
        return this.messages
            .filter((message) => message.contact_id === contactId)
            .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
            .slice(0, limit)
            .reverse()
            .map((message) => mapMessageRow(message, contactId));
    }

    async listPersonalMemories(contactId: string): Promise<PersonalMemory[]> {
        return [...(this.personalMemories.get(contactId) ?? [])]
            .sort((a, b) => Date.parse(a.updated_at) - Date.parse(b.updated_at))
            .map(mapPersonalMemoryRow);
    }

    async upsertPersonalMemory(
        contactId: string,
        memory: PersonalMemory,
    ): Promise<void> {
        const current = [...(this.personalMemories.get(contactId) ?? [])];
        const now = new Date().toISOString();
        const existingIndex = current.findIndex(
            (row) => row.memory_key === memory.key,
        );
        const nextRow: PersonalMemoryRow = {
            id:
                existingIndex >= 0
                    ? current[existingIndex]!.id
                    : crypto.randomUUID(),
            contact_id: contactId,
            memory_key: memory.key,
            memory_value: memory.value,
            confidence: memory.confidence,
            source_message_id: memory.sourceMessageId ?? null,
            created_at:
                existingIndex >= 0 ? current[existingIndex]!.created_at : now,
            updated_at: now,
        };

        if (existingIndex >= 0) {
            current[existingIndex] = nextRow;
        } else {
            current.push(nextRow);
        }

        this.personalMemories.set(contactId, current);
    }

    async clearPersonalMemories(contactId: string): Promise<void> {
        this.personalMemories.delete(contactId);
    }

    async purgeOperationalData(): Promise<{
        contactsDeleted: number;
        messagesDeleted: number;
        memoriesDeleted: number;
    }> {
        const contactsDeleted = this.contacts.size;
        const messagesDeleted = this.messages.length;
        const memoriesDeleted = [...this.personalMemories.values()].reduce(
            (total, rows) => total + rows.length,
            0,
        );

        this.contacts.clear();
        this.conversationScopes.clear();
        this.groups.clear();
        this.messages = [];
        this.personalMemories.clear();

        return {
            contactsDeleted,
            messagesDeleted,
            memoriesDeleted,
        };
    }

    async getTotalMessagesToday(): Promise<number> {
        const { start, end } = getWibDayRange();
        return this.messages.filter((message) => {
            const createdAt = Date.parse(message.created_at);
            return createdAt >= start.getTime() && createdAt < end.getTime();
        }).length;
    }

    async getAnalyticsSummary(): Promise<AnalyticsSummary> {
        const { start, end } = getWibDayRange();
        const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const dailyMessageVolume = buildDailyMessageVolumeFromRows(
            this.messages,
        );

        const messagesToday = this.messages.filter((message) => {
            const createdAt = Date.parse(message.created_at);
            return createdAt >= start.getTime() && createdAt < end.getTime();
        });

        const messagesThisWeek = this.messages.filter(
            (message) => Date.parse(message.created_at) >= weekStart.getTime(),
        );

        const outboundWithLatency = this.messages.filter(
            (message) =>
                message.direction === "outbound" &&
                typeof message.latency_ms === "number",
        );

        const geminiErrorsToday = this.logs.filter(
            (log) =>
                log.level === "error" &&
                /gemini/i.test(log.message) &&
                Date.parse(log.created_at) >= start.getTime() &&
                Date.parse(log.created_at) < end.getTime(),
        ).length;

        return {
            messages_today: messagesToday.length,
            messages_this_week: messagesThisWeek.length,
            active_contacts_today: new Set(
                messagesToday.map(
                    (message) =>
                        this.conversationScopes.get(message.contact_id)
                            ?.contact_jid ?? message.contact_id,
                ),
            ).size,
            avg_response_time_ms:
                outboundWithLatency.length === 0
                    ? 0
                    : Math.round(
                          outboundWithLatency.reduce(
                              (total, message) =>
                                  total + (message.latency_ms ?? 0),
                              0,
                          ) / outboundWithLatency.length,
                      ),
            gemini_errors_today: geminiErrorsToday,
            daily_message_volume: dailyMessageVolume,
        };
    }

    async addLog(
        level: LogLevel,
        message: string,
        meta?: Record<string, unknown>,
    ): Promise<SystemLog> {
        const log: SystemLog = {
            id: this.nextLogId++,
            level,
            message,
            meta: meta ?? null,
            created_at: new Date().toISOString(),
        };
        this.logs.unshift(log);
        return log;
    }

    async listLogs(level?: string, limit = 100): Promise<SystemLog[]> {
        const logs = level
            ? this.logs.filter((log) => log.level === level)
            : this.logs;
        return logs.slice(0, limit);
    }

    async close(): Promise<void> {}

    private resolveGroupName(contactId: string): string | null {
        const groupJid = deriveGroupJidFromScopeKey(contactId);
        return groupJid ? this.groups.get(groupJid)?.display_name ?? null : null;
    }
}

class SupabaseDatabase implements DatabaseAdapter {
    private readonly ready: Promise<void>;

    constructor() {
        this.ready = this.ensureDefaultConfig();
    }

    async getConfig(): Promise<BotConfig> {
        await this.ready;
        const row = await this.fetchRequiredSettingsRow();
        return mapConfigRow(row);
    }

    async updateConfig(patch: Partial<BotConfig>): Promise<BotConfig> {
        await this.ready;
        const current = await this.fetchRequiredSettingsRow();
        const payload = {
            bot_name: patch.bot_name ?? current.bot_name,
            system_prompt: patch.system_prompt ?? current.system_prompt,
            is_active: patch.is_active ?? current.is_active,
            ignore_groups: patch.ignore_groups ?? current.ignore_groups,
            tone_style: patch.tone_style ?? current.tone_style,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin!
            .from("bot_settings")
            .update(payload)
            .eq("id", current.id)
            .select("*")
            .single();

        assertSupabaseSuccess(
            error,
            "Gagal mengupdate bot settings di Supabase.",
        );
        return mapConfigRow(data as BotSettingsRow);
    }

    async listContacts(): Promise<Contact[]> {
        await this.ready;
        const { data, error } = await supabaseAdmin!
            .from("contacts")
            .select("*")
            .order("last_seen_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

        assertSupabaseSuccess(
            error,
            "Gagal mengambil daftar contact dari Supabase.",
        );
        return ((data ?? []) as ContactRow[]).map(mapContactRow);
    }

    async getContact(contactId: string): Promise<Contact | null> {
        await this.ready;
        const row = await this.findContactByJid(normalizeContactJid(contactId));
        return row ? mapContactRow(row) : null;
    }

    async createContact(input: CreateContactRequest): Promise<Contact> {
        await this.ready;
        const contactJid = normalizeContactJid(input.id);

        const payload = {
            whatsapp_jid: contactJid,
            display_name: input.name ?? null,
            is_blocked: input.is_blocked ?? false,
            last_seen_at: input.last_seen ?? null,
        };

        const { data, error } = await supabaseAdmin!
            .from("contacts")
            .insert(payload)
            .select("*")
            .single();

        assertSupabaseSuccess(error, "Gagal membuat contact di Supabase.");
        return mapContactRow(data as ContactRow);
    }

    async updateContact(
        contactId: string,
        patch: UpdateContactRequest,
    ): Promise<Contact | null> {
        await this.ready;
        const current = await this.findContactByJid(
            normalizeContactJid(contactId),
        );
        if (!current) return null;

        const payload = {
            whatsapp_jid: normalizeContactJid(
                patch.id?.trim() || current.whatsapp_jid,
            ),
            display_name:
                patch.name !== undefined ? patch.name : current.display_name,
            is_blocked: patch.is_blocked ?? current.is_blocked,
            last_seen_at:
                patch.last_seen !== undefined
                    ? patch.last_seen
                    : current.last_seen_at,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin!
            .from("contacts")
            .update(payload)
            .eq("id", current.id)
            .select("*")
            .single();

        assertSupabaseSuccess(error, "Gagal mengupdate contact di Supabase.");
        return mapContactRow(data as ContactRow);
    }

    async deleteContact(contactId: string): Promise<void> {
        await this.ready;
        const current = await this.findContactByJid(
            normalizeContactJid(contactId),
        );
        if (!current) return;

        const { error } = await supabaseAdmin!
            .from("contacts")
            .delete()
            .eq("id", current.id);

        assertSupabaseSuccess(error, "Gagal menghapus contact dari Supabase.");
    }

    async upsertContact(id: string, name?: string | null): Promise<void> {
        await this.ready;
        await this.ensureContactIdentity(normalizeContactJid(id), name);
    }

    async listGroups(): Promise<WhatsAppGroup[]> {
        await this.ready;
        const { data, error } = await supabaseAdmin!
            .from("whatsapp_groups")
            .select("*")
            .order("updated_at", { ascending: false });

        assertSupabaseSuccess(
            error,
            "Gagal mengambil daftar group WhatsApp dari Supabase.",
        );
        return ((data ?? []) as WhatsAppGroupRow[]).map(mapWhatsAppGroupRow);
    }

    async upsertGroup(
        groupJid: string,
        name?: string | null,
    ): Promise<WhatsAppGroup> {
        await this.ready;
        return mapWhatsAppGroupRow(await this.ensureGroup(groupJid, name));
    }

    async insertMessage(input: {
        id: string;
        contact_id: string;
        direction: MessageDirection;
        body: string;
        status?: MessageStatus;
        ai_model?: string | null;
        tokens_used?: number | null;
        latency_ms?: number | null;
        raw_payload?: Record<string, unknown> | null;
    }): Promise<Message> {
        await this.ready;
        const scope = await this.ensureConversationScope(input.contact_id);

        const payload = {
            whatsapp_message_id: input.id,
            contact_id: scope.id,
            direction: input.direction,
            body: input.body,
            status: input.status ?? "sent",
            ai_model: input.ai_model ?? null,
            tokens_used: input.tokens_used ?? null,
            latency_ms: input.latency_ms ?? null,
            raw_payload: input.raw_payload ?? null,
        };

        const { data, error } = await supabaseAdmin!
            .from("messages")
            .upsert(payload, { onConflict: "whatsapp_message_id" })
            .select("*")
            .single();

        assertSupabaseSuccess(error, "Gagal menyimpan message ke Supabase.");
        return mapMessageRow(data as MessageRow, scope.scope_key);
    }

    async listConversations(
        page = 1,
        limit = 20,
    ): Promise<PaginatedResponse<ConversationSummary>> {
        await this.ready;
        const offset = (page - 1) * limit;

        const query = supabaseAdmin!
            .from("conversation_summaries")
            .select("*", { count: "exact" })
            .order("last_message_at", { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        assertSupabaseSuccess(
            error,
            "Gagal mengambil daftar percakapan dari Supabase.",
        );

        return {
            data: ((data ?? []) as ConversationSummaryRow[]).map((row) => ({
                contact_id: row.contact_id,
                contact_name: row.contact_name,
                group_name: row.group_name,
                last_message: row.last_message,
                last_message_at: row.last_message_at,
                message_count: Number(row.message_count),
                avg_response_time_ms:
                    row.avg_response_time_ms === null
                        ? null
                        : Number(row.avg_response_time_ms),
            })),
            pagination: {
                page,
                limit,
                total: count ?? 0,
            },
        };
    }

    async getConversation(
        contactId: string,
    ): Promise<ConversationDetail | null> {
        await this.ready;
        const scope = await this.findConversationScopeByKey(contactId);
        if (!scope) return null;
        const contact = await this.findContactById(scope.contact_id ?? "");
        if (!contact) return null;

        const { data, error } = await supabaseAdmin!
            .from("messages")
            .select("*")
            .eq("contact_id", scope.id)
            .order("created_at", { ascending: true });

        assertSupabaseSuccess(
            error,
            "Gagal mengambil history percakapan dari Supabase.",
        );

        return {
            contact: {
                id: scope.scope_key,
                name: contact.display_name,
            },
            messages: ((data ?? []) as MessageRow[]).map((row) =>
                mapMessageRow(row, scope.scope_key),
            ),
        };
    }

    async clearConversation(contactId: string): Promise<void> {
        await this.ready;
        const scope = await this.findConversationScopeByKey(contactId);
        if (!scope) return;

        const { error } = await supabaseAdmin!
            .from("messages")
            .delete()
            .eq("contact_id", scope.id);
        assertSupabaseSuccess(
            error,
            "Gagal menghapus history percakapan dari Supabase.",
        );
    }

    async getRecentHistory(contactId: string, limit = 20): Promise<Message[]> {
        await this.ready;
        const scope = await this.findConversationScopeByKey(contactId);
        if (!scope) return [];

        const { data, error } = await supabaseAdmin!
            .from("messages")
            .select("*")
            .eq("contact_id", scope.id)
            .order("created_at", { ascending: false })
            .limit(limit);

        assertSupabaseSuccess(
            error,
            "Gagal mengambil recent history dari Supabase.",
        );

        return ((data ?? []) as MessageRow[])
            .reverse()
            .map((row) => mapMessageRow(row, scope.scope_key));
    }

    async listPersonalMemories(contactId: string): Promise<PersonalMemory[]> {
        await this.ready;
        const scope = await this.findConversationScopeByKey(contactId);
        if (!scope) return [];

        const { data, error } = await supabaseAdmin!
            .from("contact_memories")
            .select("*")
            .eq("contact_id", scope.id)
            .order("updated_at", { ascending: true });

        assertSupabaseSuccess(
            error,
            "Gagal mengambil personal memory dari Supabase.",
        );
        return ((data ?? []) as PersonalMemoryRow[]).map(mapPersonalMemoryRow);
    }

    async upsertPersonalMemory(
        contactId: string,
        memory: PersonalMemory,
    ): Promise<void> {
        await this.ready;
        const scope = await this.ensureConversationScope(contactId);

        const payload = {
            contact_id: scope.id,
            memory_key: memory.key,
            memory_value: memory.value,
            confidence: memory.confidence ?? null,
            source_message_id: memory.sourceMessageId ?? null,
        };

        const { error } = await supabaseAdmin!
            .from("contact_memories")
            .upsert(payload, { onConflict: "contact_id,memory_key" });

        assertSupabaseSuccess(
            error,
            "Gagal menyimpan personal memory ke Supabase.",
        );
    }

    async clearPersonalMemories(contactId: string): Promise<void> {
        await this.ready;
        const scope = await this.findConversationScopeByKey(contactId);
        if (!scope) return;

        const { error } = await supabaseAdmin!
            .from("contact_memories")
            .delete()
            .eq("contact_id", scope.id);

        assertSupabaseSuccess(
            error,
            "Gagal menghapus personal memory dari Supabase.",
        );
    }

    async purgeOperationalData(): Promise<{
        contactsDeleted: number;
        messagesDeleted: number;
        memoriesDeleted: number;
    }> {
        await this.ready;

        const [contactsCount, messagesCount, memoriesCount] = await Promise.all(
            [
                supabaseAdmin!
                    .from("contacts")
                    .select("id", { count: "exact", head: true }),
                supabaseAdmin!
                    .from("messages")
                    .select("id", { count: "exact", head: true }),
                supabaseAdmin!
                    .from("contact_memories")
                    .select("id", { count: "exact", head: true }),
            ],
        );

        assertSupabaseSuccess(
            contactsCount.error,
            "Gagal menghitung contact sebelum purge.",
        );
        assertSupabaseSuccess(
            messagesCount.error,
            "Gagal menghitung messages sebelum purge.",
        );
        assertSupabaseSuccess(
            memoriesCount.error,
            "Gagal menghitung personal memory sebelum purge.",
        );

        const { error } = await supabaseAdmin!
            .from("contacts")
            .delete()
            .not("id", "is", null);
        assertSupabaseSuccess(
            error,
            "Gagal menghapus data operasional dari Supabase.",
        );

        return {
            contactsDeleted: contactsCount.count ?? 0,
            messagesDeleted: messagesCount.count ?? 0,
            memoriesDeleted: memoriesCount.count ?? 0,
        };
    }

    async getTotalMessagesToday(): Promise<number> {
        await this.ready;
        const { start, end } = getWibDayRange();

        const { count, error } = await supabaseAdmin!
            .from("messages")
            .select("id", { count: "exact", head: true })
            .gte("created_at", start.toISOString())
            .lt("created_at", end.toISOString());

        assertSupabaseSuccess(
            error,
            "Gagal menghitung total message hari ini.",
        );
        return count ?? 0;
    }

    async getAnalyticsSummary(): Promise<AnalyticsSummary> {
        await this.ready;
        const { start, end } = getWibDayRange();
        const weekStart = new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const dailyRanges = getLastWibDayRanges(7);
        const earliestRangeStart =
            dailyRanges[0]?.start.toISOString() ?? start.toISOString();

        const [
            messagesTodayResult,
            messagesThisWeekResult,
            activeContactsResult,
            outboundLatencyResult,
            geminiErrorsResult,
            dailyVolumeResult,
        ] = await Promise.all([
            supabaseAdmin!
                .from("messages")
                .select("id", { count: "exact", head: true })
                .gte("created_at", start.toISOString())
                .lt("created_at", end.toISOString()),
            supabaseAdmin!
                .from("messages")
                .select("id", { count: "exact", head: true })
                .gte("created_at", weekStart),
            supabaseAdmin!
                .from("conversation_summaries")
                .select("contact_jid, last_message_at")
                .gte("last_message_at", start.toISOString())
                .lt("last_message_at", end.toISOString()),
            supabaseAdmin!
                .from("messages")
                .select("latency_ms")
                .eq("direction", "outbound")
                .not("latency_ms", "is", null),
            supabaseAdmin!
                .from("system_logs")
                .select("id", { count: "exact", head: true })
                .eq("level", "error")
                .ilike("message", "%gemini%")
                .gte("created_at", start.toISOString())
                .lt("created_at", end.toISOString()),
            supabaseAdmin!
                .from("messages")
                .select("created_at")
                .gte("created_at", earliestRangeStart),
        ]);

        assertSupabaseSuccess(
            messagesTodayResult.error,
            "Gagal mengambil analytics messages today.",
        );
        assertSupabaseSuccess(
            messagesThisWeekResult.error,
            "Gagal mengambil analytics messages this week.",
        );
        assertSupabaseSuccess(
            activeContactsResult.error,
            "Gagal mengambil analytics active contacts.",
        );
        assertSupabaseSuccess(
            outboundLatencyResult.error,
            "Gagal mengambil analytics response time.",
        );
        assertSupabaseSuccess(
            geminiErrorsResult.error,
            "Gagal mengambil analytics Gemini errors.",
        );
        assertSupabaseSuccess(
            dailyVolumeResult.error,
            "Gagal mengambil analytics volume harian.",
        );

        const latencies = (outboundLatencyResult.data ?? [])
            .map((row) => row.latency_ms)
            .filter((value): value is number => typeof value === "number");
        const dailyMessageVolume = buildDailyMessageVolumeFromTimestamps(
            (dailyVolumeResult.data ?? []).map((row) => row.created_at),
        );

        return {
            messages_today: messagesTodayResult.count ?? 0,
            messages_this_week: messagesThisWeekResult.count ?? 0,
            active_contacts_today: new Set(
                (activeContactsResult.data ?? []).map((row) => row.contact_jid),
            ).size,
            avg_response_time_ms:
                latencies.length === 0
                    ? 0
                    : Math.round(
                          latencies.reduce((total, value) => total + value, 0) /
                              latencies.length,
                      ),
            gemini_errors_today: geminiErrorsResult.count ?? 0,
            daily_message_volume: dailyMessageVolume,
        };
    }

    async addLog(
        level: LogLevel,
        message: string,
        meta?: Record<string, unknown>,
    ): Promise<SystemLog> {
        await this.ready;
        const { data, error } = await supabaseAdmin!
            .from("system_logs")
            .insert({
                level,
                event: message,
                message,
                meta: meta ?? null,
            })
            .select("*")
            .single();

        assertSupabaseSuccess(error, "Gagal menyimpan system log ke Supabase.");
        return mapSystemLogRow(data as SystemLogRow);
    }

    async listLogs(level?: string, limit = 100): Promise<SystemLog[]> {
        await this.ready;

        let query = supabaseAdmin!
            .from("system_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);
        if (level) {
            query = query.eq("level", level);
        }

        const { data, error } = await query;
        assertSupabaseSuccess(
            error,
            "Gagal mengambil system logs dari Supabase.",
        );
        return ((data ?? []) as SystemLogRow[]).map(mapSystemLogRow);
    }

    async close(): Promise<void> {}

    private async ensureDefaultConfig(): Promise<void> {
        const existing = await this.fetchSettingsRow(true);
        if (existing) return;

        const { error } = await supabaseAdmin!
            .from("bot_settings")
            .insert(DEFAULT_CONFIG);
        assertSupabaseSuccess(
            error,
            "Gagal membuat default bot settings di Supabase. Pastikan migration sudah dijalankan.",
        );
    }

    private async fetchSettingsRow(
        allowEmpty = false,
    ): Promise<BotSettingsRow | null> {
        const { data, error } = await supabaseAdmin!
            .from("bot_settings")
            .select("*")
            .limit(1)
            .maybeSingle();
        assertSupabaseSuccess(
            error,
            "Gagal membaca bot settings dari Supabase.",
        );

        if (!data && !allowEmpty) {
            throw new Error(
                "Bot settings belum tersedia di Supabase. Jalankan migration lalu seed default config.",
            );
        }

        return (data as BotSettingsRow | null) ?? null;
    }

    private async fetchRequiredSettingsRow(): Promise<BotSettingsRow> {
        const row = await this.fetchSettingsRow(false);
        if (!row) {
            throw new Error(
                "Bot settings belum tersedia di Supabase. Jalankan migration lalu seed default config.",
            );
        }
        return row;
    }

    private async findContactByJid(jid: string): Promise<ContactRow | null> {
        const { data, error } = await supabaseAdmin!
            .from("contacts")
            .select("*")
            .eq("whatsapp_jid", jid)
            .maybeSingle();

        assertSupabaseSuccess(error, "Gagal mencari contact di Supabase.");
        return (data as ContactRow | null) ?? null;
    }

    private async findContactById(id: string): Promise<ContactRow | null> {
        const { data, error } = await supabaseAdmin!
            .from("contacts")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        assertSupabaseSuccess(error, "Gagal mencari contact by id di Supabase.");
        return (data as ContactRow | null) ?? null;
    }

    private async ensureContactIdentity(
        jid: string,
        name?: string | null,
    ): Promise<ContactRow> {
        const now = new Date().toISOString();
        const existing = await this.findContactByJid(jid);

        if (!existing) {
            const { data, error } = await supabaseAdmin!
                .from("contacts")
                .insert({
                    whatsapp_jid: jid,
                    display_name: hasDisplayNameValue(name)
                        ? name.trim()
                        : null,
                    last_seen_at: now,
                    updated_at: now,
                })
                .select("*")
                .single();

            assertSupabaseSuccess(
                error,
                "Gagal menyimpan contact ke Supabase.",
            );
            return data as ContactRow;
        }

        const { data, error } = await supabaseAdmin!
            .from("contacts")
            .update({
                display_name: resolveDisplayName(existing.display_name, name),
                last_seen_at: now,
                updated_at: now,
            })
            .eq("id", existing.id)
            .select("*")
            .single();

        assertSupabaseSuccess(error, "Gagal menyimpan contact ke Supabase.");
        return data as ContactRow;
    }

    private async findConversationScopeByKey(
        scopeKey: string,
    ): Promise<ConversationScopeRow | null> {
        const { data, error } = await supabaseAdmin!
            .from("conversation_scopes")
            .select("*")
            .eq("scope_key", scopeKey)
            .maybeSingle();

        assertSupabaseSuccess(
            error,
            "Gagal mencari conversation scope di Supabase.",
        );
        return ((data as ConversationScopeRow | null) ?? null) ? {
            ...(data as ConversationScopeRow),
            contact_jid: undefined,
        } : null;
    }

    private async ensureConversationScope(
        scopeKey: string,
        contactName?: string | null,
    ): Promise<ConversationScopeRow> {
        const now = new Date().toISOString();
        const contactJid = deriveContactJidFromScopeKey(scopeKey);
        const groupJid = deriveGroupJidFromScopeKey(scopeKey);
        const contact = await this.ensureContactIdentity(contactJid, contactName);
        const existing = await this.findConversationScopeByKey(scopeKey);

        const payload = {
            scope_key: scopeKey,
            contact_id: contact.id,
            group_jid: groupJid,
            updated_at: now,
            last_seen_at: now,
            ...(existing ? {} : { created_at: now }),
        };

        const { data, error } = await supabaseAdmin!
            .from("conversation_scopes")
            .upsert(payload, { onConflict: "scope_key" })
            .select("*")
            .single();

        assertSupabaseSuccess(
            error,
            "Gagal menyimpan conversation scope ke Supabase.",
        );

        return {
            ...(data as ConversationScopeRow),
            contact_jid: contact.whatsapp_jid,
        };
    }

    private async ensureGroup(
        groupJid: string,
        name?: string | null,
    ): Promise<WhatsAppGroupRow> {
        const now = new Date().toISOString();
        const { data: existingData, error: existingError } = await supabaseAdmin!
            .from("whatsapp_groups")
            .select("*")
            .eq("group_jid", groupJid)
            .maybeSingle();

        assertSupabaseSuccess(
            existingError,
            "Gagal mencari group WhatsApp di Supabase.",
        );

        const existing = (existingData as WhatsAppGroupRow | null) ?? null;
        const payload = {
            group_jid: groupJid,
            display_name: resolveDisplayName(existing?.display_name, name),
            updated_at: now,
            ...(existing ? {} : { created_at: now }),
        };

        const { data, error } = await supabaseAdmin!
            .from("whatsapp_groups")
            .upsert(payload, { onConflict: "group_jid" })
            .select("*")
            .single();

        assertSupabaseSuccess(error, "Gagal menyimpan group ke Supabase.");
        return data as WhatsAppGroupRow;
    }
}

function mapConfigRow(row: BotSettingsRow): BotConfig {
    return {
        system_prompt: row.system_prompt ?? DEFAULT_CONFIG.system_prompt,
        bot_name: row.bot_name ?? DEFAULT_CONFIG.bot_name,
        is_active: row.is_active ?? DEFAULT_CONFIG.is_active,
        ignore_groups: row.ignore_groups ?? DEFAULT_CONFIG.ignore_groups,
        tone_style: row.tone_style ?? DEFAULT_CONFIG.tone_style,
    };
}

function mapContactRow(row: ContactRow): Contact {
    return {
        id: row.whatsapp_jid,
        name: row.display_name,
        is_blocked: row.is_blocked,
        created_at: row.created_at,
        updated_at: row.updated_at,
        last_seen: row.last_seen_at,
    };
}

function mapWhatsAppGroupRow(row: WhatsAppGroupRow): WhatsAppGroup {
    return {
        group_jid: row.group_jid,
        display_name: row.display_name,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function mapMessageRow(row: MessageRow, contactJid: string): Message {
    return {
        id: row.whatsapp_message_id,
        contact_id: contactJid,
        direction: row.direction,
        body: row.body,
        status: row.status,
        ai_model: row.ai_model,
        tokens_used: row.tokens_used,
        latency_ms: row.latency_ms,
        created_at: row.created_at,
    };
}

function mapSystemLogRow(row: SystemLogRow): SystemLog {
    return {
        id: Number(row.id),
        level: row.level,
        message: row.message ?? row.event,
        meta: row.meta ?? null,
        created_at: row.created_at,
    };
}

function mapPersonalMemoryRow(row: PersonalMemoryRow): PersonalMemory {
    return {
        key: row.memory_key as PersonalMemory["key"],
        value: row.memory_value,
        confidence: typeof row.confidence === "number" ? row.confidence : 0,
        sourceMessageId: row.source_message_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function normalizeContactJid(value: string): string {
    return deriveContactJidFromScopeKey(value.trim());
}

function assertSupabaseSuccess(
    error: { message?: string } | null,
    fallbackMessage: string,
): void {
    if (!error) return;

    const message = error.message?.includes("relation")
        ? `${fallbackMessage} Kemungkinan schema Supabase belum dibuat. Jalankan migration terlebih dulu.`
        : `${fallbackMessage} ${error.message ?? ""}`.trim();

    throw new Error(message);
}

function getWibDayRange(now = new Date()): { start: Date; end: Date } {
    const offsetMs = 7 * 60 * 60 * 1000;
    const wibNow = new Date(now.getTime() + offsetMs);
    const startUtc = new Date(
        Date.UTC(
            wibNow.getUTCFullYear(),
            wibNow.getUTCMonth(),
            wibNow.getUTCDate(),
        ) - offsetMs,
    );

    return {
        start: startUtc,
        end: new Date(startUtc.getTime() + 24 * 60 * 60 * 1000),
    };
}

function getLastWibDayRanges(
    days: number,
    now = new Date(),
): Array<{ start: Date; end: Date; date: string; label: string }> {
    const todayRange = getWibDayRange(now);

    return Array.from({ length: days }, (_, index) => {
        const offset = days - 1 - index;
        const start = new Date(
            todayRange.start.getTime() - offset * 24 * 60 * 60 * 1000,
        );
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

        return {
            start,
            end,
            date: formatWibDateKey(start),
            label: offset === 0 ? "Hari ini" : formatWibDayLabel(start),
        };
    });
}

function buildDailyMessageVolumeFromRows(
    messages: MessageRow[],
): DailyMessageVolume[] {
    return buildDailyMessageVolumeFromTimestamps(
        messages.map((message) => message.created_at),
    );
}

function buildDailyMessageVolumeFromTimestamps(
    timestamps: string[],
): DailyMessageVolume[] {
    const ranges = getLastWibDayRanges(7);

    return ranges.map((range) => ({
        date: range.date,
        label: range.label,
        messages: timestamps.filter((timestamp) => {
            const createdAt = Date.parse(timestamp);
            return (
                createdAt >= range.start.getTime() &&
                createdAt < range.end.getTime()
            );
        }).length,
    }));
}

function formatWibDateKey(date: Date): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

function formatWibDayLabel(date: Date): string {
    return new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "short",
    }).format(date);
}

const adapter =
    env.NODE_ENV === "test" ? new InMemoryDatabase() : new SupabaseDatabase();

export const appDb = new AppDatabase(adapter);
