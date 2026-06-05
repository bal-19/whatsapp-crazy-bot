import { useEffect, useMemo, useState } from 'react';
import type { ConversationSummary, Message } from '@whatsapp-bot/shared';
import { Card, CardContent } from '@/components/ui';
import { ConversationList, type ConversationThread } from '@/components/features/conversations/ConversationList';
import { ChatWindow } from '@/components/features/conversations/ChatWindow';
import { useConversationStore } from '@/stores/conversationStore';
import { extractPhoneFromJid, formatConversationSubtitle, formatConversationTitle, parseConversationScope } from '@/lib/utils';

export function ConversationsPage() {
    const { conversations, activeContactId, messages, loadConversations, selectContact } = useConversationStore();
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const threads = useMemo(() => buildConversationThreads(conversations), [conversations]);
    const activeThread = threads.find((thread) => thread.id === activeThreadId) ?? threads[0] ?? null;

    const activeMessages = useMemo(
        () =>
            activeThread
                ? activeThread.conversationIds
                      .flatMap((contactId) => messages[contactId] ?? [])
                      .sort((a, b) => Date.parse(a.message_timestamp) - Date.parse(b.message_timestamp))
                : [],
        [activeThread, messages]
    );
    const senderNames = useMemo(() => buildSenderNameMap(conversations), [conversations]);

    useEffect(() => {
        void loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (!activeThreadId && threads[0]) {
            setActiveThreadId(threads[0].id);
        }
    }, [activeThreadId, threads]);

    useEffect(() => {
        if (!activeThread) return;

        activeThread.conversationIds.forEach((contactId) => {
            if (!messages[contactId]) {
                void selectContact(contactId);
            }
        });
    }, [activeThread, messages, selectContact]);

    function handleSelectThread(thread: ConversationThread) {
        setActiveThreadId(thread.id);
        thread.conversationIds.forEach((contactId) => {
            if (!messages[contactId]) {
                void selectContact(contactId);
            }
        });
    }

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
                    conversations={threads}
                    activeContactId={activeThread?.id ?? activeContactId}
                    onSelect={handleSelectThread}
                />
                <ChatWindow
                    title={activeThread?.title ?? 'Pilih percakapan'}
                    subtitle={activeThread?.subtitle ?? null}
                    messages={activeMessages}
                    isGroup={Boolean(activeThread?.isGroup)}
                    senderNames={senderNames}
                />
            </div>
        </div>
    );
}

function buildConversationThreads(conversations: ConversationSummary[]): ConversationThread[] {
    const threads = new Map<string, ConversationThread>();

    conversations.forEach((conversation) => {
        const scope = parseConversationScope(conversation.contact_id);

        if (!scope.isScopedGroup || !scope.groupJid) {
            threads.set(conversation.contact_id, {
                id: conversation.contact_id,
                title: formatConversationTitle(conversation.contact_id, conversation.contact_name),
                subtitle: null,
                last_message: conversation.last_message,
                last_message_at: conversation.last_message_at,
                message_count: conversation.message_count,
                isGroup: false,
                memberNames: [],
                conversationIds: [conversation.contact_id]
            });
            return;
        }

        const memberName = conversation.contact_name || extractPhoneFromJid(scope.participantJid);
        const groupTitle = conversation.group_name || extractPhoneFromJid(scope.groupJid);
        const existing = threads.get(scope.groupJid);

        if (!existing) {
            threads.set(scope.groupJid, {
                id: scope.groupJid,
                title: groupTitle,
                subtitle: memberName,
                last_message: conversation.last_message,
                last_message_at: conversation.last_message_at,
                message_count: conversation.message_count,
                isGroup: true,
                memberNames: [memberName],
                conversationIds: [conversation.contact_id]
            });
            return;
        }

        const memberNames = existing.memberNames.includes(memberName)
            ? existing.memberNames
            : [...existing.memberNames, memberName];
        const isNewer = Date.parse(conversation.last_message_at) > Date.parse(existing.last_message_at);

        threads.set(scope.groupJid, {
            ...existing,
            title: existing.title || groupTitle,
            subtitle: memberNames.join(', '),
            last_message: isNewer ? conversation.last_message : existing.last_message,
            last_message_at: isNewer ? conversation.last_message_at : existing.last_message_at,
            message_count: existing.message_count + conversation.message_count,
            memberNames,
            conversationIds: [...existing.conversationIds, conversation.contact_id]
        });
    });

    return [...threads.values()].sort((a, b) => Date.parse(b.last_message_at) - Date.parse(a.last_message_at));
}

function buildSenderNameMap(conversations: ConversationSummary[]): Record<string, string> {
    return conversations.reduce<Record<string, string>>((acc, conversation) => {
        const scope = parseConversationScope(conversation.contact_id);
        acc[conversation.contact_id] = conversation.contact_name || extractPhoneFromJid(scope.participantJid ?? conversation.contact_id);
        return acc;
    }, {});
}
