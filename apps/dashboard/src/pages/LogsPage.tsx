import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { useLogStore } from '@/stores/logStore';
import { cn, formatDate } from '@/lib/utils';

export function LogsPage() {
    const { logs, loadLogs } = useLogStore();
    const [query, setQuery] = useState('');
    const [level, setLevel] = useState('');

    useEffect(() => {
        void loadLogs(level || undefined);
    }, [level, loadLogs]);

    const filtered = logs.filter((log) => `${log.level} ${log.message}`.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="space-y-6 sm:space-y-7 lg:space-y-8">
            <Card className="mesh-card">
                <CardContent className="flex flex-wrap items-end justify-between gap-5 p-6 sm:p-7 lg:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Backend Activity</p>
                        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Log Sistem</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">Pantau event backend dan error Gemini lewat tabel log yang lebih tenang dan mudah discan.</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 dark:bg-slate-800 px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400 shadow-sm">
                        {filtered.length} log tampil
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-col gap-4 space-y-0 lg:flex-row lg:items-center lg:justify-between">
                    <CardTitle>Aktivitas</CardTitle>
                    <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                        <select
                            className="flex h-10 w-full rounded-2xl border border-input bg-background/90 dark:bg-slate-800 px-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
                            value={level}
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setLevel(event.target.value)}
                        >
                            <option value="">All</option>
                            <option value="info">Info</option>
                            <option value="warn">Warn</option>
                            <option value="error">Error</option>
                        </select>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
                            <Input className="rounded-2xl bg-background/90 dark:bg-slate-800 pl-10" placeholder="Cari log" value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3.5">
                    {filtered.map((log) => (
                        <div key={log.id} className="grid gap-3 rounded-[1.25rem] border border-white/70 dark:border-slate-700/50 bg-card/90 dark:bg-slate-800/50 p-5 text-sm sm:grid-cols-[80px_160px_1fr] sm:gap-4">
                            <span
                                className={cn(
                                    'font-mono text-xs font-semibold uppercase',
                                    log.level === 'error' && 'text-red-600',
                                    log.level === 'warn' && 'text-amber-600',
                                    log.level === 'info' && 'text-blue-600'
                                )}
                            >
                                {log.level}
                            </span>
                            <span className="text-xs leading-relaxed text-muted-foreground">{formatDate(log.created_at)}</span>
                            <div className="space-y-2 min-w-0">
                                <span className="block leading-relaxed text-card-foreground">{log.message}</span>
                                {log.meta ? (
                                    <pre className="overflow-auto rounded-2xl bg-slate-950/90 p-3 text-[11px] leading-relaxed text-slate-100 max-w-full break-words whitespace-pre-wrap word-break">
                                        {JSON.stringify(log.meta, null, 2)}
                                    </pre>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
