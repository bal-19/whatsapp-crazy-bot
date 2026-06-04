import type { BotConfig, TestPromptRequest, TestPromptResponse } from '@whatsapp-bot/shared';
import { api } from '../api';

export interface PurgeOperationalDataResponse {
  contactsDeleted: number;
  messagesDeleted: number;
  memoriesDeleted: number;
  preserved_tables: string[];
}

export const configService = {
  async get(): Promise<BotConfig> {
    const response = await api.get<BotConfig>('/config');
    return response.data;
  },
  async update(data: Partial<BotConfig>): Promise<BotConfig> {
    const response = await api.put<BotConfig>('/config', data);
    return response.data;
  },
  async testPrompt(data: TestPromptRequest): Promise<TestPromptResponse> {
    const response = await api.post<TestPromptResponse>('/test-prompt', data);
    return response.data;
  },
  async purgeOperationalData(): Promise<PurgeOperationalDataResponse> {
    const response = await api.post<PurgeOperationalDataResponse>('/maintenance/purge-operational-data');
    return response.data;
  }
};
