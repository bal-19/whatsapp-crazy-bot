import { useEffect } from 'react';
import { ConfigForm } from '@/components/features/config/ConfigForm';
import { PromptTester } from '@/components/features/config/PromptTester';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useConfigStore } from '@/stores/configStore';
import { useToast } from '@/components/ui/use-toast';

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
    const { toast } = useToast();

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
        </div>
    );
}
