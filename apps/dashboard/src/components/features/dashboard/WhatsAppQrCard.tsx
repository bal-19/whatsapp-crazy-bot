import { QrCode, RefreshCcw, Smartphone } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import type { BotStatus } from '@whatsapp-bot/shared';

interface WhatsAppQrCardProps {
    status: BotStatus;
    qrCode: string | null;
    isResettingAuth: boolean;
    onResetAuth: () => void;
}

export function WhatsAppQrCard({ status, qrCode, isResettingAuth, onResetAuth }: WhatsAppQrCardProps) {
    const showQr = status !== 'connected' && Boolean(qrCode);

    return (
        <Card className="overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-lime-50">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                        {showQr ? <QrCode className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                    </div>
                    <div>
                        <CardTitle className="text-lg">WhatsApp Pairing</CardTitle>
                        <CardDescription>
                            {showQr
                                ? 'Scan QR ini dari WhatsApp di ponsel untuk menyambungkan bot.'
                                : status === 'connected'
                                    ? 'Bot sudah tersambung. QR disembunyikan biar tidak dipakai ulang.'
                                    : 'Menunggu QR dari server. Kalau belum muncul, coba restart bot.'}
                        </CardDescription>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={onResetAuth} disabled={isResettingAuth}>
                    <RefreshCcw className={isResettingAuth ? 'animate-spin' : ''} />
                    {isResettingAuth ? 'Resetting...' : 'Reset Auth'}
                </Button>
            </CardHeader>

            <CardContent>
                <div className="rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-sm">
                    {showQr ? (
                        <div className="mx-auto max-w-[320px] space-y-4">
                            <img
                                src={qrCode!}
                                alt="WhatsApp QR code"
                                className="w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                            />
                            <p className="text-center text-xs leading-5 text-slate-500">
                                Buka WhatsApp di ponsel, masuk ke Perangkat Tertaut, lalu scan QR ini.
                            </p>
                        </div>
                    ) : (
                        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 px-6 text-center">
                            <Smartphone className="mb-4 h-10 w-10 text-emerald-600" />
                            <p className="text-sm font-semibold text-slate-800">
                                {status === 'connected' ? 'WhatsApp sudah aktif' : 'QR belum tersedia'}
                            </p>
                            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                                {status === 'connected'
                                    ? 'Session sudah tersimpan di database, jadi normalnya tidak perlu scan ulang.'
                                    : 'Begitu server menerima QR pairing baru, tampilannya akan muncul otomatis di sini.'}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
