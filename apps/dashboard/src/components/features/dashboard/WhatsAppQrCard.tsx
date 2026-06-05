import { QrCode, RefreshCcw, Smartphone } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { BotStatus } from '@whatsapp-bot/shared';

interface WhatsAppQrCardProps {
    status: BotStatus;
    qrCode: string | null;
    isResettingAuth: boolean;
    canResetAuth?: boolean;
    onResetAuth: () => void;
}

export function WhatsAppQrCard({ status, qrCode, isResettingAuth, canResetAuth = true, onResetAuth }: WhatsAppQrCardProps) {
    const showQr = status !== 'connected' && Boolean(qrCode);

    return (
        <Card className="mesh-card overflow-hidden border-emerald-200/60">
            <CardHeader className="pb-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shrink-0 mt-0.5">
                            {showQr ? <QrCode className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                        </div>
                        <div>
                            <CardTitle className="text-base">WhatsApp Pairing</CardTitle>
                            <CardDescription className="mt-1">
                                {showQr
                                    ? 'Scan QR dari WhatsApp di ponsel untuk menyambungkan bot.'
                                    : status === 'connected'
                                        ? 'Bot sudah tersambung. Tidak perlu scan ulang.'
                                        : 'Menunggu QR dari server. Coba restart bot jika belum muncul.'}
                            </CardDescription>
                        </div>
                    </div>
                    {canResetAuth ? (
                        <Button variant="outline" size="sm" onClick={onResetAuth} disabled={isResettingAuth} className="rounded-lg shrink-0">
                            <RefreshCcw className={cn('h-3.5 w-3.5', isResettingAuth && 'animate-spin')} />
                            {isResettingAuth ? 'Resetting...' : 'Reset Auth'}
                        </Button>
                    ) : null}
                </div>
            </CardHeader>

            <CardContent>
                <div className="rounded-xl border border-emerald-100/60 bg-white/70 p-5 shadow-sm">
                    {showQr ? (
                        <div className="mx-auto max-w-xs space-y-4">
                            <img
                                src={qrCode!}
                                alt="WhatsApp QR code"
                                className="w-full rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
                            />
                            <p className="text-center text-xs leading-relaxed text-slate-600">
                                Buka WhatsApp → Perangkat Tertaut → scan QR code ini
                            </p>
                        </div>
                    ) : (
                        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 px-6 text-center">
                            <Smartphone className="mb-3 h-8 w-8 text-emerald-600/60" />
                            <p className="text-sm font-semibold text-slate-800">
                                {status === 'connected' ? 'WhatsApp sudah aktif' : 'QR belum tersedia'}
                            </p>
                            <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-600">
                                {status === 'connected'
                                    ? 'Session tersimpan. Normalnya tidak perlu scan ulang.'
                                    : 'QR akan muncul otomatis begitu tersedia dari server.'}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
