import type { Message } from '@whatsapp-bot/shared';
import { FileText, MessageSquare } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ChatBubble, ScrollArea } from '@/components/ui';

interface ChatWindowProps {
    title: string;
    subtitle?: string | null;
    messages: Message[];
    isGroup?: boolean;
    senderNames?: Record<string, string>;
}

export function ChatWindow({ title, subtitle, messages, isGroup = false, senderNames = {} }: ChatWindowProps) {
    const [documentFilter, setDocumentFilter] = useState('');
    const filteredMessages = useMemo(
        () =>
            messages.filter((message) => {
                if (!documentFilter) return true;
                const payload = message.raw_payload;
                if (payload?.reply_type !== 'document') return false;
                return documentFilter === 'document' || payload.document_kind === documentFilter;
            }),
        [documentFilter, messages]
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col rounded-b-xl bg-white/85 dark:bg-slate-900/50 backdrop-blur-sm lg:rounded-b-none lg:rounded-r-xl">
            <div className="border-b border-border/60 bg-white/60 px-5 py-4 backdrop-blur-sm dark:border-border/40 dark:bg-slate-800/40 sm:px-6 sm:py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-amber-100 text-sm font-bold text-emerald-900 shadow-inner dark:from-emerald-900 dark:to-slate-700 dark:text-emerald-100">
                        {title.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground/80">
                            {subtitle ? `${subtitle} • ` : ''}
                            {messages.length} pesan tersimpan
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <select
                            className="h-9 rounded-xl border border-input bg-background/90 px-3 text-xs"
                            value={documentFilter}
                            onChange={(event) => setDocumentFilter(event.target.value)}
                        >
                            <option value="">Semua pesan</option>
                            <option value="document">Semua dokumen</option>
                            <option value="pdf">PDF</option>
                            <option value="docx">DOCX</option>
                            <option value="xlsx">XLSX</option>
                        </select>
                    </div>
                </div>
            </div>
            <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-3 p-5 sm:p-6 lg:p-6">
                    {filteredMessages.length === 0 ? (
                        <div className="flex h-96 flex-col items-center justify-center text-muted-foreground/60">
                            <MessageSquare className="h-12 w-12 opacity-40" />
                            <p className="mt-4 text-sm font-medium">Belum ada pesan di percakapan ini.</p>
                        </div>
                    ) : (
                        <>
                            {filteredMessages.map((message) => {
                                const quoted = message.reply_to_message_id ? findMessageById(messages, message.reply_to_message_id) : null;
                                const senderName = senderNames[message.contact_id] ?? null;
                                const quotedSenderName = quoted ? senderNames[quoted.contact_id] ?? 'User' : null;
                                return (
                                    <ChatBubble
                                        key={message.id}
                                        direction={message.direction}
                                        content={message.body}
                                        timestamp={message.message_timestamp}
                                        status={message.status}
                                        senderLabel={isGroup && message.direction === 'inbound' ? senderName : null}
                                        quotedAuthor={quotedSenderName}
                                        quotedContent={quoted?.body ?? null}
                                        documentMeta={getDocumentMeta(message)}
                                    />
                                );
                            })}
                        </>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function getDocumentMeta(message: Message): { fileName: string; kind: string; mimeType?: string } | null {
    const payload = message.raw_payload;
    if (payload?.reply_type !== 'document') return null;
    return {
        fileName: typeof payload.file_name === 'string' ? payload.file_name : 'Dokumen',
        kind: typeof payload.document_kind === 'string' ? payload.document_kind : 'document',
        mimeType: typeof payload.mime_type === 'string' ? payload.mime_type : undefined
    };
}

function findMessageById(messages: Message[], messageId: string): Message | null {
    return messages.find((message) => message.id === messageId) ?? null;
}
