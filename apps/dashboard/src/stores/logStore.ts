import { create } from 'zustand';
import type { SystemLog } from '@whatsapp-bot/shared';
import { logService } from '../lib/services/logService';

interface LogStore {
  logs: SystemLog[];
  isLoading: boolean;
  loadLogs: (level?: string) => Promise<void>;
  prependLog: (log: SystemLog) => void;
}

export const useLogStore = create<LogStore>((set) => ({
  logs: [],
  isLoading: false,
  loadLogs: async (level) => {
    set({ isLoading: true });
    const logs = await logService.getAll(level);
    set({ logs, isLoading: false });
  },
  prependLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 100) }))
}));
