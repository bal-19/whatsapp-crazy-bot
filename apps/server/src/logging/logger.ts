import pino from 'pino';
import type { LogLevel } from '@whatsapp-bot/shared';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard'
          }
        }
});

export function toLogLevel(level: string): LogLevel {
  if (level === 'error' || level === 'warn' || level === 'info') return level;
  return 'info';
}
