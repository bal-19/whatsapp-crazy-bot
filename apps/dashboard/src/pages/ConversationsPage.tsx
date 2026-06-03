import { useEffect } from 'react';
import { ConversationList } from '../components/features/conversations/ConversationList';
import { ChatWindow } from '../components/features/conversations/ChatWindow';
import { useConversationStore } from '../stores/conversationStore';

// Helper: Extract phone number from JID format (6281234567890@s.whatsapp.net -> 6281234567890)
function extractPhoneFromJid(jid: string | undefined): string {
    if (!jid) return 'Unknown';
    return jid.split('@')[0] || 'Unknown';
}

export function ConversationsPage() {
    const { conversations, activeContactId, messages, loadConversations, selectContact } = useConversationStore();
    const active = conversations.find((conversation) => conversation.contact_id === activeContactId);

    // Display phone number only
    const displayName = extractPhoneFromJid(active?.contact_id);

    useEffect(() => {
        void loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (activeContactId && !messages[activeContactId]) {
            void selectContact(activeContactId);
        }
    }, [activeContactId, messages, selectContact]);

    return (
        <div className="flex h-full flex-col">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Percakapan</h1>
                <p className="text-sm text-muted-foreground">Monitor obrolan bot secara realtime.</p>
            </div>
            <div className="min-h-0 flex-1 grid grid-cols-1 rounded-lg border bg-card shadow-sm lg:grid-cols-[360px_1fr]">
                <ConversationList
                    conversations={conversations}
                    activeContactId={activeContactId}
                    onSelect={(contactId) => void selectContact(contactId)}
                />
                <ChatWindow
                    title={displayName ?? 'Pilih percakapan'}
                    messages={activeContactId ? messages[activeContactId] ?? [] : []}
                />
            </div>
        </div>
    );
}
