import { create } from 'zustand';
import type { BotConfig } from '@whatsapp-bot/shared';
import { configService } from '../lib/services/configService';

const DEFAULT_CONFIG: BotConfig = {
  bot_name: 'Bot Gila',
  system_prompt: 'Nama kamu adalah Bot Gila, mesin pembuat kocak dan pengejek di grup.',
  is_active: true,
  ignore_groups: false,
  tone_style: 'pedas'
};

interface ConfigStore {
  config: BotConfig | null;
  draft: BotConfig;
  isDirty: boolean;
  isSaving: boolean;
  testReply: string | null;
  isTesting: boolean;
  loadConfig: () => Promise<void>;
  updateField: <K extends keyof BotConfig>(key: K, value: BotConfig[K]) => void;
  saveConfig: () => Promise<void>;
  resetToDefaults: () => void;
  testPrompt: (message: string) => Promise<void>;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: null,
  draft: DEFAULT_CONFIG,
  isDirty: false,
  isSaving: false,
  testReply: null,
  isTesting: false,
  loadConfig: async () => {
    const config = await configService.get();
    set({ config, draft: config, isDirty: false });
  },
  updateField: (key, value) =>
    set((state) => ({
      draft: { ...state.draft, [key]: value },
      isDirty: true
    })),
  saveConfig: async () => {
    set({ isSaving: true });
    const config = await configService.update(get().draft);
    set({ config, draft: config, isDirty: false, isSaving: false });
  },
  resetToDefaults: () => set({ draft: DEFAULT_CONFIG, isDirty: true }),
  testPrompt: async (message) => {
    set({ isTesting: true, testReply: null });
    const response = await configService.testPrompt({ message, config: get().draft });
    set({ testReply: response.reply, isTesting: false });
  }
}));
