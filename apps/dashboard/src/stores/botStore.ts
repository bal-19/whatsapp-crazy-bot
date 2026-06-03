import { create } from 'zustand';
import type { AnalyticsSummary, BotStatus, BotStatusResponse } from '@whatsapp-bot/shared';
import { botService } from '../lib/services/botService';
import { analyticsService } from '../lib/services/analyticsService';

interface BotStore {
  status: BotStatus;
  uptimeSeconds: number;
  totalMessagesToday: number;
  queueSize: number;
  analytics: AnalyticsSummary | null;
  isLoading: boolean;
  setStatus: (status: BotStatus) => void;
  setAnalytics: (analytics: AnalyticsSummary) => void;
  loadStatus: () => Promise<void>;
  loadAnalytics: () => Promise<void>;
  restartBot: () => Promise<void>;
}

export const useBotStore = create<BotStore>((set) => ({
  status: 'disconnected',
  uptimeSeconds: 0,
  totalMessagesToday: 0,
  queueSize: 0,
  analytics: null,
  isLoading: false,
  setStatus: (status) => set({ status }),
  setAnalytics: (analytics) => set({ analytics }),
  loadStatus: async () => {
    set({ isLoading: true });
    const status = await botService.getStatus();
    applyStatus(set, status);
  },
  loadAnalytics: async () => {
    const analytics = await analyticsService.getSummary();
    set({ analytics });
  },
  restartBot: async () => {
    const status = await botService.restart();
    applyStatus(set, status);
  }
}));

function applyStatus(set: (partial: Partial<BotStore>) => void, status: BotStatusResponse): void {
  set({
    status: status.status,
    uptimeSeconds: status.uptime_seconds,
    totalMessagesToday: status.total_messages_today,
    queueSize: status.queue_size,
    isLoading: false
  });
}
