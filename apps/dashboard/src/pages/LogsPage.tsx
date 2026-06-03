import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
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
        <h1 className="text-2xl font-bold text-slate-900">Log Sistem</h1>
        <p className="text-sm text-slate-500">Pantau event backend dan error Gemini.</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Aktivitas</CardTitle>
          <div className="flex items-center gap-2">
            <select
              className="focus-ring h-10 rounded border border-slate-200 bg-white px-3 text-sm"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            >
              <option value="">All</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Cari log" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.map((log) => (
            <div key={log.id} className="grid grid-cols-[80px_160px_1fr] gap-3 rounded border border-slate-100 p-3 text-sm">
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
              <span className="text-xs text-slate-500">{formatDate(log.created_at)}</span>
              <span className="text-slate-800">{log.message}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
