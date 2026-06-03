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
                    outbound
                        ? 'bg-primary text-primary-foreground'
                        : 'border bg-card text-card-foreground'
                )}
            >
                <p className="whitespace-pre-wrap">{content}</p>
                <p className={cn('mt-2 text-[11px]', outbound ? 'opacity-80' : 'text-muted-foreground')}>
                    {formatDate(timestamp)}
                    {status ? ` · ${status}` : ''}
                </p>
            </div>
        </div>
    );
}
