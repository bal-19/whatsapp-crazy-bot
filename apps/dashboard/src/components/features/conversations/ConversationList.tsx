import type { ConversationSummary } from '@whatsapp-bot/shared';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui';
import { cn, formatConversationSubtitle, formatConversationTitle, formatDate, parseConversationScope } from '@/lib/utils';

interface ConversationListProps {
    conversations: ConversationSummary[];
    activeContactId: string | null;
    onSelect: (contactId: string) => void;
}

export function ConversationList({ conversations, activeContactId, onSelect }: ConversationListProps) {
    const [query, setQuery] = useState('');
    const filtered = useMemo(
        () =>
            conversations.filter((conversation) =>
                `${conversation.contact_name ?? ''} ${conversation.contact_id} ${conversation.last_message}`
                    .toLowerCase()
                    .includes(query.toLowerCase())
            ),
        [conversations, query]
    );

    return (
        <div className="flex h-full flex-col rounded-t-xl bg-white/85 dark:bg-slate-900/50 lg:rounded-l-xl lg:rounded-tr-none overflow-hidden">
            <div className="border-b border-border/40 dark:border-border/30 bg-white/60 dark:bg-slate-800/40 p-4 sm:p-5 flex-shrink-0">
                <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Inbox</p>
                    <h2 className="mt-1 text-base font-bold text-foreground">Percakapan</h2>
                </div>
                <div className="relative">
                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
                    <Input
                        className="rounded-lg border-white/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800 pl-10 text-sm h-9"
                        placeholder="Cari nama atau nomor"
                        value={query}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                    />
                </div>
            </div>
            <div className="soft-scrollbar min-h-0 flex-1 space-y-2 overflow-auto p-3 sm:p-4">
                {filtered.map((conversation) => {
                    const scope = parseConversationScope(conversation.contact_id);
                    const subtitle = formatConversationSubtitle(conversation.contact_id);

                    return (
                        <button
                            key={conversation.contact_id}
                            type="button"
                            onClick={() => onSelect(conversation.contact_id)}
                            className={cn(
                                'block w-full rounded-lg border border-white/60 dark:border-slate-700/50 px-4 py-3 text-left transition-all sm:px-4 sm:py-3.5',
                                activeContactId === conversation.contact_id
                                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-600/30 shadow-sm'
                                    : 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:border-emerald-100/70 dark:hover:border-emerald-600/30'
                            )}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {formatConversationTitle(conversation.contact_id, conversation.contact_name)}
                                </p>
                                <span className="shrink-0 text-[11px] text-muted-foreground/70">{formatDate(conversation.last_message_at)}</span>
                            </div>
                            {subtitle ? (
                                <p className="mt-1 truncate text-[11px] text-emerald-700 dark:text-emerald-400">{subtitle}</p>
                            ) : null}
                            <p className="mt-1.5 truncate text-xs text-muted-foreground/80">{conversation.last_message}</p>
                            <div className="mt-2.5 flex items-center gap-2">
                                <div className="inline-flex rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                    {conversation.message_count} pesan
                                </div>
                                {scope.isScopedGroup ? (
                                    <div className="inline-flex rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                        Grup scoped
                                    </div>
                                ) : null}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
