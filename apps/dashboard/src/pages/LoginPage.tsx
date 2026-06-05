import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, LockKeyhole, Sparkles } from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription, Label } from '@/components/ui';

export function LoginPage() {
    const navigate = useNavigate();
    const setSession = useAuthStore((state) => state.setSession);
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setIsLoading(true);
        try {
            const response = await authService.login({ username, password });
            setSession(response.token, response.user);
            navigate('/');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6 bg-background dark:bg-slate-950">
            <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.15),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_30%),linear-gradient(180deg,#0f172a_0%,#1e293b_100%)] bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.25),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.22),transparent_30%),linear-gradient(180deg,#f5fbf7_0%,#eef6f2_100%)]" />
            <div className="absolute left-[10%] top-[12%] h-48 w-48 rounded-full bg-amber-200/30 dark:bg-amber-600/15 blur-3xl" />
            <div className="absolute bottom-[10%] right-[12%] h-64 w-64 rounded-full bg-emerald-200/30 dark:bg-emerald-600/15 blur-3xl" />

            <div className="relative grid w-full max-w-md gap-6">
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
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    className="rounded-2xl bg-white/90 dark:bg-slate-800"
                                    value={username}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    className="rounded-2xl bg-white/90 dark:bg-slate-800"
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
