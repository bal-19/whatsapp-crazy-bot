import { useEffect, useState } from 'react';
import { ConfigForm } from '@/components/features/config/ConfigForm';
import { PromptTester } from '@/components/features/config/PromptTester';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui';
import { useConfigStore } from '@/stores/configStore';
import { useToast } from '@/components/ui/use-toast';
import { configService } from '@/lib/services/configService';
import { useConversationStore } from '@/stores/conversationStore';
import { useBotStore } from '@/stores/botStore';
import { AlertTriangle, Trash2 } from 'lucide-react';

export function ConfigPage() {
    const {
        draft,
        isDirty,
        isSaving,
        isTesting,
        testReply,
        loadConfig,
        updateField,
        saveConfig,
        resetToDefaults,
        testPrompt
    } = useConfigStore();
    const { clearState, loadConversations } = useConversationStore();
    const { loadAnalytics, loadStatus } = useBotStore();
    const { toast } = useToast();
    const [isPurgingData, setIsPurgingData] = useState(false);
    const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false);

    useEffect(() => {
        void loadConfig();
    }, [loadConfig]);

    async function handleSave() {
        await saveConfig();
        toast({
            title: 'Berhasil',
            description: 'Konfigurasi tersimpan'
        });
    }

    async function handlePurgeOperationalData() {
        setIsPurgingData(true);
        try {
            const result = await configService.purgeOperationalData();
            clearState();
            await Promise.all([loadConversations(), loadAnalytics(), loadStatus()]);
            setIsPurgeDialogOpen(false);
            toast({
                title: 'Data operasional dibersihkan',
                description: `${result.contactsDeleted} contact, ${result.messagesDeleted} pesan, dan ${result.memoriesDeleted} memory dihapus.`
            });
        } finally {
            setIsPurgingData(false);
        }
    }

    return (
        <div className="space-y-6 sm:space-y-7 lg:space-y-8">
            <Card className="mesh-card">
                <CardContent className="flex flex-wrap items-end justify-between gap-5 p-6 sm:p-7 lg:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Bot Persona Studio</p>
                        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Konfigurasi Bot</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">Atur persona, tone, dan perilaku bot dengan layout form yang lebih enak dibaca tanpa mengubah field atau logic yang sudah ada.</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 dark:bg-slate-800 px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400 shadow-sm">
                        {isDirty ? 'Ada perubahan belum disimpan' : 'Semua perubahan sudah sinkron'}
                    </div>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 gap-6 sm:gap-7 2xl:grid-cols-[1fr_400px]">
                <Card>
                    <CardHeader>
                        <CardTitle>Pengaturan Umum</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ConfigForm
                            draft={draft}
                            isDirty={isDirty}
                            isSaving={isSaving}
                            onFieldChange={updateField}
                            onSave={() => void handleSave()}
                            onReset={resetToDefaults}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Prompt Tester</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PromptTester reply={testReply} isTesting={isTesting} onTest={(message) => void testPrompt(message)} />
                    </CardContent>
                </Card>
            </div>
            <Card className="border-rose-200/80 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Hapus seluruh data operasional bot tanpa menyentuh tabel `admin_users`, `bot_settings`, `system_logs`, dan `whatsapp_auth_state`.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-2xl text-sm leading-relaxed text-rose-900/80 dark:text-rose-100/80">
                        Aksi ini akan membersihkan contact, messages, dan personal memory. Cocok untuk reset data operasional tanpa merusak akses admin, konfigurasi bot, log sistem, atau pairing WhatsApp.
                    </p>
                    <AlertDialog open={isPurgeDialogOpen} onOpenChange={setIsPurgeDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isPurgingData} className="w-full sm:w-auto">
                                <Trash2 className="h-4 w-4" />
                                {isPurgingData ? 'Menghapus data...' : 'Hapus Data Operasional'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus data operasional bot?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Contact, messages, dan personal memory akan dihapus permanen. Tabel
                                    `admin_users`, `bot_settings`, `system_logs`, dan `whatsapp_auth_state`
                                    tetap dipertahankan.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isPurgingData}>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(event) => {
                                        event.preventDefault();
                                        void handlePurgeOperationalData();
                                    }}
                                    disabled={isPurgingData}
                                >
                                    {isPurgingData ? 'Menghapus data...' : 'Ya, hapus sekarang'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
}
