import type { Message } from '@whatsapp-bot/shared';
import { MessageSquare } from 'lucide-react';
import { ChatBubble } from '../../ui/ChatBubble';

interface ChatWindowProps {
  title: string;
  messages: Message[];
}

export function ChatWindow({ title, messages }: ChatWindowProps) {
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <p className="text-base font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{messages.length} pesan tersimpan</p>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <MessageSquare className="h-10 w-10" />
            <p className="mt-3 text-sm">Belum ada pesan di percakapan ini.</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatBubble
              key={message.id}
              direction={message.direction}
              content={message.body}
              timestamp={message.created_at}
              status={message.status}
            />
          ))
        )}
      </div>
    </div>
  );
}
