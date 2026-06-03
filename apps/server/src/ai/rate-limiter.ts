import PQueue from 'p-queue';
import { logService } from '../services/logService.js';

export const geminiQueue = new PQueue({
  interval: 60_000,
  intervalCap: 12,
  concurrency: 1,
  timeout: 30_000,
  throwOnTimeout: true
});

let dailyRequestCount = 0;
let dailyResetAt = getNextMidnight();

geminiQueue.on('add', () => {
  if (geminiQueue.size > 20) {
    logService.write('warn', 'queue_size_high', { size: geminiQueue.size });
  }
});

export function isQueueOverloaded(): boolean {
  return geminiQueue.size > 50;
}

export function incrementDailyCounter(): number {
  if (Date.now() > dailyResetAt.getTime()) {
    dailyRequestCount = 0;
    dailyResetAt = getNextMidnight();
  }

  dailyRequestCount++;

  if (dailyRequestCount === 1200) {
    logService.write('warn', 'gemini_daily_quota_80_percent', { dailyRequestCount });
  }

  return dailyRequestCount;
}

export function getQueueSize(): number {
  return geminiQueue.size + geminiQueue.pending;
}

function getNextMidnight(): Date {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
}
