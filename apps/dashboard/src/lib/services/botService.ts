import type { BotStatusResponse } from '@whatsapp-bot/shared';
import { api } from '../api';

export const botService = {
  async getStatus(): Promise<BotStatusResponse> {
    const response = await api.get<BotStatusResponse>('/status');
    return response.data;
  },
  async restart(): Promise<BotStatusResponse> {
    const response = await api.post<BotStatusResponse>('/bot/restart');
    return response.data;
  }
};
