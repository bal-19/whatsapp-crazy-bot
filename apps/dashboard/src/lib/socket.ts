import { io } from 'socket.io-client';
import type { AnalyticsSummary, BotStatus, Message, SystemLog } from '@whatsapp-bot/shared';
import { useBotStore } from '../stores/botStore';
import { useConversationStore } from '../stores/conversationStore';
import { useLogStore } from '../stores/logStore';
import { useUIStore } from '../stores/uiStore';

export const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionAttempts: 5
});

socket.on('bot:status_changed', (data: { status: BotStatus }) => {
  useBotStore.getState().setStatus(data.status);
});

socket.on('message:new', (data: { contactId: string; message: Message }) => {
  useConversationStore.getState().appendMessage(data.contactId, data.message);
});

socket.on('analytics:update', (data: AnalyticsSummary) => {
  useBotStore.getState().setAnalytics(data);
});

socket.on('log:new', (log: SystemLog) => {
  useLogStore.getState().prependLog(log);
});

socket.on('connect_error', () => {
  useUIStore.getState().addToast({ type: 'warning', message: 'Koneksi dashboard terputus, mencoba reconnect...' });
});

socket.on('connect', () => {
  useUIStore.getState().addToast({ type: 'success', message: 'Terhubung kembali ke server' });
});
