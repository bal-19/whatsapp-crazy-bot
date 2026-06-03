import type { Message } from '@whatsapp-bot/shared';
import { MessageSquare } from 'lucide-react';
import { ChatBubble, ScrollArea } from '@/components/ui';

interface ChatWindowProps {
    title: string;
    messages: Message[];
}

export function ChatWindow({ title, messages }: ChatWindowProps) {
    return (
        <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
            <div className="border-b bg-background px-5 py-4">
                <p className="text-base font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{messages.length} pesan tersimpan</p>
            </div>
            <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-4 p-5">
                    {messages.length === 0 ? (
                        <div className="flex h-96 flex-col items-center justify-center text-muted-foreground">
                            <MessageSquare className="h-10 w-10" />
                            <p className="mt-3 text-sm">Belum ada pesan di percakapan ini.</p>
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
