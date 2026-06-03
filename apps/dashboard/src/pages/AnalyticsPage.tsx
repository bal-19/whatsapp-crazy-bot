import { AlertTriangle, Clock3, MessageCircle, Users } from 'lucide-react';
import { useEffect } from 'react';
import { MessageVolumeChart } from '../components/features/analytics/MessageVolumeChart';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { StatCard } from '../components/ui/StatCard';
import { useBotStore } from '../stores/botStore';

export function AnalyticsPage() {
    const { analytics, loadAnalytics } = useBotStore();

    useEffect(() => {
        void loadAnalytics();
    }, [loadAnalytics]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-sm text-muted-foreground">Ringkasan performa dan kesehatan bot.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                    <MessageVolumeChart messagesToday={analytics?.messages_today ?? 0} />
                </CardContent>
            </Card>
        </div>
    );
}
