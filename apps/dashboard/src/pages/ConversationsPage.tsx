import { useEffect } from 'react';
import { ConversationList } from '../components/features/conversations/ConversationList';
import { ChatWindow } from '../components/features/conversations/ChatWindow';
import { useConversationStore } from '../stores/conversationStore';

export function ConversationsPage() {
    const { conversations, activeContactId, messages, loadConversations, selectContact } = useConversationStore();
    const active = conversations.find((conversation) => conversation.contact_id === activeContactId);

    useEffect(() => {
        void loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (activeContactId && !messages[activeContactId]) {
            void selectContact(activeContactId);
        }
    }, [activeContactId, messages, selectContact]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Percakapan</h1>
                <p className="text-sm text-muted-foreground">Monitor obrolan bot secara realtime.</p>
            </div>
            <div className="grid h-[calc(100vh-180px)] grid-cols-1 overflow-hidden rounded-lg border bg-card shadow-sm lg:grid-cols-[360px_1fr]">
                <ConversationList
                    conversations={conversations}
                    activeContactId={activeContactId}
                    onSelect={(contactId) => void selectContact(contactId)}
                />
                <ChatWindow
                    title={active?.contact_name ?? active?.contact_id ?? 'Pilih percakapan'}
                    messages={activeContactId ? messages[activeContactId] ?? [] : []}
                />
            </div>
        </div>
    );
}
