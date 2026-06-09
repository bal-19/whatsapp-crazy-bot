import type { OutboxMessage, OutboxStatus } from '@whatsapp-bot/shared';
import { api } from '../api';

export const outboxService = {
    async getAll(status?: OutboxStatus): Promise<OutboxMessage[]> {
        const response = await api.get<{ data: OutboxMessage[] }>('/outbox', {
            params: { status },
        });
        return response.data.data;
    },
};
