import type { LogLevel, SystemLog } from '@whatsapp-bot/shared';
import { appDb } from '../db/database.js';
import { emitLog } from '../realtime/socket.js';
import { logger } from '../logging/logger.js';

export const logService = {
  write(level: LogLevel, message: string, meta?: Record<string, unknown>): SystemLog {
    const log = appDb.addLog(level, message, meta);
    emitLog(log);
    logger[level](meta ?? {}, message);
    return log;
  }
};
