import type { ConversationDetail, ConversationSummary, PaginatedResponse } from '@whatsapp-bot/shared';
import { api } from '../api';

export const conversationService = {
  async getAll(page = 1): Promise<PaginatedResponse<ConversationSummary>> {
    const response = await api.get<PaginatedResponse<ConversationSummary>>('/conversations', { params: { page } });
    return response.data;
  },
  async getById(contactId: string): Promise<ConversationDetail> {
    const response = await api.get<ConversationDetail>(`/conversations/${encodeURIComponent(contactId)}`);
    return response.data;
  },
  async clearHistory(contactId: string): Promise<void> {
    await api.delete(`/conversations/${encodeURIComponent(contactId)}/history`);
  }
};
