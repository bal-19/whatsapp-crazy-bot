import { useEffect, useMemo, useState } from 'react';
import { Clock3, RefreshCcw, Send } from 'lucide-react';
import type { OutboxStatus } from '@whatsapp-bot/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { outboxService } from '@/lib/services/outboxService';
import { formatDate } from '@/lib/utils';

export function OutboxPage() {
    const [items, setItems] = useState<Awaited<ReturnType<typeof outboxService.getAll>>>([]);
    const [status, setStatus] = useState<OutboxStatus | ''>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        void loadItems();
    }, [status]);

    async function loadItems() {
        setIsLoading(true);
        try {
            setItems(await outboxService.getAll(status || undefined));
        } finally {
            setIsLoading(false);
        }
    }

    const summary = useMemo(
        () => ({
            pending: items.filter((item) => item.status === 'pending').length,
            processing: items.filter((item) => item.status === 'processing').length,
            failed: items.filter((item) => item.status === 'failed').length,
        }),
        [items],
    );

    return (
        <div className="space-y-6 sm:space-y-7 lg:space-y-8">
            <Card className="mesh-card">
                <CardContent className="flex flex-wrap items-end justify-between gap-5 p-6 sm:p-7 lg:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Delivery Reliability</p>
                        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Outbox WhatsApp</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                            Pantau pesan outbound yang menunggu kirim ulang, sedang diproses, atau gagal permanen.
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-5 py-3.5 text-sm text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-400">
                        {items.length} item tampil
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
                <SummaryCard label="Pending" value={summary.pending} />
                <SummaryCard label="Processing" value={summary.processing} />
                <SummaryCard label="Failed" value={summary.failed} />
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <CardTitle>Delivery Queue</CardTitle>
                        <CardDescription>Retry otomatis berjalan di server dengan backoff bertahap.</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            className="flex h-10 rounded-2xl border border-input bg-background/90 px-4 text-sm dark:bg-slate-800"
                            value={status}
                            onChange={(event) => setStatus(event.target.value as OutboxStatus | '')}
                        >
                            <option value="">Semua status</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="sent">Sent</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3.5">
                    {isLoading ? (
                        <div className="text-sm text-muted-foreground">Memuat outbox...</div>
                    ) : items.length === 0 ? (
                        <div className="rounded-[1.25rem] border border-dashed p-6 text-sm text-muted-foreground">
                            Belum ada item outbox untuk filter ini.
                        </div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className="grid gap-3 rounded-[1.25rem] border border-white/70 bg-card/90 p-5 text-sm dark:border-slate-700/50 dark:bg-slate-800/50 md:grid-cols-[120px_1fr_180px]"
                            >
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{item.status}</p>
                                    <p className="text-[11px] text-muted-foreground">Attempt {item.attempt_count}/{item.max_attempts}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="leading-relaxed text-card-foreground">{item.reply_preview}</p>
                                    <p className="text-xs text-muted-foreground">{item.delivery_jid}</p>
                                    {item.last_error ? (
                                        <p className="text-xs text-red-600 dark:text-red-400">Error: {item.last_error}</p>
                                    ) : null}
                                </div>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <p>Dibuat: {formatDate(item.created_at)}</p>
                                    <p>Update: {formatDate(item.updated_at)}</p>
                                    <p>Next retry: {item.next_retry_at ? formatDate(item.next_retry_at) : '-'}</p>
                                    <p>Sent at: {item.sent_at ? formatDate(item.sent_at) : '-'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function SummaryCard(props: { label: string; value: number }) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between p-5">
                <div>
                    <p className="text-sm text-muted-foreground">{props.label}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{props.value}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {props.label === 'Pending' ? <Clock3 className="h-5 w-5" /> : props.label === 'Processing' ? <RefreshCcw className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                </div>
            </CardContent>
        </Card>
    );
}
