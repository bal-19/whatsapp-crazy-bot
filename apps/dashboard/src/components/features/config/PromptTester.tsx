import { Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

interface PromptTesterProps {
  reply: string | null;
  isTesting: boolean;
  onTest: (message: string) => void;
}

export function PromptTester({ reply, isTesting, onTest }: PromptTesterProps) {
  const [message, setMessage] = useState('pagi');

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Preview Respons</p>
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="font-semibold text-slate-700">User</p>
            <p className="mt-1 rounded bg-white p-3 text-slate-700 shadow-sm">{message}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Bot</p>
            <p className="mt-1 min-h-24 whitespace-pre-wrap rounded bg-brand-600 p-3 text-white shadow-sm">
              {isTesting ? 'Lagi mikir...' : reply ?? 'Klik test untuk melihat respons.'}
            </p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Input value={message} onChange={(e) => setMessage(e.target.value)} />
        <Button onClick={() => onTest(message)} disabled={isTesting || message.trim().length === 0}>
          <Send className="h-4 w-4" />
          Test
        </Button>
      </div>
    </div>
  );
}
