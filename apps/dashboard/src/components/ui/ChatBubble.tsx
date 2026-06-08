import type { MessageDirection, MessageStatus } from '@whatsapp-bot/shared';
import { motion } from 'framer-motion';
import { entranceTransition } from '@/lib/motion';
import { cn, formatDate } from '@/lib/utils';
import { FileText } from 'lucide-react';

interface ChatBubbleProps {
    direction: MessageDirection;
    content: string;
    timestamp: string;
    status?: MessageStatus;
    senderLabel?: string | null;
    quotedAuthor?: string | null;
    quotedContent?: string | null;
    documentMeta?: {
        fileName: string;
        kind: string;
        mimeType?: string;
    } | null;
}

export function ChatBubble({
    direction,
    content,
    timestamp,
    status,
    senderLabel,
    quotedAuthor,
    quotedContent,
    documentMeta
}: ChatBubbleProps) {
    const outbound = direction === 'outbound';
    return (
        <div className={cn('flex gap-2', outbound ? 'justify-end' : 'justify-start')}>
            <motion.div
                className={cn(
                    'max-w-[85%] transform-gpu rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-colors sm:max-w-[80%] lg:max-w-[75%]',
                    outbound
                        ? 'bg-primary text-primary-foreground shadow-md shadow-emerald-900/10 dark:shadow-emerald-600/20'
                        : 'border border-white/60 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 text-card-foreground dark:text-slate-100 shadow-sm'
                )}
                initial={{ opacity: 0, x: outbound ? 8 : -8, y: 4 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={entranceTransition}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.998 }}
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
                {documentMeta ? (
                    <div
                        className={cn(
                            'mb-2 flex items-center gap-3 rounded-xl border px-3 py-2.5',
                            outbound
                                ? 'border-white/25 bg-white/15 text-emerald-50'
                                : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200'
                        )}
                    >
                        <FileText className="h-5 w-5 shrink-0" />
                        <div className="min-w-0">
                            <p className="truncate text-xs font-bold">{documentMeta.fileName}</p>
                            <p className="mt-0.5 text-[10px] uppercase opacity-75">
                                {documentMeta.kind}{documentMeta.mimeType ? ` · ${documentMeta.mimeType}` : ''}
                            </p>
                        </div>
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
