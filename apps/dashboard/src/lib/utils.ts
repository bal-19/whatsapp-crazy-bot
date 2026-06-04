import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function compactNumber(value: number): string {
  return new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value);
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}j ${minutes}m`;
  return `${minutes}m`;
}

export interface ConversationScopeInfo {
  rawContactId: string;
  isScopedGroup: boolean;
  scopeContactJid: string;
  groupJid: string | null;
  participantJid: string | null;
}

export function parseConversationScope(contactId: string): ConversationScopeInfo {
  const [groupJid, participantJid] = contactId.split('::');

  if (!participantJid) {
    return {
      rawContactId: contactId,
      isScopedGroup: false,
      scopeContactJid: contactId,
      groupJid: null,
      participantJid: null
    };
  }

  return {
    rawContactId: contactId,
    isScopedGroup: true,
    scopeContactJid: participantJid,
    groupJid,
    participantJid
  };
}

export function extractPhoneFromJid(jid: string | undefined | null): string {
  if (!jid) return 'Unknown';
  return jid.split('@')[0] || jid;
}

export function formatConversationTitle(contactId: string, contactName?: string | null): string {
  const scope = parseConversationScope(contactId);
  if (contactName) return contactName;
  return extractPhoneFromJid(scope.scopeContactJid);
}

export function formatConversationSubtitle(contactId: string): string | null {
  const scope = parseConversationScope(contactId);
  if (!scope.isScopedGroup || !scope.groupJid || !scope.participantJid) return null;

  return `Member ${extractPhoneFromJid(scope.participantJid)} di grup ${extractPhoneFromJid(scope.groupJid)}`;
}
