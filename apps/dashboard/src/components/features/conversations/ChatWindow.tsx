import type { Message } from '@whatsapp-bot/shared';
import { MessageSquare } from 'lucide-react';
import { ChatBubble, ScrollArea } from '@/components/ui';

interface ChatWindowProps {
    title: string;
    messages: Message[];
}

export function ChatWindow({ title, messages }: ChatWindowProps) {
    return (
        <div className="flex min-h-0 flex-1 flex-col rounded-b-xl bg-white/85 dark:bg-slate-900/50 backdrop-blur-sm lg:rounded-b-none lg:rounded-r-xl">
            <div className="border-b border-border/60 dark:border-border/40 bg-white/60 dark:bg-slate-800/40 px-5 py-4 backdrop-blur-sm sm:px-6 sm:py-5">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground/80">{messages.length} pesan tersimpan</p>
            </div>
            <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-3 p-5 sm:p-6 lg:p-6">
                    {messages.length === 0 ? (
                        <div className="flex h-96 flex-col items-center justify-center text-muted-foreground/60">
                            <MessageSquare className="h-12 w-12 opacity-40" />
                            <p className="mt-4 text-sm font-medium">Belum ada pesan di percakapan ini.</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <ChatBubble
                                    key={message.id}
                                    direction={message.direction}
                                    content={message.body}
                                    timestamp={message.created_at}
                                    status={message.status}
                                />
                            ))}
                        </>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
