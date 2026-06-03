import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useLogStore } from '../stores/logStore';
import { cn, formatDate } from '../lib/utils';

export function LogsPage() {
    const { logs, loadLogs } = useLogStore();
    const [query, setQuery] = useState('');
    const [level, setLevel] = useState('');

    useEffect(() => {
        void loadLogs(level || undefined);
    }, [level, loadLogs]);

    const filtered = logs.filter((log) => `${log.level} ${log.message}`.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Log Sistem</h1>
                <p className="text-sm text-muted-foreground">Pantau event backend dan error Gemini.</p>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                    <CardTitle>Aktivitas</CardTitle>
                    <div className="flex items-center gap-2">
                        <select
                            className="flex h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={level}
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setLevel(event.target.value)}
                        >
                            <option value="">All</option>
                            <option value="info">Info</option>
                            <option value="warn">Warn</option>
                            <option value="error">Error</option>
                        </select>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="Cari log" value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {filtered.map((log) => (
                        <div key={log.id} className="grid grid-cols-[80px_160px_1fr] gap-3 rounded-lg border bg-card p-3 text-sm">
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
                            <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                            <span className="text-card-foreground">{log.message}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
