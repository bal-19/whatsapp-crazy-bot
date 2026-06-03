import type { ConversationSummary } from '@whatsapp-bot/shared';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '../../ui/Input';
import { cn, formatDate } from '../../../lib/utils';

interface ConversationListProps {
  conversations: ConversationSummary[];
  activeContactId: string | null;
  onSelect: (contactId: string) => void;
}

export function ConversationList({ conversations, activeContactId, onSelect }: ConversationListProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      conversations.filter((conversation) =>
        `${conversation.contact_name ?? ''} ${conversation.contact_id} ${conversation.last_message}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [conversations, query]
  );

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="Cari nama atau nomor" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {filtered.map((conversation) => (
          <button
            key={conversation.contact_id}
            type="button"
            onClick={() => onSelect(conversation.contact_id)}
            className={cn(
              'block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50',
              activeContactId === conversation.contact_id && 'bg-brand-50'
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-slate-900">
                {conversation.contact_name ?? conversation.contact_id}
              </p>
              <span className="shrink-0 text-[11px] text-slate-500">{formatDate(conversation.last_message_at)}</span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-500">{conversation.last_message}</p>
            <p className="mt-2 text-[11px] font-medium text-slate-400">{conversation.message_count} pesan</p>
          </button>
        ))}
      </div>
    </div>
  );
}
