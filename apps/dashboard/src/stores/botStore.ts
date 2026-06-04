import { create } from 'zustand';
import type { AnalyticsSummary, BotStatus, BotStatusResponse } from '@whatsapp-bot/shared';
import { botService } from '../lib/services/botService';
import { analyticsService } from '../lib/services/analyticsService';
import { useUIStore } from './uiStore';

interface BotStore {
  status: BotStatus;
  uptimeSeconds: number;
  totalMessagesToday: number;
  queueSize: number;
  qrCode: string | null;
  analytics: AnalyticsSummary | null;
  isLoading: boolean;
  isResettingAuth: boolean;
  setStatus: (status: BotStatus, qrCode?: string | null) => void;
  setAnalytics: (analytics: AnalyticsSummary) => void;
  loadStatus: () => Promise<void>;
  loadAnalytics: () => Promise<void>;
  restartBot: () => Promise<void>;
  resetAuth: () => Promise<void>;
}

export const useBotStore = create<BotStore>((set) => ({
  status: 'disconnected',
  uptimeSeconds: 0,
  totalMessagesToday: 0,
  queueSize: 0,
  qrCode: null,
  analytics: null,
  isLoading: false,
  isResettingAuth: false,
  setStatus: (status, qrCode) => set({ status, qrCode: qrCode ?? null }),
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
  },
  resetAuth: async () => {
    set({ isResettingAuth: true });
    try {
      const status = await botService.resetAuth();
      applyStatus(set, status);
      useUIStore.getState().addToast({
        type: 'success',
        message: 'Auth WhatsApp direset. QR baru akan muncul kalau bot perlu pairing ulang.'
      });
    } finally {
      set({ isResettingAuth: false });
    }
  }
}));

function applyStatus(set: (partial: Partial<BotStore>) => void, status: BotStatusResponse): void {
  set({
    status: status.status,
    uptimeSeconds: status.uptime_seconds,
    totalMessagesToday: status.total_messages_today,
    queueSize: status.queue_size,
    qrCode: status.qr_code,
    isLoading: false
  });
}
