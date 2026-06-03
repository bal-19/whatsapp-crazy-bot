import type { Content } from '@google/generative-ai';

interface Session {
  history: Content[];
  lastActivity: Date;
}

export class ConversationMemory {
  private sessions = new Map<string, Session>();
  private readonly maxTurns: number;
  private readonly ttlMs: number;

  constructor(maxTurns = 10, ttlMs = 3_600_000) {
    this.maxTurns = maxTurns;
    this.ttlMs = ttlMs;
  }

  getHistory(contactId: string): Content[] {
    const session = this.sessions.get(contactId);
    if (!session) return [];

    if (Date.now() - session.lastActivity.getTime() > this.ttlMs) {
      this.sessions.delete(contactId);
      return [];
    }

    return [...session.history];
  }

  addTurn(contactId: string, userMessage: string, modelReply: string): void {
    const history = this.getHistory(contactId);
    history.push(
      { role: 'user', parts: [{ text: userMessage }] },
      { role: 'model', parts: [{ text: modelReply }] }
    );

    const maxMessages = this.maxTurns * 2;
    const trimmed = history.length > maxMessages ? history.slice(history.length - maxMessages) : history;

    this.sessions.set(contactId, {
      history: trimmed,
      lastActivity: new Date()
    });
  }

  hydrate(contactId: string, history: Content[]): void {
    this.sessions.set(contactId, {
      history: history.slice(-this.maxTurns * 2),
      lastActivity: new Date()
    });
  }

  clearSession(contactId: string): void {
    this.sessions.delete(contactId);
  }

  purgeExpired(): number {
    let count = 0;
    for (const [id, session] of this.sessions.entries()) {
      if (Date.now() - session.lastActivity.getTime() > this.ttlMs) {
        this.sessions.delete(id);
        count++;
      }
    }
    return count;
  }
}

export const memory = new ConversationMemory();
setInterval(() => memory.purgeExpired(), 30 * 60 * 1000).unref();
