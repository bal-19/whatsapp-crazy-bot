import type { Message } from '@whatsapp-bot/shared';
import { MessageSquare } from 'lucide-react';
import { ChatBubble } from '../../ui/ChatBubble';
import { ScrollArea } from '../../ui/scroll-area';

interface ChatWindowProps {
    title: string;
    messages: Message[];
}

export function ChatWindow({ title, messages }: ChatWindowProps) {
    return (
        <div className="flex h-full flex-col bg-muted/30">
            <div className="border-b bg-background px-5 py-4">
                <p className="text-base font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{messages.length} pesan tersimpan</p>
            </div>
            <ScrollArea className="flex-1 p-5">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="h-10 w-10" />
                        <p className="mt-3 text-sm">Belum ada pesan di percakapan ini.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <ChatBubble
                                key={message.id}
                                direction={message.direction}
                                content={message.body}
                                timestamp={message.created_at}
                                status={message.status}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
