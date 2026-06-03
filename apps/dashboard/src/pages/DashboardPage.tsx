import { Activity, Gauge, MessageCircle, Timer } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StatCard, Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import { MessageVolumeChart } from '../components/features/analytics/MessageVolumeChart';
import { useBotStore } from '../stores/botStore';
import { useConversationStore } from '../stores/conversationStore';
import { formatDate } from '../lib/utils';

export function DashboardPage() {
    const { status, totalMessagesToday, analytics, queueSize, loadAnalytics } = useBotStore();
    const { conversations, loadConversations } = useConversationStore();

    useEffect(() => {
        void loadConversations();
        void loadAnalytics();
    }, [loadAnalytics, loadConversations]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Snapshot bot hari ini.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Status Bot" value={status === 'connected' ? 'Online' : status} icon={Activity} color="green" />
                <StatCard label="Pesan Hari Ini" value={totalMessagesToday} icon={MessageCircle} />
                <StatCard label="Queue Gemini" value={queueSize} icon={Gauge} color={queueSize > 20 ? 'yellow' : 'default'} />
                <StatCard label="Avg Response" value={`${analytics?.avg_response_time_ms ?? 0} ms`} icon={Timer} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Engagement Trend 7 Hari</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MessageVolumeChart messagesToday={analytics?.messages_today ?? totalMessagesToday} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle>Percakapan Terbaru</CardTitle>
                        <Link className="text-sm font-semibold text-primary hover:underline" to="/conversations">
                            Lihat Semua
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {conversations.slice(0, 5).map((conversation) => (
                            <div key={conversation.contact_id} className="rounded-lg border bg-card p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {conversation.contact_name ?? conversation.contact_id}
                                    </p>
                                    <span className="text-[11px] text-muted-foreground">{formatDate(conversation.last_message_at)}</span>
                                </div>
                                <p className="mt-1 truncate text-xs text-muted-foreground">{conversation.last_message}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
