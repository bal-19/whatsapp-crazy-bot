import { create } from 'zustand';
import type { ConversationSummary, Message } from '@whatsapp-bot/shared';
import { conversationService } from '../lib/services/conversationService';

interface ConversationStore {
  conversations: ConversationSummary[];
  activeContactId: string | null;
  messages: Record<string, Message[]>;
  isLoadingList: boolean;
  isLoadingMessages: boolean;
  loadConversations: () => Promise<void>;
  selectContact: (contactId: string) => Promise<void>;
  appendMessage: (contactId: string, message: Message) => void;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: [],
  activeContactId: null,
  messages: {},
  isLoadingList: false,
  isLoadingMessages: false,
  loadConversations: async () => {
    set({ isLoadingList: true });
    const response = await conversationService.getAll();
    set({
      conversations: response.data,
      activeContactId: get().activeContactId ?? response.data[0]?.contact_id ?? null,
      isLoadingList: false
    });
  },
  selectContact: async (contactId) => {
    set({ activeContactId: contactId, isLoadingMessages: true });
    const detail = await conversationService.getById(contactId);
    set((state) => ({
      messages: { ...state.messages, [contactId]: detail.messages },
      isLoadingMessages: false
    }));
  },
  appendMessage: (contactId, message) =>
    set((state) => {
      const current = state.messages[contactId] ?? [];
      const conversations = upsertPreview(state.conversations, contactId, message);
      return {
        messages: { ...state.messages, [contactId]: [...current, message] },
        conversations
      };
    })
}));

function upsertPreview(conversations: ConversationSummary[], contactId: string, message: Message): ConversationSummary[] {
  const existing = conversations.find((item) => item.contact_id === contactId);
  const next: ConversationSummary = existing
    ? {
        ...existing,
        last_message: message.body,
        last_message_at: message.created_at,
        message_count: existing.message_count + 1
      }
    : {
        contact_id: contactId,
        contact_name: contactId,
        last_message: message.body,
        last_message_at: message.created_at,
        message_count: 1,
        avg_response_time_ms: message.latency_ms
      };

  return [next, ...conversations.filter((item) => item.contact_id !== contactId)];
}
