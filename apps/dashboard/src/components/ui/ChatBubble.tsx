import type { MessageDirection, MessageStatus } from '@whatsapp-bot/shared';
import { cn, formatDate } from '../../lib/utils';

interface ChatBubbleProps {
  direction: MessageDirection;
  content: string;
  timestamp: string;
  status?: MessageStatus;
}

export function ChatBubble({ direction, content, timestamp, status }: ChatBubbleProps) {
  const outbound = direction === 'outbound';
  return (
    <div className={cn('flex', outbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm',
          outbound ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-800'
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        <p className={cn('mt-2 text-[11px]', outbound ? 'text-brand-50' : 'text-slate-400')}>
          {formatDate(timestamp)}
          {status ? ` · ${status}` : ''}
        </p>
      </div>
    </div>
  );
}
