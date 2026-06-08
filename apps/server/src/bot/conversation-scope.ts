import type { proto } from "@whiskeysockets/baileys";

export interface ConversationScope {
    contactId: string;
    contactJid: string;
    deliveryJid: string;
    groupJid: string | null;
    participantJid: string | null;
    isGroup: boolean;
    usedGroupFallback: boolean;
}

export function resolveConversationScope(
    message: proto.IWebMessageInfo,
): ConversationScope | null {
    const remoteJid = message.key.remoteJid;
    if (!remoteJid) return null;

    const isGroup = remoteJid.endsWith("@g.us");
    if (!isGroup) {
        return {
            contactId: remoteJid,
            contactJid: remoteJid,
            deliveryJid: remoteJid,
            groupJid: null,
            participantJid: null,
            isGroup: false,
            usedGroupFallback: false,
        };
    }

    const participantJid = normalizeParticipantJid(message.key.participant);
    if (!participantJid) {
        return {
            contactId: remoteJid,
            contactJid: remoteJid,
            deliveryJid: remoteJid,
            groupJid: remoteJid,
            participantJid: null,
            isGroup: true,
            usedGroupFallback: true,
        };
    }

    return {
        contactId: `${remoteJid}::${participantJid}`,
        contactJid: participantJid,
        deliveryJid: remoteJid,
        groupJid: remoteJid,
        participantJid,
        isGroup: true,
        usedGroupFallback: false,
    };
}

export function toConversationScopeLogMeta(
    scope: ConversationScope,
): Record<string, unknown> {
    return {
        contactId: scope.contactId,
        contactJid: scope.contactJid,
        deliveryJid: scope.deliveryJid,
        groupJid: scope.groupJid,
        participantJid: scope.participantJid,
        isGroup: scope.isGroup,
        usedGroupFallback: scope.usedGroupFallback,
    };
}

export function resolveMemoryScopeKey(scope: ConversationScope): string {
    return scope.groupJid ?? scope.contactId;
}

export function deriveContactJidFromScopeKey(scopeKey: string): string {
    const [groupJid, participantJid] = scopeKey.split("::");
    return participantJid ? participantJid : groupJid;
}

export function deriveGroupJidFromScopeKey(scopeKey: string): string | null {
    const [groupJid, participantJid] = scopeKey.split("::");
    if (participantJid) {
        return groupJid;
    }

    return scopeKey.endsWith("@g.us") ? scopeKey : null;
}

function normalizeParticipantJid(value?: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}
