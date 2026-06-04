import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { AnalyticsSummary, BotStatus, Message, SystemLog } from '@whatsapp-bot/shared';
import { env } from '../config/env.js';

let io: Server | null = null;

export interface BotStatusPayload {
  status: BotStatus;
  qr_code: string | null;
}

export function initRealtime(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: env.DASHBOARD_ORIGIN,
      credentials: true
    }
  });

  return io;
}

export function emitBotStatus(payload: BotStatusPayload): void {
  io?.emit('bot:status_changed', payload);
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
