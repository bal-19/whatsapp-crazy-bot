import type { LogLevel, SystemLog } from '@whatsapp-bot/shared';
import { appDb } from '../db/database.js';
import { emitLog } from '../realtime/socket.js';
import { logger } from '../logging/logger.js';

export const logService = {
  write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    logger[level](meta ?? {}, message);

    void appDb
      .addLog(level, message, meta)
      .then((log: SystemLog) => {
        emitLog(log);
      })
      .catch((error: unknown) => {
        logger.error({ errorMessage: error instanceof Error ? error.message : 'Unknown log error' }, 'log_persist_failed');
      });
  }
};
