import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type {
  AnalyticsSummary,
  BotConfig,
  ConversationDetail,
  ConversationSummary,
  Message,
  MessageDirection,
  MessageStatus,
  PaginatedResponse,
  SystemLog
} from '@whatsapp-bot/shared';
import { env } from '../config/env.js';

const DEFAULT_PERSONA = `Nama kamu adalah Bot Gila, mesin pembuat kocak dan pengejek di grup.

Tentang kamu:
- Kamu adalah opsi ketiga setelah "ask Google" dan "ask Mom" - basically useless tapi entertaining
- Spesialisasi: roasting group members, dad jokes level dewa, sarcasm yang pedas

Gaya bercanda mu:
- Smart-ass tapi tidak annoying
- Satir terhadap situasi, bukan personal attack
- Jika ada yang asking for help seriously, respond dengan helpful + humor ringan`;

export class AppDatabase {
  private db: Database.Database;

  constructor(filename = env.DATABASE_PATH) {
    const dir = path.dirname(filename);
    if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });
    this.db = new Database(filename);
    this.db.pragma('journal_mode = WAL');
    this.migrate();
    this.seedDefaults();
  }

  migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT,
        is_blocked INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        last_seen TEXT
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        direction TEXT CHECK(direction IN ('inbound', 'outbound')),
        body TEXT NOT NULL,
        status TEXT DEFAULT 'sent',
        ai_model TEXT,
        tokens_used INTEGER,
        latency_ms INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (contact_id) REFERENCES contacts(id)
      );

      CREATE TABLE IF NOT EXISTS bot_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT CHECK(level IN ('info', 'warn', 'error')),
        message TEXT NOT NULL,
        meta TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_messages_contact_created ON messages(contact_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_logs_created ON system_logs(created_at);
    `);
  }

  seedDefaults(): void {
    const defaults: BotConfig = {
      system_prompt: DEFAULT_PERSONA,
      bot_name: 'Bot Gila',
      is_active: true,
      ignore_groups: false,
      tone_style: 'pedas'
    };

    const stmt = this.db.prepare('INSERT OR IGNORE INTO bot_config (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(defaults)) {
      stmt.run(key, String(value));
    }
  }

  getConfig(): BotConfig {
    const rows = this.db.prepare('SELECT key, value FROM bot_config').all() as Array<{ key: string; value: string }>;
    const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));

    return {
      system_prompt: map.system_prompt ?? DEFAULT_PERSONA,
      bot_name: map.bot_name ?? 'Bot Gila',
      is_active: map.is_active !== 'false' && map.is_active !== '0',
      ignore_groups: map.ignore_groups === 'true' || map.ignore_groups === '1',
      tone_style: (map.tone_style as BotConfig['tone_style']) ?? 'pedas'
    };
  }

  updateConfig(patch: Partial<BotConfig>): BotConfig {
    const stmt = this.db.prepare(`
      INSERT INTO bot_config (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `);

    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) stmt.run(key, String(value));
    }

    return this.getConfig();
  }

  upsertContact(id: string, name?: string | null): void {
    this.db
      .prepare(
        `INSERT INTO contacts (id, name, last_seen)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name = COALESCE(excluded.name, contacts.name),
           last_seen = datetime('now')`
      )
      .run(id, name ?? null);
  }

  insertMessage(input: {
    id: string;
    contact_id: string;
    direction: MessageDirection;
    body: string;
    status?: MessageStatus;
    ai_model?: string | null;
    tokens_used?: number | null;
    latency_ms?: number | null;
  }): Message {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO messages
          (id, contact_id, direction, body, status, ai_model, tokens_used, latency_ms)
         VALUES (@id, @contact_id, @direction, @body, @status, @ai_model, @tokens_used, @latency_ms)`
      )
      .run({
        ...input,
        status: input.status ?? 'sent',
        ai_model: input.ai_model ?? null,
        tokens_used: input.tokens_used ?? null,
        latency_ms: input.latency_ms ?? null
      });

    return this.db.prepare('SELECT * FROM messages WHERE id = ?').get(input.id) as Message;
  }

  listConversations(page = 1, limit = 20): PaginatedResponse<ConversationSummary> {
    const offset = (page - 1) * limit;
    const total = (this.db.prepare('SELECT COUNT(*) AS count FROM contacts').get() as { count: number }).count;
    const data = this.db
      .prepare(
        `SELECT
          c.id AS contact_id,
          c.name AS contact_name,
          m.body AS last_message,
          m.created_at AS last_message_at,
          (SELECT COUNT(*) FROM messages WHERE contact_id = c.id) AS message_count,
          (SELECT ROUND(AVG(latency_ms)) FROM messages WHERE contact_id = c.id AND direction = 'outbound' AND latency_ms IS NOT NULL) AS avg_response_time_ms
        FROM contacts c
        JOIN messages m ON m.id = (
          SELECT id FROM messages WHERE contact_id = c.id ORDER BY datetime(created_at) DESC LIMIT 1
        )
        ORDER BY datetime(m.created_at) DESC
        LIMIT ? OFFSET ?`
      )
      .all(limit, offset) as ConversationSummary[];

    return { data, pagination: { page, limit, total } };
  }

  getConversation(contactId: string): ConversationDetail | null {
    const contact = this.db.prepare('SELECT id, name FROM contacts WHERE id = ?').get(contactId) as
      | { id: string; name: string | null }
      | undefined;
    if (!contact) return null;

    const messages = this.db
      .prepare('SELECT * FROM messages WHERE contact_id = ? ORDER BY datetime(created_at) ASC')
      .all(contactId) as Message[];

    return { contact, messages };
  }

  clearConversation(contactId: string): void {
    this.db.prepare('DELETE FROM messages WHERE contact_id = ?').run(contactId);
  }

  getRecentHistory(contactId: string, limit = 20): Message[] {
    return this.db
      .prepare('SELECT * FROM messages WHERE contact_id = ? ORDER BY datetime(created_at) DESC LIMIT ?')
      .all(contactId, limit)
      .reverse() as Message[];
  }

  getTotalMessagesToday(): number {
    return (
      this.db
        .prepare("SELECT COUNT(*) AS count FROM messages WHERE date(created_at, 'localtime') = date('now', 'localtime')")
        .get() as { count: number }
    ).count;
  }

  getAnalyticsSummary(): AnalyticsSummary {
    const row = this.db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM messages WHERE date(created_at, 'localtime') = date('now', 'localtime')) AS messages_today,
          (SELECT COUNT(*) FROM messages WHERE datetime(created_at) >= datetime('now', '-7 days')) AS messages_this_week,
          (SELECT COUNT(DISTINCT contact_id) FROM messages WHERE date(created_at, 'localtime') = date('now', 'localtime')) AS active_contacts_today,
          COALESCE((SELECT ROUND(AVG(latency_ms)) FROM messages WHERE direction = 'outbound' AND latency_ms IS NOT NULL), 0) AS avg_response_time_ms,
          (SELECT COUNT(*) FROM system_logs WHERE level = 'error' AND message LIKE '%gemini%' AND date(created_at, 'localtime') = date('now', 'localtime')) AS gemini_errors_today`
      )
      .get() as AnalyticsSummary;
    return row;
  }

  addLog(level: SystemLog['level'], message: string, meta?: Record<string, unknown>): SystemLog {
    const result = this.db
      .prepare('INSERT INTO system_logs (level, message, meta) VALUES (?, ?, ?)')
      .run(level, message, meta ? JSON.stringify(meta) : null);
    const row = this.db.prepare('SELECT * FROM system_logs WHERE id = ?').get(result.lastInsertRowid) as Omit<SystemLog, 'meta'> & {
      meta: string | null;
    };

    return {
      ...row,
      meta: row.meta ? (JSON.parse(row.meta) as Record<string, unknown>) : null
    };
  }

  listLogs(level?: string, limit = 100): SystemLog[] {
    const rows = level
      ? (this.db
          .prepare('SELECT * FROM system_logs WHERE level = ? ORDER BY datetime(created_at) DESC LIMIT ?')
          .all(level, limit) as Array<Omit<SystemLog, 'meta'> & { meta: string | null }>)
      : (this.db
          .prepare('SELECT * FROM system_logs ORDER BY datetime(created_at) DESC LIMIT ?')
          .all(limit) as Array<Omit<SystemLog, 'meta'> & { meta: string | null }>);

    return rows.map((row) => ({ ...row, meta: row.meta ? (JSON.parse(row.meta) as Record<string, unknown>) : null }));
  }

  close(): void {
    this.db.close();
  }
}

export const appDb = new AppDatabase();
