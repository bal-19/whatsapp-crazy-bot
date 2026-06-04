import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, LockKeyhole, Sparkles } from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription, Label } from '@/components/ui';

export function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setIsLoading(true);
        try {
            const response = await authService.login({ username, password });
            localStorage.setItem('auth_token', response.token);
            navigate('/');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.25),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.22),transparent_30%),linear-gradient(180deg,#f5fbf7_0%,#eef6f2_100%)]" />
            <div className="absolute left-[10%] top-[12%] h-48 w-48 rounded-full bg-amber-200/30 blur-3xl" />
            <div className="absolute bottom-[10%] right-[12%] h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />

            <div className="relative grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_420px]">
                <Card className="mesh-card hidden lg:block">
                    <CardContent className="flex h-full flex-col justify-between p-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                                <Sparkles className="h-3.5 w-3.5" />
                                Dashboard Refresh
                            </div>
                            <h1 className="mt-6 text-5xl font-bold leading-tight text-slate-900">
                                WhatsApp bot yang rapi di backend, dan sekarang rapi juga tampilannya.
                            </h1>
                            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
                                Satu tempat untuk memantau QR pairing, percakapan, analytics, konfigurasi persona,
                                dan log sistem dengan nuansa visual yang lebih modern.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-[1.25rem] bg-white/80 p-4 shadow-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Realtime</p>
                                <p className="mt-2 text-lg font-bold text-slate-900">Conversations</p>
                            </div>
                            <div className="rounded-[1.25rem] bg-white/80 p-4 shadow-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Persona</p>
                                <p className="mt-2 text-lg font-bold text-slate-900">Config Studio</p>
                            </div>
                            <div className="rounded-[1.25rem] bg-white/80 p-4 shadow-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Health</p>
                                <p className="mt-2 text-lg font-bold text-slate-900">Analytics & Logs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="w-full">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Masuk Dashboard</CardTitle>
                                <CardDescription>Kelola bot WhatsApp dari satu tempat.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
                            <div className="rounded-[1.25rem] bg-muted/50 p-4 text-sm text-slate-600">
                                Gunakan akun admin yang sudah tersimpan di database `admin_users`.
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    className="rounded-2xl bg-white/90"
                                    value={username}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    className="rounded-2xl bg-white/90"
                                    type="password"
                                    value={password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button className="w-full rounded-2xl" type="submit" disabled={isLoading}>
                                <LockKeyhole className="h-4 w-4" />
                                {isLoading ? 'Masuk...' : 'Masuk'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
