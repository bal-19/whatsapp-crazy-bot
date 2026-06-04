import { AlertTriangle, Clock3, MessageCircle, Users } from 'lucide-react';
import { useEffect } from 'react';
import { MessageVolumeChart } from '@/components/features/analytics/MessageVolumeChart';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui';
import { useBotStore } from '@/stores/botStore';

export function AnalyticsPage() {
    const { analytics, loadAnalytics } = useBotStore();

    useEffect(() => {
        void loadAnalytics();
    }, [loadAnalytics]);

    return (
        <div className="space-y-6 sm:space-y-7 lg:space-y-8">
            <Card className="mesh-card">
                <CardContent className="flex flex-wrap items-end justify-between gap-5 p-6 sm:p-7 lg:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Performance Snapshot</p>
                        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Analytics</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">Ringkasan performa dan kesehatan bot dengan fokus pada metrik yang paling sering dicek tim operasional.</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 dark:bg-slate-800 px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400 shadow-sm">
                        Update mengikuti data analytics yang sama seperti sebelumnya
                    </div>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Pesan Hari Ini" value={analytics?.messages_today ?? 0} icon={MessageCircle} />
                <StatCard label="Kontak Aktif" value={analytics?.active_contacts_today ?? 0} icon={Users} />
                <StatCard label="Avg Response" value={`${analytics?.avg_response_time_ms ?? 0} ms`} icon={Clock3} />
                <StatCard label="Gemini Errors" value={analytics?.gemini_errors_today ?? 0} icon={AlertTriangle} color="red" />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Message Volume</CardTitle>
                </CardHeader>
                <CardContent>
                    <MessageVolumeChart data={analytics?.daily_message_volume ?? []} />
                </CardContent>
            </Card>
        </div>
    );
}
