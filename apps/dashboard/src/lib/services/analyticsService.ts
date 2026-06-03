import type { AnalyticsSummary } from '@whatsapp-bot/shared';
import { api } from '../api';

export const analyticsService = {
  async getSummary(): Promise<AnalyticsSummary> {
    const response = await api.get<AnalyticsSummary>('/analytics/summary');
    return response.data;
  }
};
