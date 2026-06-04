import { Activity, Gauge, MessageCircle, Sparkles, Timer } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge, StatCard, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { MessageVolumeChart } from '@/components/features/analytics/MessageVolumeChart';
import { WhatsAppQrCard } from '@/components/features/dashboard/WhatsAppQrCard';
import { useBotStore } from '@/stores/botStore';
import { useConversationStore } from '@/stores/conversationStore';
import { formatConversationSubtitle, formatConversationTitle, formatDate } from '@/lib/utils';

const ACTIVE_COMMANDS = [
    '/list atau /help untuk daftar command',
    '/reset untuk reset percakapan scope aktif',
    '/resetmemory untuk hapus memory personal scope aktif',
    'Kirim gambar + caption untuk analisis gambar',
    'Bilang "bicara dengan manusia" untuk handoff'
];

export function DashboardPage() {
    const { status, totalMessagesToday, analytics, queueSize, qrCode, isResettingAuth, loadAnalytics, resetAuth } =
        useBotStore();
    const { conversations, loadConversations } = useConversationStore();

    useEffect(() => {
        void loadConversations();
        void loadAnalytics();
    }, [loadAnalytics, loadConversations]);

    return (
        <div className="space-y-6 sm:space-y-7 lg:space-y-8">
            <Card className="mesh-card overflow-hidden">
                <CardContent className="grid gap-6 p-6 sm:gap-7 sm:p-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:p-8">
                    <div className="space-y-5">
                        <Badge variant="secondary" className="w-fit rounded-full border-0 bg-white/80 px-3.5 py-1.5 text-emerald-700">
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            Live Control Center
                        </Badge>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">Dashboard Operasional Bot</h1>
                            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                                Semua data inti tetap sama, tapi sekarang tampilannya lebih fokus ke prioritas harian:
                                status bot, volume pesan, antrian Gemini, dan percakapan terbaru.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-emerald-100 dark:border-emerald-600/30 bg-white/80 dark:bg-slate-800 p-5 shadow-sm sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">Quick Pulse</p>
                        <div className="mt-5 space-y-3.5">
                            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 px-5 py-3.5">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Status koneksi</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{status === 'connected' ? 'Online' : status}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-700/40 px-5 py-3.5">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Pesan hari ini</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{totalMessagesToday}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-amber-50 dark:bg-amber-950/40 px-5 py-3.5">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Queue Gemini</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{queueSize}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Status Bot" value={status === 'connected' ? 'Online' : status} icon={Activity} color="green" />
                <StatCard label="Pesan Hari Ini" value={totalMessagesToday} icon={MessageCircle} />
                <StatCard label="Queue Gemini" value={queueSize} icon={Gauge} color={queueSize > 20 ? 'yellow' : 'default'} />
                <StatCard label="Avg Response" value={`${analytics?.avg_response_time_ms ?? 0} ms`} icon={Timer} />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:gap-7 2xl:grid-cols-[minmax(0,1fr)_400px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Engagement Trend 7 Hari</CardTitle>
                        <CardDescription>Volume pesan aktual untuk 7 hari terakhir.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MessageVolumeChart data={analytics?.daily_message_volume ?? []} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Percakapan Terbaru</CardTitle>
                            <CardDescription>5 thread paling baru yang masuk ke bot.</CardDescription>
                        </div>
                        <Link className="text-sm font-semibold text-primary hover:underline" to="/conversations">
                            Lihat Semua
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-3.5">
                        {conversations.slice(0, 5).map((conversation) => (
                            <div key={conversation.contact_id} className="rounded-[1.25rem] border border-white/70 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800 p-4 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {formatConversationTitle(conversation.contact_id, conversation.contact_name)}
                                    </p>
                                    <span className="text-[11px] text-muted-foreground">{formatDate(conversation.last_message_at)}</span>
                                </div>
                                {formatConversationSubtitle(conversation.contact_id, conversation.contact_name, conversation.group_name) ? (
                                    <p className="mt-1 truncate text-[11px] text-emerald-700 dark:text-emerald-400">
                                        {formatConversationSubtitle(conversation.contact_id, conversation.contact_name, conversation.group_name)}
                                    </p>
                                ) : null}
                                <p className="mt-2 truncate text-xs leading-relaxed text-muted-foreground">{conversation.last_message}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:gap-7 2xl:grid-cols-[minmax(0,1fr)_340px]">
                <WhatsAppQrCard
                    status={status}
                    qrCode={qrCode}
                    isResettingAuth={isResettingAuth}
                    onResetAuth={() => void resetAuth()}
                />

                <Card className="mesh-card">
                    <CardHeader>
                        <CardTitle>Catatan Operasional</CardTitle>
                        <CardDescription>Panel ringkas agar tim cepat membaca kondisi sistem.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3.5 text-sm text-slate-600 dark:text-slate-400">
                        <div className="rounded-2xl bg-white/80 dark:bg-slate-800 p-4 leading-relaxed">
                            Bila `Queue Gemini` mulai naik, prioritaskan cek rate limit atau lonjakan traffic grup.
                        </div>
                        <div className="rounded-2xl bg-white/80 dark:bg-slate-800 p-4 leading-relaxed">
                            QR pairing tetap tampil hanya saat bot belum connected, jadi alurnya masih aman seperti sebelumnya.
                        </div>
                        <div className="rounded-2xl bg-white/80 dark:bg-slate-800 p-4 leading-relaxed">
                            Semua konten halaman tetap sama, yang berubah hanya struktur visual dan hirarki informasinya.
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Command Aktif</CardTitle>
                        <CardDescription>Ringkasan fitur user-facing yang saat ini sudah tersedia di bot.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                        {ACTIVE_COMMANDS.map((command) => (
                            <div key={command} className="rounded-2xl bg-white/80 dark:bg-slate-800 p-4 leading-relaxed">
                                {command}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
