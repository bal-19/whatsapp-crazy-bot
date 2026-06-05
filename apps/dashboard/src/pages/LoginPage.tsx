import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '@/lib/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription, Label } from '@/components/ui';
import { BrandMark } from '@/components/layout/BrandMark';
import { smoothTransition } from '@/lib/motion';

export function LoginPage() {
    const navigate = useNavigate();
    const setSession = useAuthStore((state) => state.setSession);
    const [username, setUsername] = useState('');
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
            <motion.div
                className="absolute left-[10%] top-[12%] h-48 w-48 rounded-full bg-amber-200/30 dark:bg-amber-600/15 blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut'
                }}
            />
            <motion.div
                className="absolute bottom-[10%] right-[12%] h-64 w-64 rounded-full bg-emerald-200/30 dark:bg-emerald-600/15 blur-3xl"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 10,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                    delay: 1
                }}
            />

            <motion.div
                className="relative grid w-full max-w-md gap-6"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={smoothTransition}
            >
                <Card className="w-full">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <motion.div
                                initial={{ rotate: -180, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                transition={{ delay: 0.2, ...smoothTransition }}
                                whileHover={{ rotate: 360, scale: 1.1 }}
                            >
                                <BrandMark className="h-12 w-12 rounded-2xl bg-transparent ring-primary/10 dark:bg-slate-950" />
                            </motion.div>
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3, ...smoothTransition }}
                            >
                                <CardTitle>Masuk Dashboard</CardTitle>
                                <CardDescription>Kelola bot WhatsApp dari satu tempat.</CardDescription>
                            </motion.div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4, ...smoothTransition }}
                            >
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    className="rounded-2xl bg-white/90 dark:bg-slate-800"
                                    value={username}
                                    placeholder='username'
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                />
                            </motion.div>
                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5, ...smoothTransition }}
                            >
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    className="rounded-2xl bg-white/90 dark:bg-slate-800"
                                    type="password"
                                    value={password}
                                    placeholder='password'
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, ...smoothTransition }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button className="w-full rounded-2xl" type="submit" disabled={isLoading}>
                                    <LockKeyhole className="h-4 w-4" />
                                    {isLoading ? 'Masuk...' : 'Masuk'}
                                </Button>
                            </motion.div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
