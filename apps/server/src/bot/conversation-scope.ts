import type { proto } from "@whiskeysockets/baileys";

export interface ConversationScope {
    contactId: string;
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
            deliveryJid: remoteJid,
            groupJid: remoteJid,
            participantJid: null,
            isGroup: true,
            usedGroupFallback: true,
        };
    }

    return {
        contactId: `${remoteJid}::${participantJid}`,
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
        deliveryJid: scope.deliveryJid,
        groupJid: scope.groupJid,
        participantJid: scope.participantJid,
        isGroup: scope.isGroup,
        usedGroupFallback: scope.usedGroupFallback,
    };
}

function normalizeParticipantJid(value?: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}
