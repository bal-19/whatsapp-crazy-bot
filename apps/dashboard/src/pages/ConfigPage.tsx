import { useEffect } from 'react';
import { ConfigForm } from '../components/features/config/ConfigForm';
import { PromptTester } from '../components/features/config/PromptTester';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useConfigStore } from '../stores/configStore';
import { useToast } from '../components/ui/use-toast';

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
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Konfigurasi Bot</h1>
                <p className="text-sm text-muted-foreground">Atur persona, tone, dan perilaku bot.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
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
