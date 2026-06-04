import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui';
import { ConversationList } from '@/components/features/conversations/ConversationList';
import { ChatWindow } from '@/components/features/conversations/ChatWindow';
import { useConversationStore } from '@/stores/conversationStore';

// Helper: Extract phone number from JID format (6281234567890@s.whatsapp.net -> 6281234567890)
function extractPhoneFromJid(jid: string | undefined): string {
    if (!jid) return 'Unknown';
    return jid.split('@')[0] || 'Unknown';
}

export function ConversationsPage() {
    const { conversations, activeContactId, messages, loadConversations, selectContact } = useConversationStore();
    const active = conversations.find((conversation) => conversation.contact_id === activeContactId);

    // Display phone number only
    const displayName = (active?.contact_name ? active.contact_name : extractPhoneFromJid(active?.contact_id));

    useEffect(() => {
        void loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (activeContactId && !messages[activeContactId]) {
            void selectContact(activeContactId);
        }
    }, [activeContactId, messages, selectContact]);

    return (
        <div className="flex h-full flex-col gap-6 sm:gap-7">
            <Card className="mesh-card">
                <CardContent className="flex flex-wrap items-end justify-between gap-5 p-6 sm:p-7 lg:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Realtime Monitoring</p>
                        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Percakapan</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">Monitor obrolan bot secara realtime dengan daftar thread yang lebih bersih dan panel chat yang lebih fokus.</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-5 py-3.5 text-sm text-slate-600 shadow-sm">
                        {conversations.length} thread tersedia
                    </div>
                </CardContent>
            </Card>
            <div className="min-h-0 flex-1 grid grid-cols-1 overflow-hidden rounded-[1.5rem] border border-white/60 dark:border-slate-700/50 bg-card/80 dark:bg-slate-900/50 shadow-[0_22px_60px_-36px_rgba(18,57,42,0.35)] dark:shadow-[0_22px_60px_-36px_rgba(0,0,0,0.5)] xl:grid-cols-[380px_1fr] xl:rounded-[1.75rem]">
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
