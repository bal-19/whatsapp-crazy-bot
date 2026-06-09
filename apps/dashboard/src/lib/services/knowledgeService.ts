import type {
    CreateKnowledgeItemRequest,
    KnowledgeItem,
    UpdateKnowledgeItemRequest,
} from '@whatsapp-bot/shared';
import { api } from '../api';

export const knowledgeService = {
    async getAll(): Promise<KnowledgeItem[]> {
        const response = await api.get<{ data: KnowledgeItem[] }>('/knowledge');
        return response.data.data;
    },
    async create(payload: CreateKnowledgeItemRequest): Promise<KnowledgeItem> {
        const response = await api.post<KnowledgeItem>('/knowledge', payload);
        return response.data;
    },
    async update(
        knowledgeId: string,
        payload: UpdateKnowledgeItemRequest,
    ): Promise<KnowledgeItem> {
        const response = await api.put<KnowledgeItem>(
            `/knowledge/${encodeURIComponent(knowledgeId)}`,
            payload,
        );
        return response.data;
    },
    async remove(knowledgeId: string): Promise<void> {
        await api.delete(`/knowledge/${encodeURIComponent(knowledgeId)}`);
    },
};
