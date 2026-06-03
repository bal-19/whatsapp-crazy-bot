import type { SystemLog } from '@whatsapp-bot/shared';
import { api } from '../api';

export const logService = {
  async getAll(level?: string): Promise<SystemLog[]> {
    const response = await api.get<{ data: SystemLog[] }>('/logs', { params: { level } });
    return response.data.data;
  }
};
