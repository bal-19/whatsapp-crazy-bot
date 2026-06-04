import type { MessageDirection, MessageStatus } from '@whatsapp-bot/shared';
import { cn, formatDate } from '@/lib/utils';

interface ChatBubbleProps {
    direction: MessageDirection;
    content: string;
    timestamp: string;
    status?: MessageStatus;
}

export function ChatBubble({ direction, content, timestamp, status }: ChatBubbleProps) {
    const outbound = direction === 'outbound';
    return (
        <div className={cn('flex gap-2', outbound ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all sm:max-w-[80%] lg:max-w-[75%]',
                    outbound
                        ? 'bg-primary text-primary-foreground shadow-md shadow-emerald-900/10'
                        : 'border border-white/60 bg-white/80 text-card-foreground shadow-sm'
                )}
            >
                <p className="whitespace-pre-wrap break-words">{content}</p>
                <p className={cn('mt-1.5 text-xs font-medium', outbound ? 'opacity-75' : 'text-muted-foreground/80')}>
                    {formatDate(timestamp)}
                    {status ? ` · ${status}` : ''}
                </p>
            </div>
        </div>
    );
}
