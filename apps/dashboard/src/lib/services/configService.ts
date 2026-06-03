import type { BotConfig, TestPromptRequest, TestPromptResponse } from '@whatsapp-bot/shared';
import { api } from '../api';

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
  }
};
