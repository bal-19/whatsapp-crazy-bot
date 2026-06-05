import type { MessageDirection, MessageStatus } from '@whatsapp-bot/shared';
import { motion } from 'framer-motion';
import { cn, formatDate } from '@/lib/utils';

interface ChatBubbleProps {
    direction: MessageDirection;
    content: string;
    timestamp: string;
    status?: MessageStatus;
    senderLabel?: string | null;
    quotedAuthor?: string | null;
    quotedContent?: string | null;
}

export function ChatBubble({
    direction,
    content,
    timestamp,
    status,
    senderLabel,
    quotedAuthor,
    quotedContent
}: ChatBubbleProps) {
    const outbound = direction === 'outbound';
    return (
        <div className={cn('flex gap-2', outbound ? 'justify-end' : 'justify-start')}>
            <motion.div
                className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all sm:max-w-[80%] lg:max-w-[75%]',
                    outbound
                        ? 'bg-primary text-primary-foreground shadow-md shadow-emerald-900/10 dark:shadow-emerald-600/20'
                        : 'border border-white/60 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 text-card-foreground dark:text-slate-100 shadow-sm'
                )}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                whileHover={{ scale: 1.02, y: -2 }}
            >
                {senderLabel ? (
                    <p className={cn('mb-1 text-[11px] font-bold', outbound ? 'text-emerald-50/90' : 'text-emerald-700 dark:text-emerald-300')}>
                        {senderLabel}
                    </p>
                ) : null}
                {quotedContent ? (
                    <div
                        className={cn(
                            'mb-2 rounded-xl border-l-4 px-3 py-2 text-xs leading-relaxed',
                            outbound
                                ? 'border-emerald-100/90 bg-white/15 text-emerald-50/95'
                                : 'border-emerald-500 bg-emerald-50/80 text-slate-700 dark:bg-emerald-950/40 dark:text-slate-200'
                        )}
                    >
                        {quotedAuthor ? <p className="mb-0.5 font-bold">{quotedAuthor}</p> : null}
                        <p className="line-clamp-2 whitespace-pre-wrap break-words opacity-90">{quotedContent}</p>
                    </div>
                ) : null}
                <p className="whitespace-pre-wrap break-words">{content}</p>
                <p className={cn('mt-1.5 text-xs font-medium', outbound ? 'opacity-75' : 'text-muted-foreground/80 dark:text-slate-400')}>
                    {formatDate(timestamp)}
                    {status ? ` · ${status}` : ''}
                </p>
            </motion.div>
        </div>
    );
}
