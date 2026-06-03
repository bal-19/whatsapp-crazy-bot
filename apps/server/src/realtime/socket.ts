import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { AnalyticsSummary, BotStatus, Message, SystemLog } from '@whatsapp-bot/shared';
import { env } from '../config/env.js';

let io: Server | null = null;

export function initRealtime(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: env.DASHBOARD_ORIGIN,
      credentials: true
    }
  });

  return io;
}

export function emitBotStatus(status: BotStatus): void {
  io?.emit('bot:status_changed', { status });
}

export function emitNewMessage(contactId: string, message: Message): void {
  io?.emit('message:new', { contactId, message });
}

export function emitAnalyticsUpdate(data: AnalyticsSummary): void {
  io?.emit('analytics:update', data);
}

export function emitLog(log: SystemLog): void {
  io?.emit('log:new', log);
}
