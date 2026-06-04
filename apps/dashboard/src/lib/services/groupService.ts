import type { UpsertWhatsAppGroupRequest, WhatsAppGroup } from '@whatsapp-bot/shared';
import { api } from '../api';

export const groupService = {
  async getAll(): Promise<WhatsAppGroup[]> {
    const response = await api.get<{ data: WhatsAppGroup[] }>('/groups');
    return response.data.data;
  },
  async save(payload: UpsertWhatsAppGroupRequest): Promise<WhatsAppGroup> {
    const response = await api.post<WhatsAppGroup>('/groups', payload);
    return response.data;
  }
};
