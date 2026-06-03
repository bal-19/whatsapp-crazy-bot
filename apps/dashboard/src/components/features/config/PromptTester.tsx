import { Send } from 'lucide-react';
import { useState } from 'react';
import { Button, Input, Label } from '../../ui';

interface PromptTesterProps {
    reply: string | null;
    isTesting: boolean;
    onTest: (message: string) => void;
}

export function PromptTester({ reply, isTesting, onTest }: PromptTesterProps) {
    const [message, setMessage] = useState('pagi');

    return (
        <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
                <Label className="text-xs font-semibold uppercase">Preview Respons</Label>
                <div className="mt-4 space-y-3 text-sm">
                    <div>
                        <p className="font-semibold text-foreground">User</p>
                        <p className="mt-1 rounded-lg bg-background p-3 text-foreground shadow-sm border">{message}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">Bot</p>
                        <p className="mt-1 min-h-24 whitespace-pre-wrap rounded-lg bg-primary p-3 text-primary-foreground shadow-sm">
                            {isTesting ? 'Lagi mikir...' : reply ?? 'Klik test untuk melihat respons.'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <Input
                    value={message}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                    placeholder="Ketik pesan test..."
                />
                <Button onClick={() => onTest(message)} disabled={isTesting || message.trim().length === 0}>
                    <Send className="h-4 w-4" />
                    Test
                </Button>
            </div>
        </div>
    );
}
